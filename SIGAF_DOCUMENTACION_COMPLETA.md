# SIGAF - Sistema Integrado de Gestión de Activos Fijos
## Documentación Completa para Retomar Proyecto

**Fecha:** 22 Abril 2026  
**Responsable:** Leonardo  
**Organización:** Corporación Universitaria Americana - Barranquilla

---

## 1. CONTEXTO DEL PROYECTO

### 1.1 Situación Actual
- **Sistema existente:** Backend Node.js + Frontend React que lee inventario desde Excel local
- **Proceso actual:** Compras envía email → n8n procesa → actualiza Google Sheets → motor sync → Excel local → Frontend
- **Excel maestro:** 6 hojas (Levantamiento Inicial + 2022-2026), ~11,500 activos
- **Problema:** Excel como fuente de verdad, 5 capas entre dato y UI, sin trazabilidad

### 1.2 Objetivo de la Renovación
Eliminar Excel como fuente de verdad, migrar a **PostgreSQL** como único master, mantener Google Sheets solo como canal de entrada vía n8n.

---

## 2. PROCEDIMIENTO INSTITUCIONAL (P AF 011)

### 2.1 Requisitos que el sistema debe cumplir
- **Alta/Incorporación:** registro de activos nuevos con factura, fecha adquisición, cuenta PUC
- **Plaqueteo:** código de 12 dígitos: `[ciudad 1][edificio 2][cuenta PUC 2][consecutivo 7]`
  - Ejemplo: `101700000001` = Barranquilla (1) + Cosmos (01) + Eq.Cómputo (70) + #1
- **Asignación:** Acta de Entrega cuando se asigna activo a funcionario
- **Traslados:** dos tipos — permanente (cambio responsable) o transitorio (mantenimiento)
- **Bajas:** proceso con comité (Vicerrectoría + Financiero + Contabilidad + Control Interno)
- **Actas de salida:** cuando funcionario se desvincula (ya existe en sistema actual)
- **Inventario físico:** verificación periódica con toma física
- **Conciliación:** mensual con Contabilidad, trimestral con Control Interno
- **Flota vehicular:** hoja de vida, inspecciones, mantenimiento (prioridad baja)

### 2.2 Gaps identificados vs sistema actual
✅ **Ya cubierto:**
- Inventario con placa, nombre, tipo, ubicación, responsable
- Acta de salida al desvincular
- Sync desde Google Sheets

🔴 **Falta construir:**
1. Alta formal con factura/fecha/PUC
2. Generación automática de placas según procedimiento
3. Traslados con historial trazable
4. Bajas con flujo de aprobación
5. Acta de asignación inicial
6. Inventario físico periódico
7. Reportes para conciliación
8. Flota vehicular (última prioridad)

---

## 3. ARQUITECTURA ACTUAL (Backend/Frontend existentes)

### 3.1 Backend (Node.js + Express)
**Ubicación:** `backend/`

**Stack:**
- Express
- Better SQLite3 (⚠️ será reemplazado por PostgreSQL)
- ExcelJS (lee Excel local)
- Google Sheets API
- PDFKit (generación PDFs)

**Módulos actuales:**
- `/health` — status del sistema
- `/assets` — inventario (lee Excel)
- `/areas`, `/people`, `/spaces`, `/catalog` — catálogos
- `/salidas` — registros de desvinculación
- `/actas` — actas de entrega (genera PDF)
- `/sync-engine` — sincronización Google Sheets → Excel

**Archivos clave:**
- `src/server.js` — entry point
- `src/adapters/excelRepo.js` — ⚠️ aquí lee Excel, debe migrar a PG
- `src/domain/fingerprint.js` — sistema FNV-1a hash para dedup
- `src/services/syncService.js` — lógica de sincronización
- `src/config/settings.js` — configuración

### 3.2 Frontend (React + TypeScript)
**Ubicación:** `frontend/`

**Páginas:**
- `/dashboard` — KPIs, donut chart estados, panel sync
- `/assets` — tabla inventario con filtros
- `/sync` — motor de sincronización con SSE live
- `/actas` — gestión actas
- `/salidas`, `/people`, `/spaces`, `/catalog`

**Features:**
- Tabla con búsqueda, filtros, ordenamiento
- Modal de edición de activos (campos editables vs no-editables)
- Generación PDF de actas
- Sync con preview SSE antes de ejecutar

