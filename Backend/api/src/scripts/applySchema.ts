import 'dotenv/config'
import { pool } from '../infrastructure/db/client'

const SQL = `
-- Tablas de mantenimiento (si no existen)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id               serial PRIMARY KEY,
  asset_id         integer REFERENCES assets(id),
  activity_name    varchar(300) NOT NULL,
  maintenance_type varchar(50)  NOT NULL,
  frequency        varchar(100),
  scheduled_date   date         NOT NULL,
  responsible_area varchar(100) NOT NULL,
  status           varchar(30)  NOT NULL DEFAULT 'PROGRAMADO',
  notes            text,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_executions (
  id              serial PRIMARY KEY,
  schedule_id     integer REFERENCES maintenance_schedules(id),
  execution_date  date        NOT NULL,
  performed_by    varchar(200),
  observations    text,
  support_status  varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  validated_by    integer REFERENCES system_users(id),
  validated_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_supports (
  id           serial PRIMARY KEY,
  execution_id integer REFERENCES maintenance_executions(id),
  file_url     text        NOT NULL,
  file_type    varchar(100),
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

-- Tablas de bajas
CREATE TABLE IF NOT EXISTS writeoff_acts (
  id                serial PRIMARY KEY,
  acta_number       varchar(20)  NOT NULL UNIQUE,
  date              date,
  building          varchar(100),
  reason            varchar(60)  NOT NULL,
  status            varchar(30)  NOT NULL DEFAULT 'COMPLETADA',
  authorized_by     varchar(300),
  authorized_by_role varchar(200),
  responsible       varchar(300),
  responsible_role  varchar(200),
  total_items       integer      NOT NULL DEFAULT 0,
  notes             text,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS writeoff_items (
  id                serial PRIMARY KEY,
  writeoff_act_id   integer     NOT NULL REFERENCES writeoff_acts(id) ON DELETE CASCADE,
  item_number       integer     NOT NULL,
  plate_serial      varchar(100),
  no_registra       boolean     NOT NULL DEFAULT false,
  asset_id          integer REFERENCES assets(id),
  description       varchar(300),
  asset_type        varchar(100),
  brand_model       varchar(200),
  reconciled_status varchar(30) NOT NULL DEFAULT 'PENDING',
  created_at        timestamptz NOT NULL DEFAULT now()
);
`

async function run() {
  console.log('Aplicando schema...')
  await pool.query(SQL)
  console.log('✅ Tablas creadas/verificadas en Supabase.')
  await pool.end()
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
