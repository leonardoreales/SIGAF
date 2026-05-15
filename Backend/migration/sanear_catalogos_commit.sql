-- SIGAF -- Sanear catalogos -- COMMIT VERSION -- 2026-05-15
BEGIN;

CREATE TEMP TABLE _bkp_areas  AS SELECT * FROM catalog_areas;
CREATE TEMP TABLE _bkp_people AS SELECT * FROM catalog_people;
CREATE TEMP TABLE _bkp_assets AS SELECT id, area_id, person_id, responsable_raw FROM assets;

INSERT INTO catalog_people (full_name, active) VALUES
  ('SERGIO ECHEVERRIA',    true),
  ('SARAY SALGADO',        true),
  ('MARIA FERNANDA VARELA',true),
  ('CHARLYN FAJARDO',      true),
  ('MARIA CAROLINA',       true),
  ('MELISSA DE LA ROSA',   true),
  ('CORREOR ANDREA',       true),
  ('ROMARIO PULGARIN',     true),
  ('MARICARMEN PALLARES',  true),
  ('JOSED DE ALBA',        true),
  ('JESSICA PALENCIA',     true),
  ('LUZ CALA',             true),
  ('ESTEFANY SONADO',      true),
  ('JEISON STEVEN',        true),
  ('OSIO MAURY ALVARO',    true),
  ('YULIETH PUELLO',       true),
  ('REINALDO ORELLANO',    true),
  ('EDUIN GRANADILLO',     true),
  ('LAURA CASTRO',         true),
  ('HAROLD ALMANZA',       true),
  ('ANGEL LUIS ARNOVIS',   true),
  ('VERONICA AGUILAR',     true);

UPDATE assets a
SET person_id = cp.id, area_id = NULL
FROM catalog_areas ca
JOIN catalog_people cp ON cp.full_name = ca.name
WHERE a.area_id = ca.id
  AND ca.id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25);

UPDATE assets SET area_id = NULL WHERE id = 2844;

UPDATE catalog_areas SET active = false
WHERE id IN (1, 4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25);

UPDATE assets SET area_id = 35 WHERE area_id IN (32, 41);
UPDATE assets SET area_id = 36 WHERE area_id = 34;
UPDATE assets SET area_id = 27 WHERE area_id = 43;
UPDATE assets SET area_id = 31 WHERE area_id = 26;
UPDATE assets SET area_id = 56 WHERE area_id = 61;

UPDATE catalog_areas SET active = false
WHERE id IN (32, 41, 34, 43, 26, 61, 40, 42);

SELECT
  'catalog_people activos'             AS check_, COUNT(*)::text AS actual, '22' AS esperado FROM catalog_people WHERE active = true
UNION ALL SELECT 'assets con person_id',           COUNT(*)::text, '22'  FROM assets WHERE person_id IS NOT NULL
UNION ALL SELECT 'assets area inactiva',            COUNT(*)::text, '0'
  FROM assets a JOIN catalog_areas ca ON ca.id = a.area_id WHERE ca.active = false
UNION ALL SELECT 'areas activas con persona',       COUNT(*)::text, '0'
  FROM catalog_areas WHERE active = true AND id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)
UNION ALL SELECT '35MM activa',                     active::text,   'false' FROM catalog_areas WHERE id = 1
UNION ALL SELECT 'TORNO area_id NULL',              (area_id IS NULL)::text, 'true' FROM assets WHERE id = 2844
UNION ALL SELECT 'duplicados activos',              COUNT(*)::text, '0'
  FROM catalog_areas WHERE active = true AND id IN (32,41,34,43,26,61,40,42)
UNION ALL SELECT 'areas activas total',             COUNT(*)::text, '30' FROM catalog_areas WHERE active = true;

COMMIT;
