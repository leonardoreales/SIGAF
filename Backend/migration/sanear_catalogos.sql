-- =============================================================================
-- SIGAF · Saneamiento de Catálogos — Áreas y Personas
-- TRANSACCIONAL — verificar conteos antes de ejecutar COMMIT
-- Ejecutar en Supabase SQL Editor (pgAdmin / psql)
-- 2026-05-15
-- =============================================================================
-- INSTRUCCIONES:
--   1. Ejecutar TODO el bloque (BEGIN → verificaciones).
--   2. Revisar los conteos de la sección VERIFICACIÓN FINAL.
--   3. Si todos los valores son los esperados → descomentar COMMIT y re-ejecutar.
--   4. Si algo falla → ROLLBACK automático al terminar sin COMMIT.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BACKUP LÓGICO (tablas temporales — solo duran esta sesión)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _bkp_areas   AS SELECT * FROM catalog_areas;
CREATE TEMP TABLE _bkp_people  AS SELECT * FROM catalog_people;
CREATE TEMP TABLE _bkp_assets  AS
  SELECT id, area_id, person_id, responsable_raw FROM assets;

-- ---------------------------------------------------------------------------
-- PASO 1 — Insertar 22 personas reales en catalog_people
-- ---------------------------------------------------------------------------
-- Orden: mismos nombres que estaban en catalog_areas (ids 4–25)
-- Se preserva responsable_raw como trazabilidad de origen

INSERT INTO catalog_people (full_name, active) VALUES
  ('SERGIO ECHEVERRIA',    true),   -- area_id_origen = 4
  ('SARAY SALGADO',        true),   -- area_id_origen = 5
  ('MARIA FERNANDA VARELA',true),   -- area_id_origen = 6
  ('CHARLYN FAJARDO',      true),   -- area_id_origen = 7
  ('MARIA CAROLINA',       true),   -- area_id_origen = 8
  ('MELISSA DE LA ROSA',   true),   -- area_id_origen = 9
  ('CORREOR ANDREA',       true),   -- area_id_origen = 10
  ('ROMARIO PULGARIN',     true),   -- area_id_origen = 11
  ('MARICARMEN PALLARES',  true),   -- area_id_origen = 12
  ('JOSED DE ALBA',        true),   -- area_id_origen = 13
  ('JESSICA PALENCIA',     true),   -- area_id_origen = 14
  ('LUZ CALA',             true),   -- area_id_origen = 15
  ('ESTEFANY SONADO',      true),   -- area_id_origen = 16
  ('JEISON STEVEN',        true),   -- area_id_origen = 17
  ('OSIO MAURY ALVARO',    true),   -- area_id_origen = 18
  ('YULIETH PUELLO',       true),   -- area_id_origen = 19
  ('REINALDO ORELLANO',    true),   -- area_id_origen = 20
  ('EDUIN GRANADILLO',     true),   -- area_id_origen = 21
  ('LAURA CASTRO',         true),   -- area_id_origen = 22
  ('HAROLD ALMANZA',       true),   -- area_id_origen = 23
  ('ANGEL LUIS ARNOVIS',   true),   -- area_id_origen = 24
  ('VERONICA AGUILAR',     true);   -- area_id_origen = 25

-- ---------------------------------------------------------------------------
-- PASO 2 — Actualizar assets: mover area_id → person_id para las 22 personas
-- Lógica: JOIN entre catalog_people.full_name y catalog_areas.name para mapear
-- ---------------------------------------------------------------------------
UPDATE assets a
SET
  person_id = cp.id,
  area_id   = NULL
FROM catalog_areas ca
JOIN catalog_people cp ON cp.full_name = ca.name
WHERE a.area_id = ca.id
  AND ca.id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25);

-- ---------------------------------------------------------------------------
-- PASO 3 — Activo inválido "35 MM NUEVO": limpiar area_id del TORNO
-- ---------------------------------------------------------------------------
UPDATE assets SET area_id = NULL WHERE id = 2844;

-- ---------------------------------------------------------------------------
-- PASO 4 — Desactivar filas de personas en catalog_areas (ids 4–25)
--          y la fila inválida (id=1)
-- ---------------------------------------------------------------------------
UPDATE catalog_areas
SET active = false
WHERE id IN (1, 4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25);

-- ---------------------------------------------------------------------------
-- PASO 5 — Consolidar duplicados: reasignar activos a la forma canónica
-- ---------------------------------------------------------------------------

-- 5a. VICERRECTORÍA ACADÉMICA: id=32 y id=41 → id=35
UPDATE assets SET area_id = 35 WHERE area_id IN (32, 41);

-- 5b. VICERRECTORÍA DE INVESTIGACIÓN: id=34 → id=36
UPDATE assets SET area_id = 36 WHERE area_id = 34;

-- 5c. INFRAESTRUCTURA: id=43 (typo INFRAESTRUTURA) → id=27
UPDATE assets SET area_id = 27 WHERE area_id = 43;

-- 5d. POSGRADOS: id=26 (POSGRADO) → id=31
UPDATE assets SET area_id = 31 WHERE area_id = 26;

-- 5e. CV NOTICIAS: id=61 (OFICINA CV NOTICIAS) → id=56
UPDATE assets SET area_id = 56 WHERE area_id = 61;

-- 5f. Desactivar duplicados (los que tenían activos ya fueron reasignados)
--     GER TRANSF DIGITAL (id=40) y SISETMAS (id=42) no tenían activos
UPDATE catalog_areas
SET active = false
WHERE id IN (32, 41, 34, 43, 26, 61, 40, 42);

-- ---------------------------------------------------------------------------
-- VERIFICACIÓN FINAL — revisar antes de hacer COMMIT
-- ---------------------------------------------------------------------------

-- Conteos esperados:
SELECT
  'catalog_people activos'              AS check_,  COUNT(*)::text AS actual, '22'  AS esperado FROM catalog_people WHERE active = true
UNION ALL
SELECT
  'assets con person_id',                            COUNT(*)::text,           '22'  FROM assets WHERE person_id IS NOT NULL
UNION ALL
SELECT
  'assets apuntando a área inactiva',                COUNT(*)::text,           '0'
  FROM assets a JOIN catalog_areas ca ON ca.id = a.area_id WHERE ca.active = false
UNION ALL
SELECT
  'catalog_areas activas con persona',               COUNT(*)::text,           '0'
  FROM catalog_areas WHERE active = true AND id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)
UNION ALL
SELECT
  '35 MM NUEVO activa',                              active::text,             'false'
  FROM catalog_areas WHERE id = 1
UNION ALL
SELECT
  'TORNO area_id es NULL',                           (area_id IS NULL)::text,  'true'
  FROM assets WHERE id = 2844
UNION ALL
SELECT
  'grupos de duplicados activos',                    COUNT(*)::text,           '0'
  FROM catalog_areas WHERE active = true AND id IN (32, 41, 34, 43, 26, 61, 40, 42)
UNION ALL
SELECT
  'catalog_areas activas total',                     COUNT(*)::text,           '30'
  FROM catalog_areas WHERE active = true;

-- ---------------------------------------------------------------------------
-- Si todos los valores de 'actual' coinciden con 'esperado':
-- Descomentar la siguiente línea y re-ejecutar el bloque completo.
-- ---------------------------------------------------------------------------
-- COMMIT;

-- Para cancelar todo:
-- ROLLBACK;
