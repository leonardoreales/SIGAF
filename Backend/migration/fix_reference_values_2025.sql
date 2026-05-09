-- ============================================================
-- SIGAF — Corrección de reference_value × 1000
-- Hoja: REGISTRO ACTIVOS 2025 · Edificio: ROMELIO + COSMOS
-- Fecha: 2026-05-07
-- Autor: Diagnóstico automático + comparación interna BD + audit Excel
-- ============================================================
-- RESULTADO DEL AUDIT (audit_reference_values.py):
--
--   DIADEMA (101700001972) — BUG DE MIGRACIÓN CONFIRMADO
--     BD: $226.077.158 | Excel: $226.077 | Ratio: ×1000
--     → Corrección automática avalada (fuente de verdad = Excel)
--
--   17 ACTIVOS ROMELIO — ERROR DE CAPTURA EN EXCEL
--     BD = Excel (ambos tienen el valor inflado ×1000)
--     → El Excel TAMBIÉN tiene valores incorrectos
--     → Corrección ÷1000 avalada por referencias internas de BD:
--         CONGAS referencia BD:      $1.890.000  → anomalía ÷1000 = $2.637.560 ✓
--         CONSOLA DE AUDIO 2022:     $2.297.900  → anomalía ÷1000 = $2.507.000 ✓
--         MICRÓFONO rango BD:    $148K - $3.6M   → anomalía ÷1000 = $2.216.000 ✓
--         CABLE DE AUDIO profesional: ~$280K     → anomalía ÷1000 = $281.700   ✓
--     → REQUIERE VALIDACIÓN DEL ÁREA CONTABLE antes de ejecutar
--
-- FACTOR DE CORRECCIÓN: reference_value = ROUND(reference_value / 1000, 2)
-- Reducción esperada en valoración total: ~$26.743 B COP (de $41B a ~$14.3B)
--
-- NO EJECUTAR sin aprobación explícita del área contable + sistemas.
-- ============================================================

BEGIN;

-- ── ROMELIO 2025 · Instrumentos musicales (18 activos) ───────────────────────

-- CABLE DE AUDIO × 3
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9816 AND plate = '105550000072';
-- Antes: $281.699.989   Después: $281.700,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9817 AND plate = '105550000073';
-- Antes: $281.699.989   Después: $281.700,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9818 AND plate = '105550000074';
-- Antes: $281.699.989   Después: $281.700,00

-- AFINADOR DE INSTRUMENTOS
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9819 AND plate = '105550000075';
-- Antes: $104.899.999   Después: $104.900,00

-- PORTA BAQUETAS
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9820 AND plate = '105550000076';
-- Antes: $105.212.993   Después: $105.213,00

-- CONGA 11 3/4
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9821 AND plate = '105550000077';
-- Antes: $2.551.019.993  Después: $2.551.020,00

-- CONGA 12 1/2
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9822 AND plate = '105550000078';
-- Antes: $2.637.560.006  Después: $2.637.560,00

-- CUERDAS PARA GUITARRA ELÉCTRICA
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9823 AND plate = '105550000079';
-- Antes: $67.599.997    Después: $67.600,00

-- MICRÓFONO VOCAL ALÁMBRICO × 8
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9825 AND plate = '105550000081';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9826 AND plate = '105550000082';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9827 AND plate = '105550000083';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9828 AND plate = '105550000084';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9829 AND plate = '105550000085';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9830 AND plate = '105550000086';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9831 AND plate = '105550000087';
-- Antes: $2.216.000.007  Después: $2.216.000,00

UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9832 AND plate = '105550000088';
-- Antes: $2.216.000.007  Después: $2.216.000,00

-- CONSOLA DE MEZCLAS DIGITAL
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9833 AND plate = '105550000089';
-- Antes: $2.507.000.001  Después: $2.507.000,00

-- ── COSMOS 2025 · DIADEMA (1 activo) ─────────────────────────────────────────

-- DIADEMA (referencia: 6 DIADEMAs en COSMOS 2025 con $226.077,00 exactos)
UPDATE assets SET reference_value = ROUND(reference_value / 1000, 2)
WHERE id = 9519 AND plate = '101700001972';
-- Antes: $226.077.158   Después: $226.077,16

COMMIT;

-- ── VERIFICACIÓN POST-CORRECCIÓN ─────────────────────────────────────────────
-- Ejecutar después del COMMIT para confirmar:

-- SELECT plate, name, reference_value
-- FROM assets
-- WHERE id IN (
--   9816,9817,9818,9819,9820,9821,9822,9823,
--   9825,9826,9827,9828,9829,9830,9831,9832,9833,
--   9519
-- )
-- ORDER BY id;

-- Suma esperada post-corrección de los 19 activos: ~$38.6M COP
-- (vs $26.781.889.148 actuales)
--
-- Reducción en valoración total del sistema: ~$26.743B COP
-- Dashboard debe mostrar ~$14.3B en lugar de $41B
