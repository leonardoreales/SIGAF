-- =============================================================================
-- SIGAF · Auditoría de Catálogos — catalog_areas / catalog_people / assets
-- Solo lectura — no modifica datos
-- Ejecutar en Supabase SQL Editor o psql
-- 2026-05-15
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Resumen de estado actual
-- -----------------------------------------------------------------------------
SELECT 'catalog_areas total'         AS metrica, COUNT(*)::text AS valor FROM catalog_areas
UNION ALL
SELECT 'catalog_areas activas',       COUNT(*)::text FROM catalog_areas WHERE active = true
UNION ALL
SELECT 'catalog_people total',        COUNT(*)::text FROM catalog_people
UNION ALL
SELECT 'assets con area_id',          COUNT(*)::text FROM assets WHERE area_id IS NOT NULL
UNION ALL
SELECT 'assets con person_id',        COUNT(*)::text FROM assets WHERE person_id IS NOT NULL
UNION ALL
SELECT 'assets con responsable_raw',  COUNT(*)::text FROM assets WHERE responsable_raw IS NOT NULL AND responsable_raw <> ''
UNION ALL
SELECT 'areas activas sin activos',   COUNT(*)::text
  FROM catalog_areas ca WHERE ca.active = true
  AND NOT EXISTS (SELECT 1 FROM assets a WHERE a.area_id = ca.id);

-- -----------------------------------------------------------------------------
-- 2. Clasificación completa de catalog_areas con conteo de activos
-- -----------------------------------------------------------------------------
SELECT
  ca.id,
  ca.name,
  ca.active,
  COUNT(a.id) AS activos,
  CASE
    WHEN ca.id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)
      THEN 'PERSONA — migrar a catalog_people'
    WHEN ca.id = 1
      THEN 'INVALIDO — desactivar, TORNO area_id → NULL'
    WHEN ca.id IN (32,41)
      THEN 'DUPLICADO — fusionar en id=35 (VICERRECTORÍA ACADÉMICA)'
    WHEN ca.id = 34
      THEN 'DUPLICADO — fusionar en id=36 (VICERRECTORÍA DE INVESTIGACIÓN)'
    WHEN ca.id = 43
      THEN 'DUPLICADO — fusionar en id=27 (INFRAESTRUCTURA) — typo'
    WHEN ca.id = 26
      THEN 'DUPLICADO — fusionar en id=31 (POSGRADOS)'
    WHEN ca.id = 42
      THEN 'DUPLICADO — desactivar (typo de SISTEMAS, sin activos)'
    WHEN ca.id = 40
      THEN 'DUPLICADO — desactivar (abrev. TRANSFORMACIÓN DIGITAL, sin activos)'
    WHEN ca.id = 61
      THEN 'DUPLICADO — fusionar en id=56 (CV NOTICIAS)'
    ELSE 'AREA VALIDA — conservar'
  END AS clasificacion
FROM catalog_areas ca
LEFT JOIN assets a ON a.area_id = ca.id
GROUP BY ca.id, ca.name, ca.active
ORDER BY clasificacion, activos DESC;

-- -----------------------------------------------------------------------------
-- 3. Activo con área inválida "35 MM NUEVO"
-- -----------------------------------------------------------------------------
SELECT a.id, a.plate, a.name, a.responsable_raw, a.area_id, a.building_id
FROM assets a
WHERE a.area_id = 1;

-- -----------------------------------------------------------------------------
-- 4. Detalle de activos apuntando a filas de personas en catalog_areas
-- -----------------------------------------------------------------------------
SELECT
  ca.id    AS area_id_contaminado,
  ca.name  AS nombre_persona,
  a.id     AS asset_id,
  a.plate,
  a.name   AS activo,
  a.responsable_raw
FROM catalog_areas ca
JOIN assets a ON a.area_id = ca.id
WHERE ca.id IN (4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)
ORDER BY ca.name;

-- -----------------------------------------------------------------------------
-- 5. Detalle de activos en áreas duplicadas (que serán reasignados)
-- -----------------------------------------------------------------------------
SELECT
  ca.id   AS area_id_duplicada,
  ca.name AS area_duplicada,
  a.id    AS asset_id,
  a.plate,
  a.name  AS activo
FROM catalog_areas ca
JOIN assets a ON a.area_id = ca.id
WHERE ca.id IN (32, 41, 34, 43, 26, 61)
ORDER BY ca.id;

-- -----------------------------------------------------------------------------
-- 6. Verificación de grupos de duplicados por nombre normalizado
-- -----------------------------------------------------------------------------
SELECT
  ca.name,
  COUNT(DISTINCT ca.id) AS variantes,
  array_agg(ca.id ORDER BY ca.id) AS ids,
  SUM(sub.cnt) AS total_activos
FROM catalog_areas ca
LEFT JOIN (
  SELECT area_id, COUNT(*) AS cnt FROM assets WHERE area_id IS NOT NULL GROUP BY area_id
) sub ON sub.area_id = ca.id
WHERE ca.id IN (35,32,41, 36,34, 27,43, 31,26, 39,42, 30,40, 56,61)
GROUP BY ca.name
ORDER BY ca.name;

-- -----------------------------------------------------------------------------
-- 7. Áreas activas sin activos (candidatas a revisión)
-- -----------------------------------------------------------------------------
SELECT ca.id, ca.name
FROM catalog_areas ca
WHERE ca.active = true
  AND NOT EXISTS (SELECT 1 FROM assets a WHERE a.area_id = ca.id)
ORDER BY ca.name;
