-- Migration: create transfers table
-- Run BEFORE add_transfer_requests.sql

CREATE TABLE IF NOT EXISTS transfers (
  id                  SERIAL PRIMARY KEY,
  transfer_number     VARCHAR(20) NOT NULL,

  -- Asset
  asset_id            INTEGER NOT NULL REFERENCES assets(id),

  -- Origin snapshot
  origin_building_id  INTEGER REFERENCES catalog_buildings(id),
  origin_area_id      INTEGER REFERENCES catalog_areas(id),
  origin_responsible  VARCHAR(300),
  origin_floor        VARCHAR(50),
  origin_block        VARCHAR(50),
  origin_location     VARCHAR(200),

  -- Destination
  dest_building_id    INTEGER REFERENCES catalog_buildings(id),
  dest_area_id        INTEGER REFERENCES catalog_areas(id),
  dest_person_id      INTEGER REFERENCES catalog_people(id),
  dest_responsible    VARCHAR(300),
  dest_floor          VARCHAR(50),
  dest_block          VARCHAR(50),
  dest_location       VARCHAR(200),

  -- Process
  status              VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  reason              VARCHAR(50),
  requested_by        VARCHAR(300),
  notes               TEXT,
  scheduled_at        DATE,
  completed_at        TIMESTAMPTZ,

  -- n8n
  n8n_notified        BOOLEAN NOT NULL DEFAULT FALSE,
  n8n_webhook_sent_at TIMESTAMPTZ,

  -- Signatures
  signature_origin    TEXT,
  signature_dest      TEXT,
  signed_at           TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS transfers_number_idx ON transfers(transfer_number);
CREATE INDEX IF NOT EXISTS transfers_asset_idx  ON transfers(asset_id);
CREATE INDEX IF NOT EXISTS transfers_status_idx ON transfers(status);

-- Shared updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transfers_updated_at ON transfers;
CREATE TRIGGER transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
