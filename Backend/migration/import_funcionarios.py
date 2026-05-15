"""
SIGAF — Sincronización oficial de funcionarios → catalog_people.

Pipeline senior de 4 fases (AUDIT · NORMALIZE · DIFF · COMMIT) con dry-run,
upsert idempotente por identificacion, y 3 artefactos de salida.

Uso:
    python import_funcionarios.py --dry-run          # auditoría + preview, sin escribir
    python import_funcionarios.py                    # commit a DB (transacción única)
    python import_funcionarios.py --source otro.xlsx # archivo alternativo

Auditoría real del Excel (verificada 2026-05-15):
    157 filas · 0 sin ID · 4 sin cargo/área · 0 sin nombre
    10 INDEFINIDO · 2 vencidos · 11 próximos a vencer (≤30d)
"""

import argparse
import csv
import logging
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# Windows: forzar UTF-8 en stdout/stderr para que los caracteres del log
# (→, ─, tildes en nombres) no rompan en cp1252.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── Constants ────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DEFAULT_EXCEL = Path(r"C:\Users\Leonardo Reales\Downloads\RELACIÓN FUNCIONARIOS ADMINISTRATIVOS.xlsx")
SHEET_NAME = "Administrativa"
DB_CONN = (
    "postgresql://postgres.baqvgyjtqdbypoudcons:IAFFYykAqGoH2R3B"
    "@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
)

COL_MAP = {
    "ID":           "identificacion_raw",
    "NOMBRE":       "full_name_raw",
    "CARGO":        "cargo_raw",
    "ÁREA":         "area_raw",
    "FECHA INICIO": "start_raw",
    "FECHA FIN":    "end_raw",
}

CARGO_ABBR = {
    "COORD.":  "COORDINADOR",
    "DIR.":    "DIRECTOR",
    "AUX.":    "AUXILIAR",
    "PROF.":   "PROFESIONAL",
    "ASIS.":   "ASISTENTE",
    "JEF.":    "JEFE",
    "ADM.":    "ADMINISTRADOR",
}

VALID_ID_LENGTHS = {7, 8, 9, 10}
TODAY = date.today()

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s]  %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("import_funcionarios")


# ── Outputs ──────────────────────────────────────────────────────────────────
@dataclass
class WarnEntry:
    row_index: int
    identificacion: str | None
    campo: str
    valor_original: Any
    tipo_error: str


@dataclass
class PipelineState:
    df_clean: pd.DataFrame | None = None
    df_classified: pd.DataFrame | None = None
    warnings: list[WarnEntry] = field(default_factory=list)
    skipped: list[dict] = field(default_factory=list)


# ── Normalización (puras, sin IO) ────────────────────────────────────────────
def strip_accents(s: str) -> str:
    return (
        unicodedata.normalize("NFD", s)
        .encode("ascii", "ignore")
        .decode("ascii")
        .upper()
        .strip()
    )


def normalize_id(val: Any) -> tuple[str | None, str | None]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None, "ID nulo"
    try:
        as_int = int(val)
        s = str(as_int)
    except (TypeError, ValueError):
        return None, f"ID no numérico: {val!r}"
    if len(s) not in VALID_ID_LENGTHS:
        return s, f"longitud inusual ({len(s)} dígitos)"
    return s, None


def normalize_name(val: Any) -> tuple[str | None, str | None]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None, "NOMBRE nulo"
    s = str(val).strip()
    if not s:
        return None, "NOMBRE vacío"
    s = re.sub(r"\s+", " ", s).upper()
    if len(s.split()) < 2:
        return s, "menos de 2 palabras"
    return s, None


def normalize_cargo(val: Any) -> tuple[str | None, str | None]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None, "CARGO nulo"
    s = re.sub(r"\s+", " ", str(val).strip()).upper()
    if not s:
        return None, "CARGO vacío"
    for abbr, full in CARGO_ABBR.items():
        s = re.sub(rf"\b{re.escape(abbr)}", full, s)
    return s, None


