-- ═══════════════════════════════════════════════════════════════════════════
-- SIGAF — Schema para Supabase (PostgreSQL cloud)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- ANTES de ejecutar este archivo, habilitar en:
-- Dashboard → Database → Extensions:
--   ✅ uuid-ossp
--   ✅ pg_trgm
-- ═══════════════════════════════════════════════════════════════════════════

-- ── EXTENSIONES ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── FUNCIÓN UPDATED_AT ──────────────────────────────────────────────────────
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

CREATE TABLE IF NOT EXISTS catalog_cities (
  code  CHAR(1)       PRIMARY KEY,
  name  VARCHAR(100)  NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS catalog_buildings (
  id         SERIAL        PRIMARY KEY,
  city_code  CHAR(1)       NOT NULL REFERENCES catalog_cities(code),
  code       CHAR(2)       NOT NULL,
  name       VARCHAR(100)  NOT NULL,
  active     BOOLEAN       NOT NULL DEFAULT true,
  UNIQUE (city_code, code)
);

CREATE TABLE IF NOT EXISTS catalog_asset_types (
  code    CHAR(2)       PRIMARY KEY,
  name    VARCHAR(120)  NOT NULL UNIQUE,
  active  BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalog_areas (
  id      SERIAL        PRIMARY KEY,
  name    VARCHAR(200)  NOT NULL UNIQUE,
  active  BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalog_people (
  id          SERIAL        PRIMARY KEY,
  full_name   VARCHAR(200)  NOT NULL,
  email       VARCHAR(200),
  area_id     INTEGER       REFERENCES catalog_areas(id),
  active      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- SECUENCIAS DE PLACAS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS plate_sequences (
  city_code        CHAR(1)  NOT NULL,
  building_code    CHAR(2)  NOT NULL,
  asset_type_code  CHAR(2)  NOT NULL REFERENCES catalog_asset_types(code),
  last_sequence    INTEGER  NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city_code, building_code, asset_type_code)
);

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
-- ACTIVOS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assets (
  id  SERIAL  PRIMARY KEY,

  plate           VARCHAR(12)   UNIQUE,
  plate_status    VARCHAR(30)   NOT NULL DEFAULT 'OK',
  plate_original  VARCHAR(20),

  name              VARCHAR(300)  NOT NULL,
  description       TEXT,
  asset_type_code   CHAR(2)       REFERENCES catalog_asset_types(code),
  puc_account       VARCHAR(20),

  brand            VARCHAR(100),
  model            VARCHAR(100),
  serial           VARCHAR(200),
  quantity         INTEGER       NOT NULL DEFAULT 1,
  reference_value  NUMERIC(15,2),

  city_code    CHAR(1)   REFERENCES catalog_cities(code),
  building_id  INTEGER   REFERENCES catalog_buildings(id),
  floor        VARCHAR(50),
  block        VARCHAR(50),
  location     VARCHAR(200),

  area_id          INTEGER  REFERENCES catalog_areas(id),
  person_id        INTEGER  REFERENCES catalog_people(id),
  responsable_raw  VARCHAR(300),

  status              VARCHAR(30)  NOT NULL DEFAULT 'ACTIVO',
  incorporation_year  INTEGER,
  acquisition_date    DATE,
  source_sheet        VARCHAR(60),

  content_hash  VARCHAR(64),
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

CREATE OR REPLACE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_assets_plate    ON assets(plate);
CREATE INDEX IF NOT EXISTS idx_assets_type     ON assets(asset_type_code);
CREATE INDEX IF NOT EXISTS idx_assets_building ON assets(building_id);
CREATE INDEX IF NOT EXISTS idx_assets_status   ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_year     ON assets(incorporation_year);
CREATE INDEX IF NOT EXISTS idx_assets_area     ON assets(area_id);
CREATE INDEX IF NOT EXISTS idx_assets_serial   ON assets(serial) WHERE serial IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_name_fts ON assets USING gin(to_tsvector('spanish', name));

-- ════════════════════════════════════════════════════════════════════════════
-- HISTORIAL
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS asset_history (
  id             SERIAL        PRIMARY KEY,
  asset_id       INTEGER       NOT NULL REFERENCES assets(id),
  action         VARCHAR(50)   NOT NULL,
  field_changed  VARCHAR(100),
  old_value      TEXT,
  new_value      TEXT,
  changed_by     VARCHAR(200),
  changed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  notes          TEXT
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_date  ON asset_history(changed_at);

-- ════════════════════════════════════════════════════════════════════════════
-- TRASLADOS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transfers (
  id             SERIAL  PRIMARY KEY,
  asset_id       INTEGER NOT NULL REFERENCES assets(id),
  transfer_type  VARCHAR(20) NOT NULL
                   CHECK (transfer_type IN ('PERMANENTE','TRANSITORIO')),

  from_area_id      INTEGER  REFERENCES catalog_areas(id),
  from_person_id    INTEGER  REFERENCES catalog_people(id),
  from_building_id  INTEGER  REFERENCES catalog_buildings(id),
  from_location     VARCHAR(200),

  to_area_id      INTEGER  REFERENCES catalog_areas(id),
  to_person_id    INTEGER  REFERENCES catalog_people(id),
  to_building_id  INTEGER  REFERENCES catalog_buildings(id),
  to_location     VARCHAR(200),

  reason           TEXT,
  transfer_date    DATE        NOT NULL,
  expected_return  DATE,
  actual_return    TIMESTAMPTZ,

  authorized_by  VARCHAR(200),
  status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                   CHECK (status IN ('ACTIVO','COMPLETADO','CANCELADO')),

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_asset  ON transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);

-- ════════════════════════════════════════════════════════════════════════════
-- BAJAS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS writeoffs (
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
  committee_members   JSONB,

  resolution_number  VARCHAR(100),
  approved_by        VARCHAR(200),
  approved_at        TIMESTAMPTZ,

  status      VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                CHECK (status IN ('PENDIENTE','APROBADA','RECHAZADA')),
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writeoffs_asset  ON writeoffs(asset_id);
CREATE INDEX IF NOT EXISTS idx_writeoffs_status ON writeoffs(status);

-- ════════════════════════════════════════════════════════════════════════════
-- ACTAS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS actas (
  id           SERIAL  PRIMARY KEY,
  acta_type    VARCHAR(20)  NOT NULL
                 CHECK (acta_type IN ('ENTREGA','SALIDA','TRASLADO')),
  acta_number  VARCHAR(50)  UNIQUE,

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

CREATE TABLE IF NOT EXISTS acta_assets (
  acta_id   INTEGER  NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
  asset_id  INTEGER  NOT NULL REFERENCES assets(id),
  PRIMARY KEY (acta_id, asset_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- INVENTARIO FÍSICO
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS physical_inventories (
  id              SERIAL  PRIMARY KEY,
  period          VARCHAR(20)  NOT NULL,
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

CREATE TABLE IF NOT EXISTS physical_inventory_items (
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
-- SYNC LOG
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sync_log (
  id               SERIAL       PRIMARY KEY,
  source_sheet     VARCHAR(60)  NOT NULL,
  insertados       INTEGER      NOT NULL DEFAULT 0,
  fallidos         INTEGER      NOT NULL DEFAULT 0,
  placas_generadas JSONB        NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log (created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- CATÁLOGOS SEED
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO catalog_cities (code, name) VALUES ('1', 'BARRANQUILLA')
  ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog_buildings (city_code, code, name) VALUES
  ('1', '01', 'COSMOS'),
  ('1', '02', 'CONSULTORIO JURÍDICO'),
  ('1', '03', '20 DE JULIO'),
  ('1', '04', 'PRADO'),
  ('1', '05', 'ROMELIO'),
  ('1', '06', 'CALLE 79')
  ON CONFLICT (city_code, code) DO NOTHING;

INSERT INTO catalog_asset_types (code, name) VALUES
  ('45', 'PLANTAS, DUCTOS Y TÚNELES'),
  ('55', 'MAQUINARIA Y EQUIPO'),
  ('60', 'EQUIPO MÉDICO Y CIENTÍFICO'),
  ('65', 'MUEBLES, ENSERES Y EQUIPO DE OFICINA'),
  ('70', 'EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN'),
  ('75', 'EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN')
  ON CONFLICT (code) DO NOTHING;
