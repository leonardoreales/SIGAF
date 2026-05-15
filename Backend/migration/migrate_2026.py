import openpyxl
import psycopg2
import unicodedata
from datetime import date

EXCEL_PATH = r"C:\Users\Leonardo Reales\Desktop\SIGAF\REGISTRO ACTIVOS 2026.xlsx"
DB_CONN = "postgresql://postgres.baqvgyjtqdbypoudcons:IAFFYykAqGoH2R3B@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

TIPO_MAP = {
    "EQUIPOS DE COMUNICACION Y COMPUTACION": "70",
    "MAQUINARIA Y EQUIPO": "55",
    "MUEBLES, ENSERES Y EQUIPO DE OFICINA": "65",
}

EDIFICIO_MAP = {
    "COSMOS": 1,
    "20 DE JULIO": 3,
    "PRADO": 4,
    "ROMELIO": 5,
}


def strip_accents(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").upper().strip()


def normalize_serial(s):
    if not s:
        return None
    clean = str(s).strip().upper()
    return None if clean in ("N/A", "NA", "", "NONE") else clean


def main():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    cur.execute("SELECT id, name FROM catalog_areas WHERE active = true")
    area_lookup = {strip_accents(name): id_ for id_, name in cur.fetchall()}

    cur.execute("SELECT id, full_name FROM catalog_people WHERE active = true")
    person_lookup = {strip_accents(name): id_ for id_, name in cur.fetchall()}

    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb["CONSOLIDADO 2026"]

    records = []
    warnings = []

    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        name        = str(row[0]).strip().upper() if row[0] else None
        description = str(row[1]).strip() if row[1] else None
        tipo_raw    = strip_accents(str(row[2])) if row[2] else ""
        puc_account = str(row[3]).strip() if row[3] else None
        brand       = str(row[4]).strip().upper() if row[4] else None
        model       = str(row[5]).strip().upper() if row[5] else None
        serial      = normalize_serial(row[6])
        edificio    = str(row[7]).strip().upper() if row[7] else None
        floor_val   = str(row[8]).strip() if row[8] else None
        location    = str(row[9]).strip().upper() if row[9] else None
        area_raw    = str(row[10]).strip() if row[10] else None
        quantity    = int(row[12]) if row[12] else 1
        val_unit    = float(row[13] or 0)
        subtotal    = float(row[14] or 0)
        iva         = float(row[15] or 0)
        val_ref     = float(row[16] or 0)
        acq_date    = row[18].date() if hasattr(row[18], "date") else row[18]

        if not name:
            continue

        expected = round(subtotal + iva, 2)
        if abs(expected - val_ref) > 1:
            warnings.append(f"Fila {row_idx}: SUBTOTAL+IVA={expected} != VALOR_REF={val_ref} [{name}]")

        asset_type_code = TIPO_MAP.get(tipo_raw)
        if not asset_type_code:
            warnings.append(f"Fila {row_idx}: tipo desconocido '{row[2]}' [{name}]")
            continue

        building_id = EDIFICIO_MAP.get(edificio)
        if not building_id:
            warnings.append(f"Fila {row_idx}: edificio desconocido '{edificio}' [{name}]")
            continue

        area_id = None
        person_id = None
        responsable_raw = area_raw if (area_raw and area_raw != "-") else None
        if responsable_raw:
            normalized = strip_accents(responsable_raw)
            area_id = area_lookup.get(normalized)
            if area_id is None:
                person_id = person_lookup.get(normalized)
                if person_id is None:
                    warnings.append(f"Fila {row_idx}: responsable no mapeado '{area_raw}' [{name}] — se creará como persona")

        records.append((
            name, description, asset_type_code, puc_account,
            brand, model, serial,
            "1", building_id, floor_val, None, location,
            area_id, person_id, responsable_raw, "ACTIVO",
            quantity, val_ref,
            2026, acq_date, "POLIZA_2026",
        ))

    print(f"Filas procesadas : {row_idx - 1}")
    print(f"Registros a insertar: {len(records)}")
    print(f"Advertencias      : {len(warnings)}")
    for w in warnings:
        print(" ", w)

    confirm = input("\n¿Ejecutar INSERT en Supabase? (s/N): ").strip().lower()
    if confirm != "s":
        print("Abortado.")
        conn.close()
        return

    cur.executemany("""
        INSERT INTO assets (
            name, description, asset_type_code, puc_account,
            brand, model, serial,
            city_code, building_id, floor, block, location,
            area_id, person_id, responsable_raw, status,
            quantity, reference_value,
            incorporation_year, acquisition_date, source_sheet
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, records)

    conn.commit()
    print(f"\n✓ {cur.rowcount} activos insertados correctamente.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
