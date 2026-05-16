-- ============================================================
-- SIGAF — Módulo Paz y Salvo / Actas de Devolución
-- Migración: catalog_people (enriquecimiento) + tablas nuevas
-- ============================================================

-- ── Fase 1.1 — Enriquecer catalog_people con identidad del funcionario ────────
ALTER TABLE catalog_people
  ADD COLUMN IF NOT EXISTS identificacion      VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS cargo               VARCHAR(200),
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date   DATE,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
-- contract_end_date NULL = contrato indefinido
-- updated_at requerido por importer idempotente (ON CONFLICT DO UPDATE SET updated_at = NOW())

-- ── Fase 1.2 — Tabla de casos de paz y salvo ─────────────────────────────────
CREATE TABLE IF NOT EXISTS paz_y_salvo_cases (
  id                  SERIAL PRIMARY KEY,
  person_id           INTEGER NOT NULL REFERENCES catalog_people(id),
  acta_number         VARCHAR(20) NOT NULL UNIQUE,        -- PYS-2026-001
  status              VARCHAR(50)  NOT NULL DEFAULT 'PENDIENTE',
  motivo_terminacion  VARCHAR(60)  NOT NULL DEFAULT 'DESVINCULACION',
  contract_end_date   DATE,                               -- snapshot al generar el acta
  area_snapshot       VARCHAR(200),                       -- snapshot nombre área
  observaciones       TEXT,
  -- Google Doc / PDF
  docx_drive_url      TEXT,
  pdf_drive_url       TEXT,
  -- n8n
  n8n_event_id        VARCHAR(100),
  n8n_webhook_sent_at TIMESTAMP WITH TIME ZONE,
  n8n_notified        BOOLEAN NOT NULL DEFAULT FALSE,
  n8n_error           TEXT,                               -- mensaje del último fallo del webhook (retry manual)
  -- firma
  signed_at           TIMESTAMP WITH TIME ZONE,
  signed_by           VARCHAR(200),
  -- auditoría
  created_by          INTEGER REFERENCES system_users(id),
  notes               TEXT,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pys_cases_person_id ON paz_y_salvo_cases(person_id);
CREATE INDEX IF NOT EXISTS idx_pys_cases_status    ON paz_y_salvo_cases(status);

-- ── Fase 1.3 — Snapshot inmutable de activos (nunca se actualiza post-acta) ──
CREATE TABLE IF NOT EXISTS paz_y_salvo_items (
  id            SERIAL PRIMARY KEY,
  case_id       INTEGER NOT NULL REFERENCES paz_y_salvo_cases(id) ON DELETE CASCADE,
  item_number   INTEGER NOT NULL,
  asset_id      INTEGER REFERENCES assets(id),   -- nullable (entrada manual permitida)
  plate_raw     VARCHAR(20),                      -- snapshot placa al momento del acta
  name_raw      VARCHAR(300),                     -- snapshot nombre activo
  estado_fisico VARCHAR(20) NOT NULL DEFAULT 'BUENO',  -- BUENO | REGULAR | MALO
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
