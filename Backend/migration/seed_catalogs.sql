-- ═══════════════════════════════════════════════════════════════════════════
-- SIGAF — Seed de Catálogos Maestros
-- Basado en Procedimiento P AF 011 v3.0 y VBA_modPlaca.bas
-- ═══════════════════════════════════════════════════════════════════════════

-- ── CIUDADES ────────────────────────────────────────────────────────────────
INSERT INTO catalog_cities (code, name) VALUES
  ('1', 'BARRANQUILLA');

-- ── EDIFICIOS ───────────────────────────────────────────────────────────────
-- Barranquilla — 6 sedes reales (fuente: INVENTARIO MAESTRO DE ACTIVOS FIJOS OFICIAL.xlsx)
-- Distribucion real: COSMOS 6371 | 20 DE JULIO 1407 | ROMELIO 1207 | PRADO 1171 | CONSULTORIO JURIDICO 803 | CALLE 79 540
INSERT INTO catalog_buildings (city_code, code, name) VALUES
  ('1', '01', 'COSMOS'),
  ('1', '02', 'CONSULTORIO JURÍDICO'),
  ('1', '03', '20 DE JULIO'),
  ('1', '04', 'PRADO'),
  ('1', '05', 'ROMELIO'),
  ('1', '06', 'CALLE 79');

-- ── TIPOS DE ACTIVO (= cuentas PUC, dígitos 4-5 de la placa) ───────────────
INSERT INTO catalog_asset_types (code, name) VALUES
  ('45', 'PLANTAS, DUCTOS Y TÚNELES'),
  ('55', 'MAQUINARIA Y EQUIPO'),
  ('60', 'EQUIPO MÉDICO Y CIENTÍFICO'),
  ('65', 'MUEBLES, ENSERES Y EQUIPO DE OFICINA'),
  ('70', 'EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN'),
  ('75', 'EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN');