---

## 4. FLUJO n8n ACTUAL

**Ubicación:** `Flujo_inventario_de_activos_fijos__4_.json`

**Flujo:**
```
[Gmail Trigger] REPORTE ACTIVOS NUEVOS
    ↓ extrae URL del email
[Google Sheets] lee POLIZA ACTUALIZADA
[Google Sheets] lee INVENTARIO ACTIVOS FIJOS
[Code] normalización POLIZA
[Code] normalización INVENTARIO
[Merge] INVENTARIO vs POLIZA
[Code] transformación por cantidad (expande si qty > 1)
[Google Sheets] append → INVENTARIO (hoja REGISTRO ACTIVOS 2026)
[Gmail] auto-reply confirmando
```

**⚠️ Cambio necesario:** el nodo final debe cambiar de Google Sheets append a PostgreSQL INSERT.

---

## 5. ANÁLISIS DEL EXCEL MAESTRO

### 5.1 Estructura
**Archivo:** `INVENTARIO_MAESTRO_DE_ACTIVOS_FIJOS_OFICIAL.xlsx`

**Hojas:**
- LEVANTAMIENTO INICIAL: 6,647 filas
- REGISTRO ACTIVOS 2022: 545 filas reales + 2,299 vacías (descartar)
- REGISTRO ACTIVOS 2023: 968 filas
- REGISTRO ACTIVOS 2024: 1,317 filas
- REGISTRO ACTIVOS 2025: 1,188 filas
- REGISTRO ACTIVOS 2026: 841 filas

**Total activos reales:** 11,504

**Columnas:**
```
PLACA, NOMBRE ACTIVO, TIPO DE ACTIVO, CUENTA CONTABLE, DESCRIPCIÓN, 
MARCA, MODELO, SERIAL, EDIFICIO, PISO, BLOQUE, UBICACIÓN, CANTIDAD, 
VALOR DE REFERENCIA, RESPONSABLE, PLACA_ORIGINAL, PLACA_ESTADO
```

### 5.2 Calidad de Datos

**✅ LO BUENO:**
- 11,499 placas únicas — **cero duplicados cross-sheet**
- Todas las hojas tienen estructura consistente
- `PLACA_ESTADO` indica trabajo previo de validación

**🔴 PROBLEMAS A LIMPIAR:**

1. **TIPO DE ACTIVO inconsistente** (6 tipos, 11 variantes):
   ```
   "MUEBLES, ENSERES Y EQUIPO DE OFICINA"
   "MUEBLES, ENSERES Y EQUIPOS DE OFICINA"  ← S extra
   "MUEBLES ENSERES Y EQUIPO DE OFICINA"    ← sin coma
   
   "EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN"  ← con tildes
   "EQUIPOS DE COMUNICACION Y COMPUTACION"  ← sin tildes
   
   "MAQUINARIA Y EQUIPO"
   "MAQUINARIA Y EQUIPO "  ← espacio trailing
   ```

2. **EDIFICIO con espacios trailing:**
   ```
   "COSMOS " vs "COSMOS"
   "20 DE JULIO " vs "20 DE JULIO"
   ```

3. **RESPONSABLE mezclado** — nombres de personas + áreas + guiones + typos:
   ```
   "INFRAESTRUTURA" (449 registros) ← sin C
   "SISETMAS" ← typo de SISTEMAS
   "PLACA OK" ← valor inválido
   ```

4. **SERIAL = "NO REGISTRA"** — 6,308 activos (55%) sin serial real

5. **CUENTA CONTABLE inválida:**
   ```
   "" (comillas vacías)
   "NJGF1" (no es código PUC)
   ```

6. **Hoja 2022:** 2,299 filas completamente vacías (basura)

### 5.3 Distribución PLACA_ESTADO
```
OK: 9,906
(vacío): 2,299  ← las filas basura de 2022
GENERADA: 1,287
GRUPO_ERRADO: 208
FORMATO_INVALIDO: 92
REQUIERE_REVISION: 7
DUPLICADA: 6
```

### 5.4 Consecutivos por edificio+cuenta (para plate_sequences)
```
COSMOS / Muebles       → siguiente: 4025
COSMOS / Eq.Cómputo    → siguiente: 2110
COSMOS / Maquinaria    → siguiente: 393
20 DE JULIO / Muebles  → siguiente: 951
PRADO / Muebles        → siguiente: 797
ROMELIO / Muebles      → siguiente: 927
... (23 combinaciones totales)
```

