#!/usr/bin/env python3
"""
SIGAF — Auditoría de reference_value para hoja REGISTRO ACTIVOS 2025
Compara valores en BD (Supabase) contra el Excel oficial.
Read-only: no modifica nada.

Uso:
    python audit_reference_values.py > audit_report_2025.txt
"""

import os
import sys
import pandas as pd
import psycopg2
import psycopg2.extras

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────

EXCEL_PATH = r"C:\Users\Leonardo Reales\Desktop\SIGAF\INVENTARIO MAESTRO DE ACTIVOS FIJOS OFICIAL.xlsx"
TARGET_SHEET = "REGISTRO ACTIVOS 2025"

# Umbral a partir del cual un valor se considera potencialmente anómalo (>10M COP)
ANOMALY_THRESHOLD = 10_000_000

# Activos ya identificados como anómalos (por análisis comparativo interno)
SUSPECTED_PLATES = {
    "105550000072", "105550000073", "105550000074",
    "105550000075", "105550000076", "105550000077",
    "105550000078", "105550000079",
    "105550000081", "105550000082", "105550000083",
    "105550000084", "105550000085", "105550000086",
    "105550000087", "105550000088", "105550000089",
    "101700001972",
}

DB = {
    "host":     "aws-1-us-east-1.pooler.supabase.com",
    "port":     5432,
    "dbname":   "postgres",
    "user":     "postgres.baqvgyjtqdbypoudcons",
    "password": "IAFFYykAqGoH2R3B",
    "sslmode":  "require",
}

# ── HELPERS ───────────────────────────────────────────────────────────────────

def fmt_cop(v):
    if v is None:
        return "NULL"
    return f"${v:>20,.2f}"

def clean_plate(raw) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if "." in s:
        s = s.split(".")[0]
    if len(s) == 12 and s.isdigit():
        return s
    return None

def clean_value(raw) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, float) and pd.isna(raw):
        return None
    try:
        return float(str(raw).replace(",", "").replace("$", "").replace(" ", "").strip())
    except (ValueError, TypeError):
        return None

def ratio_label(r: float) -> str:
    if abs(r - 1.0) < 0.01:
        return "IGUAL (error en Excel también)"
    if abs(r - 1000.0) < 10:
        return "×1000 — bug migración (divide por 1000)"
    if abs(r - 100.0) < 5:
        return "×100 — posible bug"
    if abs(r - 10.0) < 2:
        return "×10 — posible bug"
    return f"×{r:.1f} — revisar manualmente"

# ── PASO 1: Leer Excel ────────────────────────────────────────────────────────

print("=" * 72)
print("SIGAF — Auditoría reference_value · REGISTRO ACTIVOS 2025")
print("=" * 72)

if not os.path.exists(EXCEL_PATH):
    sys.exit(f"ERROR: No se encontró el Excel en {EXCEL_PATH}")

print(f"\nLeyendo hoja '{TARGET_SHEET}' de {os.path.basename(EXCEL_PATH)}...")
try:
    df_excel = pd.read_excel(EXCEL_PATH, sheet_name=TARGET_SHEET, dtype=str)
except Exception as e:
    sys.exit(f"ERROR al leer Excel: {e}")

print(f"  Columnas encontradas: {list(df_excel.columns)}")
print(f"  Filas totales: {len(df_excel)}")

# Detectar columnas de placa y valor (tolerante a variaciones de nombre)
plate_col = next(
    (c for c in df_excel.columns if "PLACA" in str(c).upper() and "ESTADO" not in str(c).upper()),
    None
)
value_col = next(
    (c for c in df_excel.columns if "VALOR" in str(c).upper() and "REFER" in str(c).upper()),
    None
)

if not plate_col or not value_col:
    sys.exit(f"ERROR: No se encontraron columnas PLACA/VALOR. Columnas disponibles: {list(df_excel.columns)}")

print(f"  Columna placa: '{plate_col}' | Columna valor: '{value_col}'")

# Construir dict placa → valor_excel (solo filas con placa válida)
excel_map: dict[str, float | None] = {}
excel_names: dict[str, str] = {}
name_col = next((c for c in df_excel.columns if "NOMBRE" in str(c).upper()), None)

for _, row in df_excel.iterrows():
    plate = clean_plate(row.get(plate_col))
    if not plate:
        continue
    val = clean_value(row.get(value_col))
    excel_map[plate] = val
    if name_col:
        excel_names[plate] = str(row.get(name_col, "")).strip()

print(f"  Filas con placa válida en Excel: {len(excel_map)}")

# ── PASO 2: Leer BD ───────────────────────────────────────────────────────────

print("\nConectando a Supabase...")
try:
    conn = psycopg2.connect(**DB)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
except Exception as e:
    sys.exit(f"ERROR al conectar BD: {e}")

cur.execute("""
    SELECT a.id, a.plate, a.name, a.reference_value::float,
           a.incorporation_year, a.source_sheet, cb.name as edificio
    FROM assets a
    LEFT JOIN catalog_buildings cb ON a.building_id = cb.id
    WHERE a.source_sheet = 'REGISTRO ACTIVOS 2025'
      AND a.incorporation_year = 2025
""")
db_rows = cur.fetchall()
cur.close()
conn.close()

db_map: dict[str, dict] = {r["plate"]: r for r in db_rows if r["plate"]}
print(f"  Activos en BD (source_sheet=2025): {len(db_map)}")

# ── PASO 3: Comparar ──────────────────────────────────────────────────────────

print("\n" + "=" * 72)
print("SECCIÓN A — SOSPECHOSOS IDENTIFICADOS (19 activos × 1000)")
print("=" * 72)
print(f"{'PLACA':<15} {'NOMBRE':<32} {'VALOR BD':>20} {'VALOR EXCEL':>20} {'RATIO':>8} {'CONCLUSIÓN'}")
print("-" * 115)