def normalize_area(val: Any) -> tuple[str | None, str | None]:
    """Devuelve (clave_canonica, warning).
    La clave es UPPER + sin tildes, usada para deduplicar áreas que vienen
    con distinta capitalización/acentos en el Excel.
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None, "ÁREA nula"
    raw = str(val).strip()
    if not raw:
        return None, "ÁREA vacía"
    return strip_accents(raw), None


def parse_date(val: Any) -> tuple[date | None, str | None]:
    if val is None:
        return None, None
    if isinstance(val, float) and pd.isna(val):
        return None, None
    if isinstance(val, (pd.Timestamp, datetime)):
        return val.date(), None
    if isinstance(val, date):
        return val, None
    s = str(val).strip().upper()
    if not s or s == "INDEFINIDO":
        return None, None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date(), None
        except ValueError:
            continue
    return None, f"fecha no parseable: {val!r}"


def derive_active(end_date: date | None) -> bool:
    return end_date is None or end_date > TODAY


# ── FASE 0 — AUDIT ───────────────────────────────────────────────────────────
def load_raw(path: Path) -> pd.DataFrame:
    log.info("Cargando: %s (hoja: %s)", path.name, SHEET_NAME)
    df = pd.read_excel(path, sheet_name=SHEET_NAME)
    df.columns = df.columns.str.strip()  # CRÍTICO: 'ÁREA ' → 'ÁREA'
    log.info("%d filas cargadas. Columnas: %s", len(df), list(df.columns))
    return df


def detect_issues(df: pd.DataFrame) -> None:
    """Reporta anomalías de FASE 0 (lectura). Solo log, no modifica nada."""
    log.info("─" * 60)
    log.info("FASE 0 — AUDIT")

    missing = {col: df[col].isna().sum() for col in df.columns}
    log.info("  Nulos por columna: %s", {k: int(v) for k, v in missing.items() if v > 0})

    if "FECHA FIN" in df.columns:
        ff = df["FECHA FIN"]
        indef = ff.astype(str).str.upper().eq("INDEFINIDO").sum()
        log.info('  "INDEFINIDO" en FECHA FIN: %d', int(indef))
        fechas = pd.to_datetime(ff, errors="coerce")
        today_ts = pd.Timestamp(TODAY)
        vencidas = int(((fechas.notna()) & (fechas <= today_ts)).sum())
        prox30 = int(((fechas > today_ts) & (fechas <= today_ts + pd.Timedelta(days=30))).sum())
        log.info("  Contratos vencidos (≤ hoy): %d", vencidas)
        log.info("  Próximos a vencer (≤ 30 días): %d  ← lista crítica paz y salvo", prox30)


# ── FASE 1 — NORMALIZE ───────────────────────────────────────────────────────
def normalize_dataframe(df: pd.DataFrame, state: PipelineState) -> pd.DataFrame:
    log.info("─" * 60)
    log.info("FASE 1 — NORMALIZACIÓN")

    rows: list[dict] = []
    for raw_idx, row in df.iterrows():
        row_index = int(raw_idx) + 2  # +2 = header + base-1 humano

        identificacion, id_warn = normalize_id(row.get("ID"))
        full_name, name_warn = normalize_name(row.get("NOMBRE"))
        cargo, cargo_warn = normalize_cargo(row.get("CARGO"))
        area_key, area_warn = normalize_area(row.get("ÁREA"))
        start_date, start_warn = parse_date(row.get("FECHA INICIO"))
        end_date, end_warn = parse_date(row.get("FECHA FIN"))
        active = derive_active(end_date)

        # SKIP hard solo si falta ID o nombre (clave de upsert / display)
        if identificacion is None:
            state.skipped.append({"row_index": row_index, "razon": id_warn or "ID nulo"})
            continue
        if full_name is None:
            state.skipped.append({"row_index": row_index, "razon": name_warn or "NOMBRE nulo"})
            continue

        # WARNs (no bloquean)
        for campo, warn, valor in (
            ("ID",     id_warn,    row.get("ID")),
            ("NOMBRE", name_warn,  row.get("NOMBRE")),
            ("CARGO",  cargo_warn, row.get("CARGO")),
            ("ÁREA",   area_warn,  row.get("ÁREA")),
            ("FECHA INICIO", start_warn, row.get("FECHA INICIO")),
            ("FECHA FIN",    end_warn,   row.get("FECHA FIN")),
        ):
            if warn:
                state.warnings.append(WarnEntry(row_index, identificacion, campo, valor, warn))

        rows.append({
            "row_index":           row_index,
            "identificacion":      identificacion,
            "full_name":           full_name,
            "cargo":               cargo,
            "area_key":            area_key,         # clave para lookup/insert
            "area_original":       str(row.get("ÁREA")).strip() if not pd.isna(row.get("ÁREA")) else None,
            "contract_start_date": start_date,
            "contract_end_date":   end_date,
            "active":              active,
        })

    clean = pd.DataFrame(rows)
    log.info("  Procesables: %d  ·  Omitidos: %d  ·  WARNs: %d",
             len(clean), len(state.skipped), len(state.warnings))
    state.df_clean = clean
    return clean


# ── FASE 2 — DIFF ────────────────────────────────────────────────────────────
def fetch_existing(conn) -> dict[str, dict]:
    """Devuelve {identificacion: row_dict} de catalog_people."""
    cur = conn.cursor()
    cur.execute("""
        SELECT cp.identificacion, cp.full_name, cp.cargo, cp.area_id, ca.name AS area_name,
               cp.contract_start_date, cp.contract_end_date, cp.active, cp.id
        FROM catalog_people cp
        LEFT JOIN catalog_areas ca ON ca.id = cp.area_id
        WHERE cp.identificacion IS NOT NULL
    """)
    cols = [d[0] for d in cur.description]
    existing = {r[0]: dict(zip(cols, r)) for r in cur.fetchall()}
    cur.close()
    log.info("  %d registros ya en catalog_people con identificación.", len(existing))
    return existing


def fetch_areas(conn) -> dict[str, dict]:
    """Devuelve {clave_canonica: {id, name}}. Clave: UPPER + sin tildes."""
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM catalog_areas WHERE active = true")
    areas = {strip_accents(name): {"id": id_, "name": name} for id_, name in cur.fetchall()}
    cur.close()
    return areas


def classify_records(clean: pd.DataFrame, existing: dict[str, dict],
                     area_map: dict[str, dict]) -> pd.DataFrame:
    """Agrega columna 'accion' (INSERT/UPDATE/SKIP) y 'cambios' (diff legible)."""
    actions, changes, area_ids = [], [], []
    for _, row in clean.iterrows():
        ident = row["identificacion"]
        # pandas convierte None → nan (truthy) en Series; usar pd.notna() siempre.
        area_key = row["area_key"] if pd.notna(row["area_key"]) else None
        area_id = area_map.get(area_key, {}).get("id") if area_key else None
        area_ids.append(area_id)

        if ident not in existing:
            actions.append("INSERT")
            changes.append("")
            continue

        prev = existing[ident]
        diffs = []
        if prev["full_name"] != row["full_name"]:
            diffs.append(f"full_name: {prev['full_name']!r}→{row['full_name']!r}")
        if (prev["cargo"] or None) != (row["cargo"] or None):
            diffs.append(f"cargo: {prev['cargo']!r}→{row['cargo']!r}")
        if (prev["area_id"] or None) != (area_id or None):
            diffs.append(f"area_id: {prev['area_id']}→{area_id}")
        if (prev["contract_end_date"] or None) != (row["contract_end_date"] or None):
            diffs.append(f"contract_end_date: {prev['contract_end_date']}→{row['contract_end_date']}")
        if bool(prev["active"]) != bool(row["active"]):
            diffs.append(f"active: {prev['active']}→{row['active']}")

        if diffs:
            actions.append("UPDATE")
            changes.append("  |  ".join(diffs))
        else:
            actions.append("SKIP")
            changes.append("sin cambios")

    out = clean.copy()
    out["area_id"] = area_ids
    out["accion"] = actions
    out["cambios"] = changes
    return out


def export_preview(classified: pd.DataFrame, out_path: Path) -> None:
    cols = ["accion", "identificacion", "full_name", "cargo", "area_original",
            "area_id", "contract_start_date", "contract_end_date", "active",
            "cambios", "row_index"]
    preview = classified[cols].copy()
    preview = preview.sort_values(["accion", "identificacion"], ascending=[True, True])
    preview.to_excel(out_path, index=False)
    log.info("  Preview guardado: %s", out_path.name)


def export_errors(state: PipelineState, out_path: Path) -> None:
    if not state.warnings and not state.skipped:
        return
    with out_path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["row_index", "identificacion", "campo", "valor_original", "tipo_error"])
        for warn in state.warnings:
            w.writerow([warn.row_index, warn.identificacion or "", warn.campo,
                        warn.valor_original, warn.tipo_error])
        for sk in state.skipped:
            w.writerow([sk["row_index"], "", "FILA", "", sk["razon"]])
    log.info("  Errores/warnings: %s (%d warn · %d skip)",
             out_path.name, len(state.warnings), len(state.skipped))


# ── FASE 3 — COMMIT ──────────────────────────────────────────────────────────
def upsert_areas_missing(conn, classified: pd.DataFrame,
                         existing_areas: dict[str, dict]) -> dict[str, dict]:
    """Inserta áreas que no existen aún. Devuelve mapa actualizado."""
    needed: dict[str, str] = {}
    for _, row in classified.iterrows():
        key = row["area_key"]
        original = row["area_original"]
        if pd.notna(key) and key and key not in existing_areas:
            # Fallback al key si original fuera nan (no debería ocurrir si key existe)
            needed[key] = original if pd.notna(original) else key
    if not needed:
        return existing_areas

    cur = conn.cursor()
    inserted = []
    for key, original in needed.items():
        # Insertamos con el original como display (preserva tildes/casing)
        cur.execute(
            "INSERT INTO catalog_areas (name, active) VALUES (%s, true) "
            "ON CONFLICT (name) DO UPDATE SET active = true RETURNING id, name",
            (original.strip().upper(),)
        )
        id_, name = cur.fetchone()
        existing_areas[strip_accents(name)] = {"id": id_, "name": name}
        inserted.append(name)
    cur.close()
    log.info("  Áreas nuevas insertadas: %d  → %s", len(inserted), inserted)
    return existing_areas


def upsert_people(conn, classified: pd.DataFrame) -> dict[str, int]:
    """Upsert idempotente por identificacion. WHERE evita escrituras sin cambio."""
    def n(v):
        """Coerce pandas nan/NaT a None para psycopg2."""
        return None if pd.isna(v) else v

    rows = []
    for _, r in classified.iterrows():
        if r["accion"] == "SKIP":
            continue
        rows.append((
            n(r["full_name"]),
            n(r["identificacion"]),
            n(r["cargo"]),
            n(r["area_id"]),
            n(r["contract_start_date"]),
            n(r["contract_end_date"]),
            bool(r["active"]),
        ))
    if not rows:
        log.info("  Sin filas para upsert.")
        return {"inserted": 0, "updated": 0}

    cur = conn.cursor()
    sql = """
        INSERT INTO catalog_people
            (full_name, identificacion, cargo, area_id,
             contract_start_date, contract_end_date, active, updated_at)
        VALUES %s
        ON CONFLICT (identificacion) DO UPDATE SET
            full_name           = EXCLUDED.full_name,
            cargo               = EXCLUDED.cargo,
            area_id             = EXCLUDED.area_id,
            contract_start_date = EXCLUDED.contract_start_date,
            contract_end_date   = EXCLUDED.contract_end_date,
            active              = EXCLUDED.active,
            updated_at          = NOW()
        WHERE
            catalog_people.full_name           IS DISTINCT FROM EXCLUDED.full_name OR
            catalog_people.cargo               IS DISTINCT FROM EXCLUDED.cargo OR
            catalog_people.area_id             IS DISTINCT FROM EXCLUDED.area_id OR
            catalog_people.contract_start_date IS DISTINCT FROM EXCLUDED.contract_start_date OR
            catalog_people.contract_end_date   IS DISTINCT FROM EXCLUDED.contract_end_date OR
            catalog_people.active              IS DISTINCT FROM EXCLUDED.active
        RETURNING xmax = 0 AS inserted
    """
    template = "(%s, %s, %s, %s, %s, %s, %s, NOW())"
    results = execute_values(cur, sql, rows, template=template, fetch=True)
    inserted = sum(1 for (is_ins,) in results if is_ins)
    updated = len(results) - inserted
    cur.close()
    log.info("  Personas: %d insertadas · %d actualizadas", inserted, updated)
    return {"inserted": inserted, "updated": updated}


def export_audit_log(stats: dict, out_path: Path) -> None:
    with out_path.open("w", encoding="utf-8") as fh:
        fh.write(f"# import_funcionarios.py — audit log\n")
        fh.write(f"# timestamp: {datetime.now().isoformat()}\n")
        fh.write(f"# inserted: {stats.get('inserted', 0)}\n")
        fh.write(f"# updated:  {stats.get('updated', 0)}\n")
    log.info("  Audit log: %s", out_path.name)


# ── Main ─────────────────────────────────────────────────────────────────────
def main(dry_run: bool, source: Path) -> int:
    if not source.exists():
        log.error("Archivo fuente no existe: %s", source)
        return 1

    state = PipelineState()
    preview_path = SCRIPT_DIR / "funcionarios_preview.xlsx"
    errors_path  = SCRIPT_DIR / "funcionarios_errors.csv"
    audit_path   = SCRIPT_DIR / "funcionarios_audit.log"

    # FASE 0
    df = load_raw(source)
    detect_issues(df)

    # FASE 1
    clean = normalize_dataframe(df, state)
    if clean.empty:
        log.error("Pipeline detenido — 0 registros procesables.")
        return 1

    # FASE 2 (necesita DB para diff aunque sea dry-run)
    log.info("─" * 60)
    log.info("FASE 2 — DIFF (lectura DB)")
    conn = psycopg2.connect(DB_CONN)
    try:
        existing = fetch_existing(conn)
        area_map = fetch_areas(conn)
        classified = classify_records(clean, existing, area_map)
        state.df_classified = classified

        counts = classified["accion"].value_counts().to_dict()
        log.info("  Acciones: %d INSERT · %d UPDATE · %d SKIP",
                 counts.get("INSERT", 0), counts.get("UPDATE", 0), counts.get("SKIP", 0))

        export_preview(classified, preview_path)
        export_errors(state, errors_path)

        if dry_run:
            log.info("─" * 60)
            log.info("✓ DRY-RUN completado. No se escribió en DB.")
            log.info("  Revisar %s antes de correr sin --dry-run.", preview_path.name)
            return 0

        # FASE 3 — COMMIT (transacción única)
        log.info("─" * 60)
        log.info("FASE 3 — COMMIT")
        area_map = upsert_areas_missing(conn, classified, area_map)

        # Recalcular area_id por si insertamos áreas nuevas
        for idx, row in classified.iterrows():
            if pd.notna(row["area_key"]) and row["area_key"]:
                area = area_map.get(row["area_key"])
                if area:
                    classified.at[idx, "area_id"] = area["id"]

        stats = upsert_people(conn, classified)
        conn.commit()
        export_audit_log(stats, audit_path)
        log.info("─" * 60)
        log.info("✓ COMMIT exitoso. Transacción aplicada.")
        return 0

    except Exception as exc:  # noqa: BLE001
        conn.rollback()
        log.exception("✗ Error en pipeline — ROLLBACK ejecutado: %s", exc)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importer de funcionarios SIGAF → catalog_people")
    parser.add_argument("--dry-run", action="store_true",
                        help="Ejecuta FASE 0+1+2, genera preview, NO escribe en DB.")
    parser.add_argument("--source", type=Path, default=DEFAULT_EXCEL,
                        help="Ruta alternativa al Excel (default: ruta canónica en Downloads).")
    args = parser.parse_args()
    sys.exit(main(dry_run=args.dry_run, source=args.source))