---

## 6. DECISIONES ARQUITECTÓNICAS

### 6.1 Stack Final
- **Backend:** Node.js + Express (mismo código, migrado a PG)
- **Base de datos:** PostgreSQL 18 (reemplaza Excel + SQLite)
- **Frontend:** React + TypeScript (mismo código)
- **Automatización:** n8n (mismo flujo, nodo final cambia)
- **Auth:** Google OAuth (Google Workspace institucional) — pendiente

### 6.2 Alcance v1
- **Una sede:** solo Barranquilla
- **Un equipo:** área de Activos Fijos
- **Sin flujos digitales de aprobación** (bajas/comité sigue manual)
- **Sin firma digital** en actas (por ahora)
- **Sin integración contable** (exportación manual)

### 6.3 Modelo de Datos PostgreSQL

**Tablas principales:**
```sql
assets                  -- inventario principal
asset_history           -- log de cambios (auditoría)
assignments             -- área responsable + funcionario
transfers               -- traslados (permanente/transitorio)
writeoffs               -- bajas
actas                   -- actas de entrega/salida
plate_sequences         -- consecutivos por [edificio+cuenta]
```

**Catálogos:**
```sql
catalog_asset_types     -- tipos de activo (6 canónicos)
catalog_accounts        -- cuentas PUC
catalog_buildings       -- edificios (Cosmos, Prado, etc.)
catalog_areas           -- áreas/dependencias
catalog_people          -- funcionarios
```

### 6.4 Generación Automática de Placas

**Lógica:**
```javascript
// Para Barranquilla
ciudad    = "1"
edificio  = edificio_code (01=Cosmos, 02=Consultorio, etc.)
cuenta    = cuenta_puc_code (65=Muebles, 70=Cómputo, etc.)
consec    = next_sequence(edificio, cuenta)

placa = ciudad + edificio + cuenta + consec.padStart(7, '0')
// → "101700000001"
```

**Tabla `plate_sequences`:**
```sql
CREATE TABLE plate_sequences (
  building_code VARCHAR(2),
  account_code VARCHAR(2),
  last_sequence INTEGER DEFAULT 0,
  PRIMARY KEY (building_code, account_code)
);
```

---

## 7. PLAN DE MIGRACIÓN

### 7.1 Orden de construcción
```
① Migración Excel → PostgreSQL
   - Limpiar datos
   - Poblar catálogos
   - Insertar activos
   - Inicializar plate_sequences

② Backend sobre PG
   - Adaptar excelRepo → pgRepo
   - Mantener mismos endpoints
   - Agregar generación de placas

③ n8n actualizado
   - Cambiar nodo final: Sheets → Postgres INSERT
   - Usar generación automática de placa

④ Frontend (sin cambios iniciales)
   - Sigue funcionando igual
   - Lee desde el mismo API
```

### 7.2 Script de Limpieza (reglas)
```
① Descartar 2,299 filas vacías de 2022
② Unificar TIPO DE ACTIVO → 6 valores canónicos
③ Trim espacios en EDIFICIO
④ SERIAL: "NO REGISTRA" → NULL
⑤ CUENTA CONTABLE: limpiar "", NJGF1
⑥ RESPONSABLE: separar área vs funcionario
⑦ VALOR DE REFERENCIA: convertir a numérico
⑧ Asignar año_incorporacion según hoja origen
⑨ Poblar plate_sequences con máximos actuales
```

---

## 8. ESTADO ACTUAL Y PRÓXIMOS PASOS

### 8.1 Lo que ya está hecho
✅ Sistema backend/frontend funcionando (sobre Excel)  
✅ n8n procesando póliza → Google Sheets  
✅ Motor sync con SSE  
✅ Generación PDF actas  
✅ Análisis completo del Excel  
✅ PostgreSQL 18.1 instalado y corriendo  
✅ Base de datos `sigaf` creada  
✅ Usuario `sigaf_user` configurado  

### 8.2 Próximos pasos INMEDIATOS

**PASO 1: Crear estructura de carpetas**
```
proyecto/
├── backend/
├── frontend/
└── migration/         ← NUEVA
    ├── schema.sql
    ├── seed_catalogs.sql
    ├── migrate.py
    ├── requirements.txt
    └── README.md
```

