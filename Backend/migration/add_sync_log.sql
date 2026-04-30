-- Registro de sincronizaciones desde n8n → SIGAF
-- Ejecutar: psql -U sigaf_user -d sigaf -f Backend/migration/add_sync_log.sql

CREATE TABLE IF NOT EXISTS sync_log (
  id               SERIAL       PRIMARY KEY,
  source_sheet     VARCHAR(60)  NOT NULL,
  insertados       INTEGER      NOT NULL DEFAULT 0,
  fallidos         INTEGER      NOT NULL DEFAULT 0,
  placas_generadas JSONB        NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log (created_at DESC);
