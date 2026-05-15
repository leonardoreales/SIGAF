# Saneamiento de Catálogos — Áreas y Personas
**SIGAF · Gobierno de Datos · 2026-05-15**
**Estado:** Pendiente de ejecución | **Revisado por:** Leonardo Reales

---

## 1. Problema

El catálogo `catalog_areas` contiene registros que no son áreas institucionales:
- **22 filas** son nombres de personas físicas (ej. `SERGIO ECHEVERRIA`, `MARIA FERNANDA VARELA`).
- **1 fila** es un valor inválido sin semántica de área ni persona (`35 MM NUEVO` — es el campo `responsable_raw` de un TORNO).
- **Duplicados semánticos** por falta de normalización de acentos y typos.

El catálogo `catalog_people` tiene **0 registros**. El campo `assets.person_id` nunca ha sido poblado, aunque el schema y la UI de personas existen y funcionan.

---

## 2. Evidencia Validada

Métricas obtenidas directamente de la BD (2026-05-15):

| Métrica | Valor |
|---------|-------|
| `catalog_areas` total | 61 |
| `catalog_areas` activas | 61 |
| `catalog_people` total | **0** |
| `assets` con `area_id` | 655 |
| `assets` con `person_id` | **0** |
| `assets` con `responsable_raw` | 658 |
| Áreas activas sin activos | 5 |

---

## 3. Clasificación Definitiva de catalog_areas

### 3.1 Entrada inválida (1 fila)

| id | name | activos | Acción |
|----|------|---------|--------|
| 1 | `35 MM NUEVO` | 1 | `area_id = NULL` en el activo (TORNO id=2844); desactivar |

### 3.2 Personas — migrar a catalog_people (22 filas)

Todos tienen 1 activo. La acción es: **INSERT en `catalog_people`** → **UPDATE `assets.person_id`** → **`active = false`** en `catalog_areas`.

| id | name | activos |
|----|------|---------|
| 4 | SERGIO ECHEVERRIA | 1 |
| 5 | SARAY SALGADO | 1 |
| 6 | MARIA FERNANDA VARELA | 1 |
| 7 | CHARLYN FAJARDO | 1 |
| 8 | MARIA CAROLINA | 1 |
| 9 | MELISSA DE LA ROSA | 1 |
| 10 | CORREOR ANDREA | 1 |
| 11 | ROMARIO PULGARIN | 1 |
| 12 | MARICARMEN PALLARES | 1 |
| 13 | JOSED DE ALBA | 1 |
| 14 | JESSICA PALENCIA | 1 |
| 15 | LUZ CALA | 1 |
| 16 | ESTEFANY SONADO | 1 |
| 17 | JEISON STEVEN | 1 |
| 18 | OSIO MAURY ALVARO | 1 |
| 19 | YULIETH PUELLO | 1 |
| 20 | REINALDO ORELLANO | 1 |
| 21 | EDUIN GRANADILLO | 1 |
| 22 | LAURA CASTRO | 1 |
| 23 | HAROLD ALMANZA | 1 |
| 24 | ANGEL LUIS ARNOVIS | 1 |
| 25 | VERONICA AGUILAR | 1 |

### 3.3 Duplicados de áreas — consolidar (7 grupos)

| Canónica (conservar) | Duplicadas (desactivar) | Activos a reasignar |
|----------------------|------------------------|---------------------|
| id=35 `VICERRECTORÍA ACADÉMICA` (40) | id=32 `VICERRECTORIA ACADÉMICA` (1), id=41 `VICERRECTORIA ACADEMICA` (1) | 2 |
| id=36 `VICERRECTORÍA DE INVESTIGACIÓN` (31) | id=34 `VICERRECTORIA DE INVESTIGACIÓN` (12) | 12 |
| id=27 `INFRAESTRUCTURA` (41) | id=43 `INFRAESTRUTURA` (3) — typo | 3 |
| id=31 `POSGRADOS` (54) | id=26 `POSGRADO` (2) | 2 |
| id=39 `SISTEMAS` (0) | id=42 `SISETMAS` (0) — typo | 0 |
| id=30 `TRANSFORMACIÓN DIGITAL` (73) | id=40 `GER TRANSF DIGITAL` (0) — abrev. | 0 |
| id=56 `CV NOTICIAS` (124) | id=61 `OFICINA CV NOTICIAS` (5) | 5 |

### 3.4 Áreas válidas sin activos — conservar activas (3 filas)

