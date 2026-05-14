#!/usr/bin/env python3
"""
import_compras_dates_2026.py

Cruza POLIZA 2026 (4).xlsx con la BD SIGAF y asigna acquisition_date
a los activos de incorporation_year=2026.

Regla de fechas (decisión contable):
  - ENERO  → fecha fija 2026-01-31 para TODOS (ignorar col FECHA INGRESO que muestra Feb)
  - demás  → FECHA INGRESO de la hoja si existe; si no, último día del mes de la hoja

Matching (en orden):
  1. SERIAL exacto (normalizado UPPER+TRIM)
  2. NOMBRE normalizado + BUILDING_ID

Uso:
  cd Backend/migration
  python import_compras_dates_2026.py
"""

import os, sys, unicodedata
import pandas as pd
import psycopg2
from dotenv import load_dotenv

# ── Configuración ─────────────────────────────────────────────────────────────

EXCEL_PATH = r'C:\Users\Leonardo Reales\Downloads\POLIZA 2026 (4).xlsx'

SHEET_FALLBACK: dict[str, str] = {
    'ENERO':   '2026-01-31',
    'FEBRERO': '2026-02-28',
    'MARZO':   '2026-03-31',
    'ABRIL':   '2026-04-30',
    'MAYO':    '2026-05-31',
}

