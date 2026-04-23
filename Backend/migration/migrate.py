#!/usr/bin/env python3
"""
SIGAF — Migración de Inventario Maestro Excel → PostgreSQL
Corporación Universitaria Americana · 2026

Reglas aplicadas:
  1. Descartar filas completamente vacías (las 2,299 basuras de 2022)
  2. Unificar TIPO DE ACTIVO → 6 valores canónicos (misma lógica que VBA_modPlaca.bas)
  3. Trim espacios en EDIFICIO + alias BLOQUE F → CONSULTORIO JURÍDICO
  4. SERIAL: "NO REGISTRA" y variantes → NULL
  5. CUENTA CONTABLE: valores inválidos ("", "NJGF1") → NULL
  6. RESPONSABLE: valores inválidos → NULL; válidos → catalog_areas
  7. VALOR DE REFERENCIA: convertir a numérico, ignorar strings inválidos
  8. incorporation_year: derivado del nombre de la hoja
  9. plate_sequences: calculado desde MAX de placa por grupo al final
"""

import sys
import unicodedata
import pandas as pd
import psycopg2

# ── CONFIGURACIÓN ────────────────────────────────────────────────────────────

EXCEL_PATH = r"C:\Users\Leonardo Reales\Desktop\proyecto_activos\INVENTARIO MAESTRO DE ACTIVOS FIJOS OFICIAL.xlsx"

DB = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "sigaf",
    "user":     "sigaf_user",
    "password": "activosfijos",
}

# ── NORMALIZADORES ───────────────────────────────────────────────────────────

def sin_tildes(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )

def norm(s) -> str:
    """Sin tildes · MAYÚSCULAS · trim · sin espacios dobles."""
    if not isinstance(s, str):
        s = "" if (s is None or (isinstance(s, float) and pd.isna(s))) else str(s)
    r = sin_tildes(s).upper().strip()
    while "  " in r:
        r = r.replace("  ", " ")
    return r

# ── MAPEOS ───────────────────────────────────────────────────────────────────
# (city_code, building_code, canonical_name)
EDIFICIO = {
    "COSMOS":               ("1", "01", "COSMOS"),
    "CONSULTORIO JURIDICO": ("1", "02", "CONSULTORIO JURÍDICO"),
    "BLOQUE F":             ("1", "02", "CONSULTORIO JURÍDICO"),  # alias histórico
    "20 DE JULIO":          ("1", "03", "20 DE JULIO"),
    "PRADO":                ("1", "04", "PRADO"),
    "ROMELIO":              ("1", "05", "ROMELIO"),
}

# (asset_type_code, canonical_name)
TIPO_ACTIVO = {
    "PLANTAS, DUCTOS Y TUNELES":                    ("45", "PLANTAS, DUCTOS Y TÚNELES"),
    "MAQUINARIA Y EQUIPO":                          ("55", "MAQUINARIA Y EQUIPO"),
    "EQUIPO MEDICO Y CIENTIFICO":                   ("60", "EQUIPO MÉDICO Y CIENTÍFICO"),
    "EQUIPOS MEDICO Y CIENTIFICO":                  ("60", "EQUIPO MÉDICO Y CIENTÍFICO"),
    "MUEBLES, ENSERES Y EQUIPO DE OFICINA":         ("65", "MUEBLES, ENSERES Y EQUIPO DE OFICINA"),
    "MUEBLES, ENSERES Y EQUIPOS DE OFICINA":        ("65", "MUEBLES, ENSERES Y EQUIPO DE OFICINA"),
    "MUEBLES ENSERES Y EQUIPO DE OFICINA":          ("65", "MUEBLES, ENSERES Y EQUIPO DE OFICINA"),
    "MUEBLES ENSERES Y EQUIPOS DE OFICINA":         ("65", "MUEBLES, ENSERES Y EQUIPO DE OFICINA"),
    "EQUIPOS DE COMUNICACION Y COMPUTACION":        ("70", "EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN"),
    "EQUIPOS DE TRANSPORTE, TRACCION Y ELEVACION":  ("75", "EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN"),
    "EQUIPOS DE TRANSPORTE TRACCION Y ELEVACION":   ("75", "EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN"),
}