| id | name | Razón para conservar |
|----|------|---------------------|
| 38 | COMUNICACION SOCIAL | Área institucional válida |
| 39 | SISTEMAS | Canónica (después de desactivar SISETMAS) |
| 54 | MERCADEO | Área institucional válida |

---

## 4. Causa Raíz

**Archivo:** `Backend/migration/migrate.py`

```python
# Línea 218-231: get_area_id() crea áreas automáticamente
def get_area_id(cur, area_name) -> int | None:
    ...
    # PROBLEMA: si el nombre no existe, lo inserta como área
    cur.execute("INSERT INTO catalog_areas (name) VALUES (%s) RETURNING id", (area_name,))

# Línea 352: se le pasa el nombre del RESPONSABLE como nombre de área
aid = get_area_id(cur, r["responsable_raw"])
```

**Archivo:** `Backend/migration/migrate_2026.py` (líneas 84–89)

```python
# Asigna responsable_raw = area_raw: ambos campos llevan el mismo valor
responsable_raw = area_raw
area_id = area_lookup.get(strip_accents(area_raw))
```

Consecuencia: nombres de personas entraron a `catalog_areas` y `assets.area_id` apunta a ellos; `assets.person_id` quedó siempre en NULL.

---

## 5. Impacto

- Filtros de activos por área muestran nombres de personas.
- Reportes de activos por unidad institucional están contaminados.
- La UI de Personas (pestaña en Catálogos) existe pero está completamente vacía.
- `assets.person_id` es inutilizable: nunca fue poblado.
- Traslados entre activos no pueden distinguir área institucional de responsable humano.
- La anomalía se reproduce en cada nueva importación hasta corregir los importadores.

---

## 6. Política de Corrección

1. **No borrar nunca** — solo `active = false` (desactivación lógica).
2. **Migrar personas** solo cuando hay evidencia fuerte (nombre propio legible).
3. **Consolidar duplicados** hacia la forma canónica con mayor número de activos.
4. **Casos ambiguos** se conservan como área hasta revisión manual.
5. **Importadores** se corrigen antes de considerar el saneamiento cerrado.
6. **Todo cambio en transacción** con verificación de conteos antes del COMMIT.

---

## 7. Resultado Esperado (Criterios de Aceptación)

| Verificación | Condición esperada |
|--|--|
| `catalog_people` con registros activos | 22 |
| `assets` con `person_id IS NOT NULL` | 22 |
| `catalog_areas` activas con nombres de persona | 0 |
| `assets` apuntando a área con `active = false` | 0 |
| Grupos de duplicados de áreas activas | 0 |
| Área `35 MM NUEVO` activa | false |
| TORNO (id=2844) con `area_id IS NULL` | true |

---

## 8. Controles Preventivos Post-Saneamiento

### 8.1 Importadores
- `migrate.py`: `get_area_id()` deja de crear áreas automáticamente. Si el nombre no existe → warning, `area_id = NULL`.
- `migrate.py`: nueva función `get_or_create_person_id()` inserta en `catalog_people`.
- `migrate_2026.py`: `area_raw` → `area_id` (solo lookup); `responsable_raw` → `person_id` (lookup o insert en `catalog_people`).

### 8.2 Índices
```sql
CREATE INDEX CONCURRENTLY idx_assets_person_id
  ON assets (person_id) WHERE person_id IS NOT NULL;
```

### 8.3 Validación backend (recomendada)
Antes de `INSERT INTO catalog_areas`, verificar que el nombre no parezca un nombre propio (regex o lista de stop-words institucionales).

---

## 9. Scripts de Ejecución

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `Backend/migration/staging_catalogos_auditoria.sql` | Solo lectura | Diagnóstico y clasificación |
| `Backend/migration/sanear_catalogos.sql` | Transaccional | Saneamiento completo |

---

## 10. Historial de Decisiones

| Fecha | Decisión | Motivo |
|-------|----------|--------|
| 2026-05-15 | POSGRADO (id=26) se fusiona en POSGRADOS (id=31) | Ambas son la misma unidad académica; POSGRADOS es la forma más usada |
| 2026-05-15 | CV NOTICIAS absorbe OFICINA CV NOTICIAS | Misma dependencia; CV NOTICIAS tiene 25× más activos |
| 2026-05-15 | TORNO (id=2844) queda con `area_id = NULL` | "35 MM NUEVO" era el responsable_raw, no un área válida |
| 2026-05-15 | GER TRANSF DIGITAL desactivado sin reasignación | 0 activos; probablemente abreviatura de TRANSFORMACIÓN DIGITAL |