# Mapa edificio (normalizado sin tildes, upper) → building_id en BD
EDIFICIO_MAP: dict[str, int] = {
    'COSMOS':               1,
    'CONSULTORIO JURIDICO': 2,
    '20 DE JULIO':          3,
    'PRADO':                4,
    'ROMELIO':              5,
    'CALLE 79':             6,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def strip_accents(s: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )

def normalize_name(s) -> str:
    if not s or (isinstance(s, float)):
        return ''
    return strip_accents(str(s).replace('\n', ' ').strip().upper())

def normalize_serial(s) -> str | None:
    if not s or (isinstance(s, float)):
        return None
    clean = strip_accents(str(s).strip().upper())
    if clean in ('N/A', 'NA', '', 'NONE', 'S/N', 'SIN SERIAL', 'NO APLICA'):
        return None
    return clean

def normalize_edificio(s) -> str:
    if not s or (isinstance(s, float)):
        return ''
    return strip_accents(str(s).strip().upper())

def resolve_fecha(row: pd.Series, sheet: str) -> str:
    """Devuelve la fecha ISO a asignar según las reglas del plan."""
    if sheet == 'ENERO':
        return SHEET_FALLBACK['ENERO']
    fi = row.get('FECHA INGRESO')
    if fi is not None and str(fi) not in ('nan', 'NaT', '', 'None'):
        try:
            if hasattr(fi, 'date'):
                return fi.date().isoformat()
            parsed = pd.to_datetime(fi, errors='coerce')
            if not pd.isna(parsed):
                return parsed.date().isoformat()
        except Exception:
            pass
    return SHEET_FALLBACK[sheet]

# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # Cargar .env del backend
    env_path = os.path.join(os.path.dirname(__file__), '..', 'api', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()

    # Conexión PostgreSQL
    try:
        conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            port=int(os.environ.get('DB_PORT', '5432')),
            dbname=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD'],
            sslmode='require',
        )
    except Exception as e:
        print(f'❌ No se pudo conectar a la BD: {e}')
        sys.exit(1)

    cur = conn.cursor()

    # ── Cargar activos 2026 desde BD ──────────────────────────────────────────
    cur.execute("""
        SELECT id, serial, name, building_id,
               (acquisition_date IS NULL) AS sin_fecha
        FROM assets
        WHERE incorporation_year = 2026
    """)
    db_assets = cur.fetchall()
    print(f'BD: {len(db_assets)} activos 2026 encontrados')

    sin_fecha_ids: set[int] = set()
    serial_idx:    dict[str, list[int]] = {}   # serial_norm → [id, ...]
    name_bld_idx:  dict[tuple, list[int]] = {} # (nombre_norm, building_id) → [id, ...]

    for (asset_id, serial, name, building_id, is_null) in db_assets:
        if is_null:
            sin_fecha_ids.add(asset_id)

        ns = normalize_serial(serial)
        if ns:
            serial_idx.setdefault(ns, []).append(asset_id)

        nn = normalize_name(name)
        if nn and building_id:
            name_bld_idx.setdefault((nn, building_id), []).append(asset_id)

    print(f'  Sin fecha actualmente: {len(sin_fecha_ids)}')

    # ── Leer Excel hoja por hoja ──────────────────────────────────────────────
    try:
        xl = pd.ExcelFile(EXCEL_PATH)
    except FileNotFoundError:
        print(f'❌ Excel no encontrado: {EXCEL_PATH}')
        sys.exit(1)

    # asset_id → fecha a asignar (última escritura gana si hay duplicados)
    updates:  dict[int, str] = {}
    unmatched: list[dict]    = []
    cnt_serial = 0
    cnt_name   = 0

    for sheet_name in xl.sheet_names:
        if sheet_name not in SHEET_FALLBACK:
            continue  # saltar CFG u hojas desconocidas

        df = pd.read_excel(xl, sheet_name=sheet_name)

        # Verificar columnas mínimas
        required = ['NOMBRE ACTIVO', 'SERIAL', 'EDIFICIO']
        missing  = [c for c in required if c not in df.columns]
        if missing:
            print(f'⚠️  Hoja {sheet_name}: columnas faltantes {missing}, saltando.')
            continue

        total_sheet = 0
        matched_sheet = 0

        for _, row in df.iterrows():
            nombre_raw   = row['NOMBRE ACTIVO']
            serial_raw   = row.get('SERIAL')
            edificio_raw = row.get('EDIFICIO')

            # Saltar filas vacías
            if pd.isna(nombre_raw) or str(nombre_raw).strip() == '':
                continue
            total_sheet += 1

            fecha = resolve_fecha(row, sheet_name)

            ns = normalize_serial(serial_raw)
            nn = normalize_name(nombre_raw)
            ne = normalize_edificio(edificio_raw)
            bid = EDIFICIO_MAP.get(ne)

            matched_ids: list[int] = []

            # ── Estrategia 1: serial exacto ───────────────────────────────
            if ns and ns in serial_idx:
                matched_ids = serial_idx[ns]
                cnt_serial += len(matched_ids)

            # ── Estrategia 2: nombre + edificio ───────────────────────────
            if not matched_ids and nn and bid:
                key = (nn, bid)
                if key in name_bld_idx:
                    matched_ids = name_bld_idx[key]
                    cnt_name += len(matched_ids)

            if matched_ids:
                for aid in matched_ids:
                    updates[aid] = fecha
                matched_sheet += 1
            else:
                unmatched.append({
                    'hoja':     sheet_name,
                    'nombre':   str(nombre_raw)[:60],
                    'serial':   serial_raw,
                    'edificio': edificio_raw,
                    'fecha':    fecha,
                })

        print(f'  [{sheet_name}] {total_sheet} filas · {matched_sheet} con match')

    # ── Resumen de matching ───────────────────────────────────────────────────
    print(f'\nMatching:')
    print(f'  Por serial:        {cnt_serial}')
    print(f'  Por nombre+edif.:  {cnt_name}')
    print(f'  Sin match:         {len(unmatched)}')
    print(f'  Updates a aplicar: {len(updates)}')
    covered = sum(1 for aid in updates if aid in sin_fecha_ids)
    print(f'  De los {len(sin_fecha_ids)} sin fecha en BD: {covered} cubiertos')

    if not updates:
        print('\nNada que actualizar. Verifica el Excel y los datos de BD.')
        conn.close()
        return

    # ── Ejecutar UPDATEs ─────────────────────────────────────────────────────
    print('\nAplicando updates...')
    updated_count = 0
    for asset_id, fecha in updates.items():
        cur.execute(
            """
            UPDATE assets
               SET acquisition_date = %s, updated_at = NOW()
             WHERE id = %s AND incorporation_year = 2026
            """,
            (fecha, asset_id),
        )
        updated_count += cur.rowcount

    conn.commit()
    print(f'✅ {updated_count} activos actualizados en BD')

    # ── Reporte de sin match ──────────────────────────────────────────────────
    if unmatched:
        print(f'\n⚠️  {len(unmatched)} filas de Excel sin match en BD:')
        for u in unmatched[:25]:
            serial_str = f"serial={u['serial']}" if u['serial'] and not (isinstance(u['serial'], float)) else 'sin serial'
            print(f"  [{u['hoja']}] {u['nombre'][:50]!r} | {serial_str} | edif={u['edificio']} → fecha fallback: {u['fecha']}")
        if len(unmatched) > 25:
            print(f'  ... y {len(unmatched) - 25} más sin match.')
        print('\n  Estos activos NO fueron actualizados.')

    cur.close()
    conn.close()
    print('\nListo.')


if __name__ == '__main__':
    main()