**PASO 2: Archivos a crear (en orden)**
1. `migration/requirements.txt` — dependencias Python
2. `migration/schema.sql` — estructura completa BD
3. `migration/seed_catalogs.sql` — datos catálogos
4. `migration/migrate.py` — script migración
5. `migration/README.md` — instrucciones

**PASO 3: Ejecutar migración**
```bash
cd migration
pip install -r requirements.txt
python migrate.py
```

**PASO 4: Validar datos en PostgreSQL**
```sql
SELECT COUNT(*) FROM assets;
SELECT * FROM plate_sequences;
SELECT * FROM catalog_asset_types;
```

**PASO 5: Adaptar backend**
- Crear `src/adapters/pgRepo.js`
- Reemplazar llamadas excelRepo → pgRepo
- Agregar lógica generación placas

**PASO 6: Actualizar n8n**
- Cambiar nodo Google Sheets append → Postgres node
- Configurar INSERT con generación de placa

---

## 9. INFORMACIÓN TÉCNICA CLAVE

### 9.1 PostgreSQL
```
Host: localhost
Puerto: 5432
Base de datos: sigaf
Usuario: sigaf_user
Contraseña: sigaf_pass_2026
```

### 9.2 Ubicación del Excel
**Preguntar en nuevo chat:** ruta completa del archivo  
`INVENTARIO_MAESTRO_DE_ACTIVOS_FIJOS_OFICIAL.xlsx`

### 9.3 Estructura del backend actual
```
backend/
├── src/
│   ├── adapters/
│   │   ├── actaRepo.js
│   │   ├── excelRepo.js      ← MIGRAR A pgRepo
│   │   ├── salidasRepo.js
│   │   └── sheetsRepo.js
│   ├── domain/
│   │   ├── fingerprint.js     ← mantener lógica hash
│   │   └── normalize.js
│   ├── services/
│   │   ├── syncService.js
│   │   └── actaService.js
│   └── config/
│       └── settings.js        ← agregar PG config
├── data/
│   └── inventario_activos.xlsx  ← YA NO SE USA
└── package.json
```

### 9.4 Mapeo de catálogos

**Edificios Barranquilla:**
```
01 = COSMOS
02 = CONSULTORIO JURÍDICO
03 = 20 DE JULIO
04 = PRADO
05 = ROMELIO
06 = CALLE 79
```

**Cuentas PUC (código de 2 dígitos):**
```
45 = PLANTAS, DUCTOS Y TÚNELES
55 = MAQUINARIA Y EQUIPO
60 = EQUIPO MÉDICO Y CIENTÍFICO
65 = MUEBLES, ENSERES Y EQUIPO DE OFICINA
70 = EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN
75 = EQUIPOS DE TRANSPORTE
```

**Tipos de activo canónicos:**
```
MUEBLES, ENSERES Y EQUIPO DE OFICINA
EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN
MAQUINARIA Y EQUIPO
EQUIPO MÉDICO Y CIENTÍFICO
EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN
PLANTAS, DUCTOS Y TÚNELES
```

---

## 10. PREGUNTAS PARA NUEVO CHAT

Al retomar en un chat nuevo, confirmar:

1. ✅ PostgreSQL sigue corriendo
2. ✅ Base de datos `sigaf` existe
3. 📁 Ruta completa del Excel maestro
4. 📁 Ruta completa del proyecto (backend/frontend)
5. 🔧 ¿Prefieres trabajar en VS Code o Claude Code?

---

## 11. COMANDOS ÚTILES

### PostgreSQL
```bash
# Conectar a la base de datos
psql -U sigaf_user -d sigaf

# Ver tablas
\dt

# Salir
\q
```

### Verificar servicio PostgreSQL (Windows)
```powershell
Get-Service -Name postgresql*
```

### Migración
```bash
# Ejecutar schema
psql -U sigaf_user -d sigaf -f migration/schema.sql

# Ejecutar seed
psql -U sigaf_user -d sigaf -f migration/seed_catalogs.sql

# Ejecutar migración Python
python migration/migrate.py
```

---

**FIN DE DOCUMENTACIÓN**

**Para retomar:** comparte este archivo en el nuevo chat junto con:
- Confirmación de que PostgreSQL sigue corriendo
- Ruta del Excel
- Ruta del proyecto
- Preferencia de entorno (VS Code / Claude Code)
