-- ═══════════════════════════════════════════════════════════════
-- SIGAF — Poblar content_hash para activos con serial
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════
--
-- Propósito: los activos migrados tienen content_hash = NULL.
-- n8n usa content_hash para deduplicar al importar desde la póliza.
-- Para activos CON serial: podemos reproducir el FP exacto que
-- calcula n8n → 'S:<serial_normalizado>'.
-- Para activos SIN serial: el FP de n8n depende del row_number de
-- la hoja de cálculo original (que no tenemos), por lo que no se
-- modifican (NULL es correcto — solo las pestañas del mes actual
-- pasan por el workflow, no el inventario histórico completo).
-- ═══════════════════════════════════════════════════════════════

-- ── Paso 1: habilitar unaccent (ya viene en Supabase) ───────────
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── Paso 2: FNV-1a 32-bit (idéntico al fnv1a() de n8n) ─────────
CREATE OR REPLACE FUNCTION fnv1a_hex(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  hash BIGINT := 2166136261; -- 0x811c9dc5
  i    INT;
  b    INT;
BEGIN
  FOR i IN 1..length(input) LOOP
    b    := ASCII(substring(input, i, 1));
    hash := hash # b;                       -- XOR (# = XOR en PostgreSQL)
    hash := (hash * 16777619) & 4294967295; -- multiplicar, máscara 32 bits
  END LOOP;
  RETURN lpad(to_hex(hash), 8, '0');
END;
$$;

-- ── Paso 3: normalizar serial (idéntico al normSerial() de n8n) ─
CREATE OR REPLACE FUNCTION norm_serial(s TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  t TEXT;
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  t := upper(s);
  t := regexp_replace(t, 'S/?N[:\s\-]*', '', 'gi');
  t := regexp_replace(t, '[^A-Z0-9]', '', 'g');
  t := regexp_replace(t, '^0+', '');
  IF t = ''
     OR length(t) < 5
     OR t IN ('NA','NULL','NULO','NOAPLICA','SININFO','SININFORMACION','NOREGISTRA')
  THEN
    RETURN NULL;
  END IF;
  RETURN t;
END;
$$;

-- ── Paso 4: poblar content_hash solo para activos con serial ────
--  Formato: 'S:<serial>' — coincide exactamente con el FP que
--  calcularía n8n si ese activo aparece en una póliza futura.
UPDATE assets
SET    content_hash = 'S:' || norm_serial(serial)
WHERE  content_hash IS NULL
  AND  norm_serial(serial) IS NOT NULL;

-- ── Verificación ────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE content_hash IS NOT NULL AND content_hash LIKE 'S:%') AS con_hash_serial,
  COUNT(*) FILTER (WHERE content_hash IS NULL)                                  AS sin_hash_null,
  COUNT(*)                                                                       AS total
FROM assets;