SHEET_YEAR = {
    "LEVANTAMIENTO INICIAL":  None,
    "REGISTRO ACTIVOS 2022":  2022,
    "REGISTRO ACTIVOS 2023":  2023,
    "REGISTRO ACTIVOS 2024":  2024,
    "REGISTRO ACTIVOS 2025":  2025,
    "REGISTRO ACTIVOS 2026":  2026,
}

INVALID_SERIALS = {
    "", "NO REGISTRA", "NO REGISTRA.", "S/N", "SIN SERIAL",
    "N/A", "NA", "NINGUNO", "NINGUNA", "0", "NO"
}
INVALID_ACCOUNTS = {"", "NJGF1"}
INVALID_RESPONSABLES = {
    "", "-", "--", "---", "N/A", "NA", "PLACA OK",
    "SIN ASIGNAR", "SIN RESPONSABLE"
}

# ── LIMPIADORES ──────────────────────────────────────────────────────────────

def clean_plate(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip()
    if "." in s:
        s = s.split(".")[0]
    if not s or s in ("", "nan", "NaN", "0", "1"):
        return None
    if len(s) == 12 and s.isdigit():
        return s
    return None

def clean_serial(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip().upper()
    return None if s in INVALID_SERIALS else s[:200]

def clean_value(raw) -> float | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    try:
        return float(str(raw).replace(",", "").replace("$", "").replace(" ", "").strip())
    except (ValueError, TypeError):
        return None

def clean_account(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip().upper()
    return None if s in INVALID_ACCOUNTS else s[:20]

def clean_responsable(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip().upper()
    return None if s in INVALID_RESPONSABLES else s[:200]

def clean_str(raw, maxlen=300) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).strip()
    return None if not s or s.lower() == "nan" else s[:maxlen]

def clean_plate_status(raw) -> str:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return "OK"
    s = str(raw).strip().upper()
    valid = {"OK", "GENERADA", "DUPLICADA", "GRUPO_ERRADO", "FORMATO_INVALIDO", "REQUIERE_REVISION"}
    return s if s in valid else "OK"

# ── PROCESO POR FILA ─────────────────────────────────────────────────────────

def process_row(row: dict, sheet: str, year: int | None) -> dict | None:
    name = clean_str(row.get("NOMBRE ACTIVO"))
    if not name:
        return None  # fila vacía → descartar

    edif_norm = norm(row.get("EDIFICIO", ""))
    edif_info = EDIFICIO.get(edif_norm)
    city_code     = edif_info[0] if edif_info else "1"
    building_code = edif_info[1] if edif_info else None
    building_name = edif_info[2] if edif_info else (edif_norm or None)

    tipo_norm = norm(row.get("TIPO DE ACTIVO", ""))
    tipo_info = TIPO_ACTIVO.get(tipo_norm)
    asset_type_code = tipo_info[0] if tipo_info else None

    return {
        "plate":            clean_plate(row.get("PLACA")),
        "plate_status":     clean_plate_status(row.get("PLACA_ESTADO")),
        "plate_original":   clean_plate(row.get("PLACA_ORIGINAL")),
        "name":             name,
        "description":      clean_str(row.get("DESCRIPCIÓN"), 1000),
        "asset_type_code":  asset_type_code,
        "puc_account":      clean_account(row.get("CUENTA CONTABLE")),
        "brand":            clean_str(row.get("MARCA"), 100),
        "model":            clean_str(row.get("MODELO"), 100),
        "serial":           clean_serial(row.get("SERIAL")),
        "reference_value":  clean_value(row.get("VALOR DE REFERENCIA")),
        "city_code":        city_code,
        "building_code":    building_code,
        "building_name":    building_name,
        "floor":            clean_str(row.get("PISO"), 50),
        "block":            clean_str(row.get("BLOQUE"), 50),
        "location":         clean_str(row.get("UBICACIÓN"), 200),
        "responsable_raw":  clean_responsable(row.get("RESPONSABLE")),
        "incorporation_year": year,
        "source_sheet":     sheet,
    }

# ── CACHÉ DE CATÁLOGOS ───────────────────────────────────────────────────────

_building_cache: dict[tuple, int] = {}
_area_cache:     dict[str, int]   = {}

def get_building_id(cur, city_code, building_code, building_name) -> int | None:
    if not city_code or not building_code:
        return None
    key = (city_code, building_code)
    if key in _building_cache:
        return _building_cache[key]
    cur.execute(
        "SELECT id FROM catalog_buildings WHERE city_code=%s AND code=%s",
        key
    )
    row = cur.fetchone()
    if row:
        _building_cache[key] = row[0]
        return row[0]
    # edificio desconocido — insertar
    cur.execute(
        "INSERT INTO catalog_buildings (city_code, code, name) VALUES (%s,%s,%s) RETURNING id",
        (city_code, building_code, building_name or f"EDIFICIO {building_code}")
    )
    bid = cur.fetchone()[0]
    _building_cache[key] = bid
    return bid

def get_area_id(cur, area_name) -> int | None:
    if not area_name:
        return None
    if area_name in _area_cache:
        return _area_cache[area_name]
    cur.execute("SELECT id FROM catalog_areas WHERE name=%s", (area_name,))
    row = cur.fetchone()
    if row:
        _area_cache[area_name] = row[0]
        return row[0]
    cur.execute("INSERT INTO catalog_areas (name) VALUES (%s) RETURNING id", (area_name,))
    aid = cur.fetchone()[0]
    _area_cache[area_name] = aid
    return aid

# ── SEED PLATE_SEQUENCES ─────────────────────────────────────────────────────

def seed_plate_sequences(cur, conn):
    print("\n  Calculando plate_sequences desde placas OK y GENERADA...")
    cur.execute("""
        INSERT INTO plate_sequences (city_code, building_code, asset_type_code, last_sequence)
        SELECT
          LEFT(plate, 1)          AS city_code,
          SUBSTRING(plate, 2, 2)  AS building_code,
          SUBSTRING(plate, 4, 2)  AS asset_type_code,
          MAX(CAST(RIGHT(plate, 7) AS INTEGER))
        FROM assets
        WHERE plate IS NOT NULL
          AND LENGTH(plate) = 12
          AND plate ~ '^[0-9]{12}$'
          AND plate_status IN ('OK', 'GENERADA')
        GROUP BY 1, 2, 3
        ON CONFLICT (city_code, building_code, asset_type_code)
        DO UPDATE SET
          last_sequence = EXCLUDED.last_sequence,
          updated_at    = NOW()
    """)
    cur.execute("SELECT COUNT(*) FROM plate_sequences")
    n = cur.fetchone()[0]
    conn.commit()
    print(f"  {n} combinaciones registradas en plate_sequences")

# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    sep = "=" * 60
    print(sep)
    print("  SIGAF - Migracion de Inventario Maestro")
    print(sep)

    # 1. Conectar
    print("\n[1/5] Conectando a PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB)
        conn.autocommit = False
        cur = conn.cursor()
        print("  OK")
    except Exception as e:
        print(f"  ERROR de conexión: {e}")
        sys.exit(1)

    # 2. Leer Excel
    print(f"\n[2/5] Leyendo Excel...")
    try:
        xl = pd.ExcelFile(EXCEL_PATH)
        print(f"  Hojas: {xl.sheet_names}")
    except Exception as e:
        print(f"  ERROR leyendo Excel: {e}")
        sys.exit(1)

    # Normalizar nombres de hojas (el Excel tiene espacios trailing en algunas)
    sheet_name_map = {s.strip(): s for s in xl.sheet_names}

    all_rows = []
    for sheet, year in SHEET_YEAR.items():
        actual_sheet = sheet_name_map.get(sheet)
        if actual_sheet is None:
            print(f"  ⚠  Hoja no encontrada: {sheet}")
            continue
        df = xl.parse(actual_sheet, dtype=str)
        df.dropna(how="all", inplace=True)
        ok = skip = 0
        for _, row in df.iterrows():
            r = process_row(row.to_dict(), sheet, year)
            if r:
                all_rows.append(r)
                ok += 1
            else:
                skip += 1
        print(f"  {sheet:35s} → {ok:5,} válidos  |  {skip:4,} descartados")

    print(f"\n  Total a insertar: {len(all_rows):,} activos")

    # 3. Limpiar tablas (idempotente)
    print("\n[3/5] Reiniciando tablas...")
    cur.execute("""
        TRUNCATE
          physical_inventory_items, physical_inventories,
          acta_assets, actas,
          writeoffs, transfers,
          asset_history,
          assets,
          plate_sequences,
          catalog_people, catalog_areas
        RESTART IDENTITY CASCADE
    """)
    conn.commit()
    print("  Tablas limpias")

    # 4. Insertar activos
    print(f"\n[4/5] Insertando {len(all_rows):,} activos...")
    INSERT_SQL = """
        INSERT INTO assets (
          plate, plate_status, plate_original,
          name, description, asset_type_code, puc_account,
          brand, model, serial, quantity, reference_value,
          city_code, building_id, floor, block, location,
          area_id, responsable_raw,
          incorporation_year, source_sheet
        ) VALUES (
          %s, %s, %s,
          %s, %s, %s, %s,
          %s, %s, %s, 1, %s,
          %s, %s, %s, %s, %s,
          %s, %s,
          %s, %s
        )
    """

    inserted = errors = 0
    for i, r in enumerate(all_rows, 1):
        cur.execute("SAVEPOINT sp")
        try:
            bid = get_building_id(cur, r["city_code"], r["building_code"], r["building_name"])
            aid = get_area_id(cur, r["responsable_raw"])
            cur.execute(INSERT_SQL, (
                r["plate"], r["plate_status"], r["plate_original"],
                r["name"], r["description"], r["asset_type_code"], r["puc_account"],
                r["brand"], r["model"], r["serial"], r["reference_value"],
                r["city_code"], bid, r["floor"], r["block"], r["location"],
                aid, r["responsable_raw"],
                r["incorporation_year"], r["source_sheet"],
            ))
            cur.execute("RELEASE SAVEPOINT sp")
            inserted += 1
        except Exception as e:
            cur.execute("ROLLBACK TO SAVEPOINT sp")
            errors += 1
            if errors <= 3:
                print(f"  ERROR fila {i}: {e}")

        if i % 2000 == 0:
            conn.commit()
            print(f"  {i:,} / {len(all_rows):,} ...")

    conn.commit()
    print(f"  Insertados: {inserted:,}  |  Errores: {errors}")

    # 5. Seed plate_sequences
    print("\n[5/5] Inicializando secuencias de placas...")
    seed_plate_sequences(cur, conn)

    # Resumen
    print(f"\n{sep}")
    print("  MIGRACION COMPLETADA")
    print(sep)
    for table, label in [
        ("assets",          "Activos"),
        ("catalog_areas",   "Áreas"),
        ("plate_sequences", "Secuencias de placa"),
    ]:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        print(f"  {label:25s}: {cur.fetchone()[0]:,}")
    print()

    # Muestra de plate_sequences
    cur.execute("""
        SELECT ps.city_code, ps.building_code, cb.name, ps.asset_type_code,
               cat.name AS tipo, ps.last_sequence
          FROM plate_sequences ps
          JOIN catalog_buildings cb
            ON cb.city_code = ps.city_code AND cb.code = ps.building_code
          JOIN catalog_asset_types cat ON cat.code = ps.asset_type_code
         ORDER BY ps.city_code, ps.building_code, ps.asset_type_code
    """)
    rows = cur.fetchall()
    print(f"  {'Edificio':25s} {'Tipo':12s} {'Último':>8}")
    print("  " + "-" * 50)
    for _, _, edif, _, tipo, seq in rows:
        print(f"  {edif:25s} {tipo[:12]:12s} {seq:>8,}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
