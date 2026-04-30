-- ═══════════════════════════════════════════════════════════════════════════
-- SIGAF — Añadir campos: área de mantenimiento y criticidad en assets
--
-- maintenance_area → equipo técnico que MANTIENE el activo
--   (distinto de area_id, que es el área DONDE está asignado el activo)
-- criticality     → nivel de criticidad operativa del activo
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS maintenance_area VARCHAR(20)
    CHECK (maintenance_area IN ('INFRAESTRUCTURA','SISTEMAS','TRANSPORTE','ACTIVOS_FIJOS')),
  ADD COLUMN IF NOT EXISTS criticality VARCHAR(10) NOT NULL DEFAULT 'BAJO'
    CHECK (criticality IN ('ALTO','MEDIO','BAJO'));
