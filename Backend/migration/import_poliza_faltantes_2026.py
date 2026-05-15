"""
import_poliza_faltantes_2026.py
Corrige datos Q1 2026 detectados al cotejar POLIZA 2026 (4).xlsx vs BD.

Investigación previa (2026-05-15) confirmó:
  - NINGÚN activo falta -- las 368 sillas ISOCELES ya están en BD con nombres normalizados:
      * 320 "SILLA UNIVERSITARIA" ($377,660)  <- importadas como "SILLA UNIVERSITARIA ISOCLES" en POLIZA
      *  48 "SILLA ISOCELES"      ($271,950)  <- importadas como "SILLA ISOCELES TAPIZADAS COLOR NEGRO"
  - Gap en export Q1 (817 vs 851): 34 "SILLA UNIVERSITARIA" tienen acquisition_date
    Abr 1-May 4 (patrón 1/día = artificio del import). Son compras de FEBRERO
    según POLIZA, deben tener acquisition_date = 2026-02-28.
  - Serial Diadema (id=15919): '862516D13511868' (15 chars) -> '862516D135111868' (16 chars).

Parte A -- UPDATE acquisition_date de 34 sillas (Abr/May -> Feb)
Parte B -- UPDATE serial Diadema Razer (id exacto = 15919)

Uso:
    python import_poliza_faltantes_2026.py --dry-run   # solo muestra, sin cambios
    python import_poliza_faltantes_2026.py             # ejecuta
"""

import sys
import psycopg2

DB_CONN = (
    "postgresql://postgres.baqvgyjtqdbypoudcons:IAFFYykAqGoH2R3B"
    "@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
)

DRY_RUN = "--dry-run" in sys.argv


# ---------------------------------------------------------------------------
# Parte A -- Corregir acquisition_date de 34 sillas UNIVERSITARIA
# ---------------------------------------------------------------------------
# Contexto: las 320 "SILLA UNIVERSITARIA" ($377,660) de POLIZA FEBRERO/COSMOS
# fueron importadas con fechas reales de FECHA INGRESO del REGISTRO ACTIVOS.
# 286 tienen fechas Ene-Mar (dentro de Q1). 34 tienen fechas Abr 1-May 4
# (patrón artificial: 1 silla/día). La POLIZA FEBRERO es la fuente oficial;
# esas 34 deben consolidarse en 2026-02-28.

A_QUERY_CHECK = """
    SELECT COUNT(*) AS cnt
    FROM assets
    WHERE building_id = 1
      AND name = 'SILLA UNIVERSITARIA'
      AND round(reference_value::numeric, 0) = 377660
      AND acquisition_date >= '2026-04-01';
"""

A_QUERY_UPDATE = """
    UPDATE assets
    SET    acquisition_date = '2026-02-28',
           updated_at       = NOW()
    WHERE  building_id = 1
      AND  name = 'SILLA UNIVERSITARIA'
      AND  round(reference_value::numeric, 0) = 377660
      AND  acquisition_date >= '2026-04-01';
"""


def part_a(cur) -> int:
    cur.execute(A_QUERY_CHECK)
    cnt = cur.fetchone()[0]
    print(f"\n[A] SILLA UNIVERSITARIA con fecha Abr/May (fuera de Q1): {cnt}")
    if DRY_RUN:
        return cnt
    cur.execute(A_QUERY_UPDATE)
    updated = cur.rowcount
    print(f"[A] OK - {updated} sillas actualizadas, acquisition_date = 2026-02-28")
    return updated


# ---------------------------------------------------------------------------
# Parte B -- Corregir serial Diadema Razer (id=15919)
# ---------------------------------------------------------------------------
# id=15919, serial en BD: '862516D13511868' (15 chars, falta un '1')
# Serial correcto en POLIZA: '862516D135111868' (16 chars)

DIADEMA_ID             = 15919
SERIAL_INCORRECTO      = "862516D13511868"   # 15 chars
SERIAL_CORRECTO        = "862516D135111868"  # 16 chars

B_QUERY_CHECK = """
    SELECT id, name, serial, acquisition_date::date
    FROM assets
    WHERE id = %s;
"""

B_QUERY_UPDATE = """
    UPDATE assets
    SET    serial     = %s,
           updated_at = NOW()
    WHERE  id = %s
      AND  serial = %s;
"""


def part_b(cur) -> int:
    cur.execute(B_QUERY_CHECK, (DIADEMA_ID,))
    row = cur.fetchone()
    if not row:
        print(f"\n[B] WARN -- id={DIADEMA_ID} no encontrado en BD")
        return 0
    print(f"\n[B] Diadema id={row[0]}  name={row[1]}  serial={row[2]}  fecha={row[3]}")
    if row[2] == SERIAL_CORRECTO:
        print("[B] Serial ya está correcto -- nada que hacer")
        return 0
    if row[2] != SERIAL_INCORRECTO:
        print(f"[B] WARN -- serial inesperado: '{row[2]}' (se esperaba '{SERIAL_INCORRECTO}')")
        return 0
    if DRY_RUN:
        print(f"[B] DRY-RUN -- se actualizaria: '{SERIAL_INCORRECTO}' -> '{SERIAL_CORRECTO}'")
        return 1
    cur.execute(B_QUERY_UPDATE, (SERIAL_CORRECTO, DIADEMA_ID, SERIAL_INCORRECTO))
    updated = cur.rowcount
    print(f"[B] OK -- serial actualizado: '{SERIAL_INCORRECTO}' -> '{SERIAL_CORRECTO}'")
    return updated


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    if DRY_RUN:
        print("=== DRY-RUN (sin cambios en BD) ===")

    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    try:
        part_a(cur)
        part_b(cur)

        if DRY_RUN:
            print("\n=== DRY-RUN completado -- no se realizaron cambios ===")
            return

        conn.commit()
        print("\nTodos los cambios confirmados (commit OK).")
        print("\n>>> Verificar resultado:")
        print("    Q1 activos esperados después de fix: 851 (817 + 34 sillas)")

    except Exception as exc:
        conn.rollback()
        print(f"\nERROR -- rollback ejecutado: {exc}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
