-- ═══════════════════════════════════════════════════════════════════════════
-- SIGAF — Sistema Integrado de Gestión de Activos Fijos
-- Corporación Universitaria Americana · Sede Barranquilla
-- Schema v1.0 · 2026
-- ═══════════════════════════════════════════════════════════════════════════

-- ── EXTENSIONES ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── FUNCIÓN UPDATED_AT (reutilizable en todos los triggers) ─────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════════
-- CATÁLOGOS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE catalog_cities (
  code  CHAR(1)       PRIMARY KEY,
  name  VARCHAR(100)  NOT NULL UNIQUE
);

CREATE TABLE catalog_buildings (
  id         SERIAL        PRIMARY KEY,
  city_code  CHAR(1)       NOT NULL REFERENCES catalog_cities(code),
  code       CHAR(2)       NOT NULL,
  name       VARCHAR(100)  NOT NULL,
  active     BOOLEAN       NOT NULL DEFAULT true,
  UNIQUE (city_code, code)
);

CREATE TABLE catalog_asset_types (
  code    CHAR(2)       PRIMARY KEY,
  name    VARCHAR(120)  NOT NULL UNIQUE,
  active  BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE catalog_areas (
  id      SERIAL        PRIMARY KEY,
  name    VARCHAR(200)  NOT NULL UNIQUE,
  active  BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE catalog_people (
  id          SERIAL        PRIMARY KEY,
  full_name   VARCHAR(200)  NOT NULL,
  email       VARCHAR(200),
  area_id     INTEGER       REFERENCES catalog_areas(id),
  active      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- SECUENCIAS DE PLACAS
-- Cada combinación ciudad+edificio+tipo tiene su propio contador.
-- La función generate_plate() garantiza atomicidad (no hay duplicados).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE plate_sequences (
  city_code        CHAR(1)  NOT NULL,
  building_code    CHAR(2)  NOT NULL,
  asset_type_code  CHAR(2)  NOT NULL REFERENCES catalog_asset_types(code),
  last_sequence    INTEGER  NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city_code, building_code, asset_type_code)
);

-- Función de generación de placa: [C][EE][TT][CCCCCCC] — 12 dígitos
-- Usa UPDATE ... RETURNING para garantizar atomicidad bajo carga concurrente.
CREATE OR REPLACE FUNCTION generate_plate(
  p_city_code       CHAR(1),
  p_building_code   CHAR(2),
  p_asset_type_code CHAR(2)
) RETURNS VARCHAR(12) AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE plate_sequences
     SET last_sequence = last_sequence + 1,
         updated_at    = NOW()
   WHERE city_code       = p_city_code
     AND building_code   = p_building_code
     AND asset_type_code = p_asset_type_code
  RETURNING last_sequence INTO v_next;

  IF NOT FOUND THEN
    INSERT INTO plate_sequences (city_code, building_code, asset_type_code, last_sequence)
    VALUES (p_city_code, p_building_code, p_asset_type_code, 1)
    RETURNING last_sequence INTO v_next;
  END IF;

  RETURN p_city_code
      || p_building_code
      || p_asset_type_code
      || LPAD(v_next::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════════
-- ACTIVOS — INVENTARIO PRINCIPAL
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE assets (
  id  SERIAL  PRIMARY KEY,

  -- Identificación
  plate           VARCHAR(12)   UNIQUE,
  plate_status    VARCHAR(30)   NOT NULL DEFAULT 'OK',
  plate_original  VARCHAR(20),

  -- Descripción del bien
  name              VARCHAR(300)  NOT NULL,
  description       TEXT,
  asset_type_code   CHAR(2)       REFERENCES catalog_asset_types(code),
  puc_account       VARCHAR(20),

  -- Especificaciones técnicas
  brand            VARCHAR(100),
  model            VARCHAR(100),
  serial           VARCHAR(200),
  quantity         INTEGER       NOT NULL DEFAULT 1,
  reference_value  NUMERIC(15,2),

  -- Ubicación física
  city_code    CHAR(1)   REFERENCES catalog_cities(code),
  building_id  INTEGER   REFERENCES catalog_buildings(id),
  floor        VARCHAR(50),
  block        VARCHAR(50),
  location     VARCHAR(200),

  -- Responsabilidad
  area_id          INTEGER  REFERENCES catalog_areas(id),
  person_id        INTEGER  REFERENCES catalog_people(id),
  responsable_raw  VARCHAR(300),   -- valor textual original del Excel

  -- Ciclo de vida
  status              VARCHAR(30)  NOT NULL DEFAULT 'ACTIVO',
  incorporation_year  INTEGER,
  acquisition_date    DATE,
  source_sheet        VARCHAR(60),  -- hoja Excel de origen

  -- Trazabilidad
  content_hash  VARCHAR(64),   -- FNV-1a fingerprint para dedup en sync
  notes         TEXT,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_plate_length CHECK (plate IS NULL OR LENGTH(plate) = 12),
  CONSTRAINT chk_status CHECK (
    status IN ('ACTIVO','BAJA','EN_TRASLADO','EN_MANTENIMIENTO','DADO_DE_BAJA')
  ),
  CONSTRAINT chk_plate_status CHECK (
    plate_status IN ('OK','GENERADA','DUPLICADA','GRUPO_ERRADO','FORMATO_INVALIDO','REQUIERE_REVISION')
  )
);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices de consulta frecuente
CREATE INDEX idx_assets_plate           ON assets(plate);
CREATE INDEX idx_assets_type            ON assets(asset_type_code);
CREATE INDEX idx_assets_building        ON assets(building_id);
CREATE INDEX idx_assets_status          ON assets(status);
CREATE INDEX idx_assets_year            ON assets(incorporation_year);
CREATE INDEX idx_assets_area            ON assets(area_id);
CREATE INDEX idx_assets_serial          ON assets(serial) WHERE serial IS NOT NULL;
CREATE INDEX idx_assets_name_fts        ON assets USING gin(to_tsvector('spanish', name));

-- ════════════════════════════════════════════════════════════════════════════
-- HISTORIAL DE ACTIVOS — AUDITORÍA COMPLETA
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE asset_history (
  id             SERIAL        PRIMARY KEY,
  asset_id       INTEGER       NOT NULL REFERENCES assets(id),
  action         VARCHAR(50)   NOT NULL,   -- CREATED, UPDATED, TRANSFERRED, WRITTEN_OFF, …
  field_changed  VARCHAR(100),
  old_value      TEXT,
  new_value      TEXT,
  changed_by     VARCHAR(200),
  changed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  notes          TEXT
);

CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_date  ON asset_history(changed_at);

-- ════════════════════════════════════════════════════════════════════════════
-- TRASLADOS
-- Soporta PERMANENTE (cambio de responsable definitivo)
-- y TRANSITORIO (mantenimiento, préstamo — tiene fecha de retorno esperada).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE transfers (
  id             SERIAL  PRIMARY KEY,
  asset_id       INTEGER NOT NULL REFERENCES assets(id),
  transfer_type  VARCHAR(20) NOT NULL
                   CHECK (transfer_type IN ('PERMANENTE','TRANSITORIO')),

  -- Origen
  from_area_id      INTEGER  REFERENCES catalog_areas(id),
  from_person_id    INTEGER  REFERENCES catalog_people(id),
  from_building_id  INTEGER  REFERENCES catalog_buildings(id),
  from_location     VARCHAR(200),

  -- Destino
  to_area_id      INTEGER  REFERENCES catalog_areas(id),
  to_person_id    INTEGER  REFERENCES catalog_people(id),
  to_building_id  INTEGER  REFERENCES catalog_buildings(id),
  to_location     VARCHAR(200),

  reason           TEXT,
  transfer_date    DATE        NOT NULL,
  expected_return  DATE,        -- solo TRANSITORIO
  actual_return    TIMESTAMPTZ, -- fecha real de retorno

  authorized_by  VARCHAR(200),
  status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                   CHECK (status IN ('ACTIVO','COMPLETADO','CANCELADO')),

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfers_asset  ON transfers(asset_id);
CREATE INDEX idx_transfers_status ON transfers(status);

-- ════════════════════════════════════════════════════════════════════════════
-- BAJAS
-- Flujo: PENDIENTE → APROBADA / RECHAZADA
-- El comité lo forman Vicerrectoría + Dir.Financiero + Contabilidad + C.Interno
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE writeoffs (
  id          SERIAL  PRIMARY KEY,
  asset_id    INTEGER NOT NULL REFERENCES assets(id),
  reason      VARCHAR(50) NOT NULL
                CHECK (reason IN (
                  'OBSOLESCENCIA','MAL_ESTADO','HURTO',
                  'SINIESTRO','DONACION','OTRO'
                )),
  reason_detail  TEXT,

  requested_by  VARCHAR(200),
  request_date  DATE  NOT NULL,

  committee_approved  BOOLEAN,
  committee_date      DATE,
  committee_members   JSONB,       -- [{nombre, cargo}, …]

  resolution_number  VARCHAR(100),
  approved_by        VARCHAR(200),
  approved_at        TIMESTAMPTZ,

  status      VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                CHECK (status IN ('PENDIENTE','APROBADA','RECHAZADA')),
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_writeoffs_asset  ON writeoffs(asset_id);
CREATE INDEX idx_writeoffs_status ON writeoffs(status);

-- ════════════════════════════════════════════════════════════════════════════
-- ACTAS
-- Tres tipos: ENTREGA (asignación), SALIDA (desvinculación), TRASLADO
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE actas (
  id           SERIAL  PRIMARY KEY,
  acta_type    VARCHAR(20)  NOT NULL
                 CHECK (acta_type IN ('ENTREGA','SALIDA','TRASLADO')),
  acta_number  VARCHAR(50)  UNIQUE,

  -- Persona y área (denormalizados para registro histórico)
  person_id    INTEGER  REFERENCES catalog_people(id),
  person_name  VARCHAR(200),
  area_id      INTEGER  REFERENCES catalog_areas(id),
  area_name    VARCHAR(200),

  transfer_id  INTEGER  REFERENCES transfers(id),

  generated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  generated_by  VARCHAR(200),
  pdf_path      VARCHAR(500),
  notes         TEXT
);

CREATE TABLE acta_assets (
  acta_id   INTEGER  NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
  asset_id  INTEGER  NOT NULL REFERENCES assets(id),
  PRIMARY KEY (acta_id, asset_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- INVENTARIO FÍSICO
-- Anual + semestral según P AF 011 v3.0
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE physical_inventories (
  id              SERIAL  PRIMARY KEY,
  period          VARCHAR(20)  NOT NULL,     -- "2025-S1", "2025-ANUAL"
  inventory_type  VARCHAR(20)  NOT NULL
                    CHECK (inventory_type IN ('SEMESTRAL','ANUAL')),
  started_at      DATE  NOT NULL,
  completed_at    DATE,
  conducted_by    VARCHAR(200),
  status          VARCHAR(20)  NOT NULL DEFAULT 'EN_PROCESO'
                    CHECK (status IN ('EN_PROCESO','COMPLETADO','CANCELADO')),
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE physical_inventory_items (
  id            SERIAL  PRIMARY KEY,
  inventory_id  INTEGER  NOT NULL REFERENCES physical_inventories(id),
  asset_id      INTEGER  NOT NULL REFERENCES assets(id),
  found         BOOLEAN  NOT NULL,
  location_ok   BOOLEAN,
  condition     VARCHAR(20)
                  CHECK (condition IN ('BUENO','REGULAR','MALO','NO_ENCONTRADO')),
  verified_by   VARCHAR(200),
  verified_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  notes         TEXT,
  UNIQUE (inventory_id, asset_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ════════════════════════════════════════════════════════════════════════════

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO sigaf_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sigaf_user;
GRANT EXECUTE ON ALL FUNCTIONS        IN SCHEMA public TO sigaf_user;