discrepancias = []
nulls_en_excel = []
no_match_excel = []

for plate in sorted(SUSPECTED_PLATES):
    db_row = db_map.get(plate)
    excel_val = excel_map.get(plate)
    db_val = db_row["reference_value"] if db_row else None
    name = (db_row["name"] if db_row else excel_names.get(plate, "?"))[:31]

    if db_row and excel_val and db_val:
        if excel_val > 0:
            ratio = db_val / excel_val
            conclusion = ratio_label(ratio)
            print(f"{plate:<15} {name:<32} {fmt_cop(db_val)} {fmt_cop(excel_val)} {ratio:>8.1f}  {conclusion}")
            discrepancias.append({
                "plate": plate, "name": name,
                "db_val": db_val, "excel_val": excel_val,
                "ratio": ratio, "conclusion": conclusion,
            })
        else:
            print(f"{plate:<15} {name:<32} {fmt_cop(db_val)} {'$0 en Excel':>20} {'   N/A':>8}  EXCEL TIENE $0")
    elif db_row and (excel_val is None):
        print(f"{plate:<15} {name:<32} {fmt_cop(db_val)} {'sin match Excel':>20} {'   N/A':>8}  SIN PLACA EN EXCEL")
        no_match_excel.append(plate)
    else:
        print(f"{plate:<15} {'?':<32} {'sin datos BD':>20} {fmt_cop(excel_val):>20} {'   N/A':>8}  SIN DATOS BD")

# ── PASO 4: Otros activos 2025 con valor > umbral ────────────────────────────

print("\n" + "=" * 72)
print(f"SECCIÓN B — OTROS ACTIVOS 2025 CON VALOR > ${ANOMALY_THRESHOLD:,} (no incluidos en sospechosos)")
print("=" * 72)

otros_altos = [
    r for r in db_rows
    if r["plate"] not in SUSPECTED_PLATES
    and r["reference_value"] and r["reference_value"] > ANOMALY_THRESHOLD
]
otros_altos.sort(key=lambda r: -(r["reference_value"] or 0))

if otros_altos:
    print(f"{'PLACA':<15} {'NOMBRE':<36} {'VALOR BD':>18} {'EDIFICIO'}")
    print("-" * 90)
    for r in otros_altos:
        excel_val = excel_map.get(r["plate"])
        ratio_str = ""
        if excel_val and excel_val > 0:
            ratio_str = f"  (ratio vs Excel: ×{r['reference_value']/excel_val:.1f})"
        print(f"{r['plate']:<15} {str(r['name'])[:35]:<36} {fmt_cop(r['reference_value'])} {r['edificio'] or '?'}{ratio_str}")
else:
    print("  Ninguno — todos los valores altos corresponden a los sospechosos ya identificados.")

# ── PASO 5: NULLs en BD con valor en Excel ───────────────────────────────────

null_en_bd = [
    (plate, val) for plate, val in excel_map.items()
    if plate in db_map and db_map[plate]["reference_value"] is None and val
]
if null_en_bd:
    print(f"\n{'=' * 72}")
    print("SECCIÓN C — NULLS EN BD (Excel tiene valor, BD tiene NULL)")
    print("=" * 72)
    for plate, val in null_en_bd[:20]:
        name = db_map[plate]["name"]
        print(f"  {plate}  {name:<40}  Excel: {fmt_cop(val)}")
    if len(null_en_bd) > 20:
        print(f"  ... y {len(null_en_bd) - 20} más")

# ── PASO 6: Resumen ───────────────────────────────────────────────────────────

print("\n" + "=" * 72)
print("RESUMEN EJECUTIVO")
print("=" * 72)

bug_migracion = [d for d in discrepancias if abs(d["ratio"] - 1000) < 10]
igual_en_excel = [d for d in discrepancias if abs(d["ratio"] - 1.0) < 0.01]

total_db_anomalo = sum(d["db_val"] for d in discrepancias)
total_corregido = sum(d["db_val"] / 1000 for d in bug_migracion) + sum(d["db_val"] for d in igual_en_excel)
ahorro = total_db_anomalo - total_corregido

print(f"  Activos sospechosos analizados:  {len(SUSPECTED_PLATES)}")
print(f"  Con patrón ×1000 (bug migración): {len(bug_migracion)}")
print(f"  Igual en Excel (error de captura): {len(igual_en_excel)}")
print(f"  Sin match en Excel:                {len(no_match_excel)}")
print()
print(f"  Suma actual (valores anómalos):  {fmt_cop(total_db_anomalo)}")
print(f"  Suma corregida (÷1000):          {fmt_cop(total_corregido)}")
print(f"  Reducción en valoración:         {fmt_cop(ahorro)}")
print()

if bug_migracion:
    print("  ACCION RECOMENDADA:")
    print(f"  -> Aplicar fix_reference_values_2025.sql (UPDATE ... / 1000)")
    print(f"     para {len(bug_migracion)} activos con patron x1000 confirmado.")
if igual_en_excel:
    print("  PENDIENTE REVISION CONTABLE:")
    print(f"  -> {len(igual_en_excel)} activos donde Excel tambien tiene el valor inflado.")
    print("     Error de captura humana en Excel. Correccion division/1000")
    print("     avalada por referencias internas de la BD (mismos activos años anteriores).")
    print("     Requiere validacion del area contable antes de ejecutar SQL.")

print("\n" + "=" * 72)
print("FIN DEL REPORTE — generado por audit_reference_values.py")
print("=" * 72)
