-- ============================================================
-- SIGAF — system_users
-- Gestión dinámica de usuarios del sistema (roles, cargos, dependencias)
-- Aplicar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS system_users (
  id            SERIAL       PRIMARY KEY,
  email         VARCHAR(200) NOT NULL UNIQUE,
  role          VARCHAR(30)  NOT NULL DEFAULT 'VIEWER',
  cargo         VARCHAR(200) NOT NULL DEFAULT 'Usuario General',
  dependencia   VARCHAR(200) NOT NULL DEFAULT 'General',
  name          VARCHAR(200),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por email (clave en cada login)
CREATE INDEX IF NOT EXISTS system_users_email_idx ON system_users (email);

-- Seed: usuarios del sistema actuales
INSERT INTO system_users (email, role, cargo, dependencia) VALUES
  ('leonardoreales@americana.edu.co', 'ADMIN',         'Coordinador de Activos Fijos',  'Administración'),
  ('jdcharris@americana.edu.co',      'ACTIVOS_FIJOS', 'Jefe de Activos Fijos',          'Activos Fijos'),
  ('rbracho@americana.edu.co',        'ACTIVOS_FIJOS', 'Directora Administrativa',       'Activos Fijos'),
  ('oscarcespedes@americana.edu.co',  'COMPRAS',       'Auxiliar de Bodega',             'Compras y Almacén'),
  ('dalarcon@americana.edu.co',       'COMPRAS',       'Jefe de Compras y Almacén',      'Compras y Almacén')
ON CONFLICT (email) DO NOTHING;
