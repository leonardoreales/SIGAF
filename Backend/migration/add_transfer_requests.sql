-- Migration: create transfer_requests + transfer_request_items
-- Run AFTER add_transfers.sql

-- ── Función de numeración de solicitudes ─────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  ym  TEXT := TO_CHAR(NOW(), 'YYYYMM');
  seq TEXT;
BEGIN
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') INTO seq
  FROM transfer_requests
  WHERE request_number LIKE 'SOL-' || ym || '-%';
  RETURN 'SOL-' || ym || '-' || seq;
END;
$$ LANGUAGE plpgsql;

-- ── Tabla de solicitudes (una por email/DOCX recibido) ────────────────────────

CREATE TABLE IF NOT EXISTS transfer_requests (
  id                  SERIAL PRIMARY KEY,
  request_number      VARCHAR(20) NOT NULL UNIQUE,

  -- Datos del correo
  subject             TEXT,
  sender_email        VARCHAR(200),
  received_at         TIMESTAMPTZ,

  -- Contenido extraído
  raw_text            TEXT,
  docx_drive_url      TEXT,
  form_data           JSONB,         -- campos del acta F-AF-039 parseados por n8n

  -- Estado de la solicitud
  status              VARCHAR(20) NOT NULL DEFAULT 'RECIBIDA',
  -- RECIBIDA | REVISION | APROBADA | FIRMADA | RECHAZADA

  -- Firma automática (cuando n8n provee las 3 firmas + campos completos)
  auto_signed         BOOLEAN NOT NULL DEFAULT FALSE,
  signature_entrega   TEXT,          -- base64 del canvas
  signature_recibe    TEXT,
  signature_autoriza  TEXT,
  signed_at           TIMESTAMPTZ,
  signed_by           VARCHAR(200),  -- email del usuario SIGAF que firmó

  notes               TEXT,
  n8n_webhook_sent_at TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transfer_requests_status_idx ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS transfer_requests_sender_idx ON transfer_requests(sender_email);

DROP TRIGGER IF EXISTS transfer_requests_updated_at ON transfer_requests;
CREATE TRIGGER transfer_requests_updated_at
  BEFORE UPDATE ON transfer_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Tabla de ítems (un activo por fila dentro de la solicitud) ────────────────

CREATE TABLE IF NOT EXISTS transfer_request_items (
  id          SERIAL PRIMARY KEY,
  request_id  INTEGER NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,

  -- Activo en SIGAF (puede ser NULL si no se encontró por placa)
  asset_id    INTEGER REFERENCES assets(id),

  -- Datos crudos del DOCX
  plate_raw   VARCHAR(30),
  name_raw    VARCHAR(300),
  serial_raw  VARCHAR(200),
  quantity    INTEGER NOT NULL DEFAULT 1,

  -- Matching contra la base de activos
  matched     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Traslado generado a partir de este ítem (una vez aprobado)
  transfer_id INTEGER REFERENCES transfers(id),

  -- PENDIENTE | EMPAREJADO | TRASLADADO | ERROR
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  notes       TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tri_request_idx ON transfer_request_items(request_id);
CREATE INDEX IF NOT EXISTS tri_asset_idx   ON transfer_request_items(asset_id);

DROP TRIGGER IF EXISTS transfer_request_items_updated_at ON transfer_request_items;
CREATE TRIGGER transfer_request_items_updated_at
  BEFORE UPDATE ON transfer_request_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Extender la tabla transfers con source y request_id ───────────────────────

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS source     VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES transfer_requests(id);
