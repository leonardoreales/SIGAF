# SIGAF — Sistema Integrado de Gestión de Activos Fijos

> **Última actualización:** 2026-04-29 (sesión 9)  
> **Responsable:** Leonardo Reales — `leonardoreales@americana.edu.co`  
> **Organización:** Corporación Universitaria Americana — Barranquilla  
> **Stack:** Node/Express/Drizzle ORM + React/Vite/Tailwind + PostgreSQL 18  
> ⚠️ Este archivo ES la memoria viva del proyecto. Actualizar al cerrar cada sesión.

---

## 1. Qué es SIGAF

Reemplaza un flujo de 5 capas (Gmail → n8n → Google Sheets → motor sync → Excel local → frontend) donde Excel era la fuente de verdad, por **PostgreSQL como único master**.

**~11,497 activos** del inventario de la Corporación Universitaria Americana, Barranquilla.  
Acceso restringido a cuentas `@americana.edu.co` vía Google OAuth.

---

## 2. Procedimiento Institucional P AF 011 v3.0

| Proceso | Estado |
|---|---|
| Inventario con placa, nombre, tipo, ubicación, responsable | ✅ Implementado |
| Generación automática de placas (12 dígitos) | ✅ Implementado (`generate_plate()` en PG) |
| Criticidad del activo (ALTO / MEDIO / BAJO) | ✅ Implementado (sesión 7) |
| Área responsable de mantenimiento por activo | ✅ Implementado (sesión 7) |
| Alta formal con factura, fecha adquisición, cuenta PUC | 🔴 Pendiente |
| Traslados con historial trazable (permanente / transitorio) | 🔴 Pendiente |
| Bajas con flujo de aprobación (comité) | 🔴 Pendiente |
| Acta de asignación inicial al funcionario | 🔴 Pendiente |
| Inventario físico periódico | 🔴 Pendiente |
| Reportes para conciliación mensual/trimestral | 🔴 Pendiente |
| Acta de salida al desvincular funcionario | 🔴 Pendiente |
| Módulo de seguimiento y control de mantenimientos | 🔴 Pendiente (Fase 2+) |
| Flota vehicular | ⏸ Última prioridad |

---

## 3. Estado General del Sistema

| Capa | Estado | Notas |
|---|---|---|
| PostgreSQL 18 | ✅ Corriendo | ~10,665 activos (datos limpios hasta 2025 — 2026 purgado) |
| Backend API (`Backend/api`) | ✅ Completo | Puerto 3000 |
| Frontend (`Frontend/web`) | ✅ Funcional | Puerto 5173 |
| UI Redesign dark/light theme | ✅ Completo | Dual-theme en todos los componentes |
| Sidebar colapsable | ✅ Completo | 4 secciones, estados live/soon/planned |
| Catálogo edificios | ✅ Limpio | Solo 6 edificios Barranquilla |
| `node_modules` | ✅ Instalado | Hoisted a raíz — NO mover |
| Supabase Realtime (sync_log) | ✅ Completo | tabla sync_log + publicación + cliente frontend |
| n8n → sync_log INSERT | ✅ Configurado | Nodo PostgreSQL al final del flujo (pendiente test E2E) |
| Búsqueda multi-campo (backend) | ✅ Completo | OR en 8 campos + ranking relevancia — sesión 8 |
| Búsqueda en tiempo real (frontend) | 🔴 **Pendiente** | AssetsFilters debounce + UX — SE DEBE RETOMAR |

---

## 4. Arquitectura del Monorepo

```
SIGAF/
├── package.json                    ← workspace root. Scripts: dev:api, dev:web, build:api, build:web
├── node_modules/                   ← hoisted por npm workspaces (NO mover)
├── README.md                       ← ESTE ARCHIVO — memoria maestra del proyecto
├── shared/src/index.ts             ← @sigaf/shared — Zod schemas (assets + auth + mantenimiento)
├── Backend/
│   ├── migration/
│   │   ├── schema.sql                    ← DDL completo de la BD
│   │   ├── seed_catalogs.sql             ← 6 edificios + 6 tipos activo + 1 ciudad
│   │   ├── add_maintenance_fields.sql    ← ADD COLUMN maintenance_area + criticality ✅ aplicado
│   │   ├── migrate.py                    ← script migración Excel → PostgreSQL (ya ejecutado)
│   │   └── requirements.txt              ← dependencias Python para migrate.py
│   └── api/                        ← Express + Drizzle ORM. Puerto 3000
│       ├── .env                    ← credenciales reales (gitignoreado)
│       ├── .env.example
│       └── src/
│           ├── index.ts            ← entry point, CORS, routers
│           ├── infrastructure/
│           │   ├── db/
│           │   │   ├── client.ts
│           │   │   ├── schema.ts           ← tablas Drizzle (+ maintenanceArea, criticality)
│           │   │   ├── assetRepository.ts  ← BASE_FIELDS + create + toUpdateValues actualizados
│           │   │   └── catalogRepository.ts ← findBuildings() filtra por cityCode='1'
│           │   └── auth/
│           │       └── googleVerifier.ts
│           ├── application/
│           │   ├── assets/         ← listAssets, getAsset, createAsset, updateAsset, deleteAsset
│           │   ├── catalogs/       ← listBuildings, listAssetTypes, listAreas, listPeople
│           │   └── auth/           ← loginWithGoogle.ts (valida @americana.edu.co)
│           ├── interfaces/http/
│           │   ├── assets.router.ts + assets.controller.ts
│           │   ├── catalogs.router.ts + catalogs.controller.ts
│           │   ├── auth.router.ts
│           │   ├── transfers.router.ts  ← stub 501
│           │   ├── history.router.ts    ← stub 501
│           │   └── reports.router.ts    ← stub 501
│           └── shared/
│               ├── errors.ts
│               └── middleware/     ← error.ts, authenticate.ts
└── Frontend/
    └── web/                        ← @sigaf/web — Vite + React. Puerto 5173
        ├── .env                    ← VITE_API_URL + VITE_GOOGLE_CLIENT_ID (gitignoreado)
        ├── public/
        │   └── escudo.webp         ← logo escudo institucional (con filtro gold en dark)
        ├── tailwind.config.ts      ← paletas mi-* + gold-* + fuentes Syne/JetBrains
        └── src/
            ├── index.css           ← Tailwind directives + grid bg + scrollbar + .escudo-img + @keyframes fadeRow
            ├── main.tsx            ← entry point — ThemeProvider > GoogleOAuthProvider > QueryClient > Router > Auth
            ├── App.tsx             ← 8 rutas: /assets (live) + 7 ComingSoonPage
            ├── lib/
            │   ├── api.ts          ← cliente HTTP, tipos Asset/Building/SyncEvent/etc
            │   ├── supabase.ts     ← cliente Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
            │   ├── queryClient.ts
            │   └── utils.ts        ← cn()
            ├── hooks/
            │   └── useSyncEvents.ts ← Supabase Realtime → postgres_changes INSERT en sync_log
            ├── context/
            │   ├── AuthContext.tsx
            │   └── ThemeContext.tsx ← isDark + toggle(), persiste en localStorage('sigaf_theme')
            ├── components/
            │   ├── ProtectedRoute.tsx
            │   ├── Layout.tsx       ← flex h-screen, Sidebar + header con escudo + título dinámico
            │   ├── Sidebar.tsx      ← dual-theme, 4 secciones colapsables, live/soon/planned
            │   └── SyncBanner.tsx   ← banner amber cuando llega SyncEvent de Supabase Realtime
            └── pages/
                ├── LoginPage.tsx
                ├── ComingSoonPage.tsx
                ├── dashboard/
                │   ├── DashboardPage.tsx
                │   ├── KpiCard.tsx
                │   ├── DistributionChart.tsx
                │   └── ActivityFeed.tsx
                └── assets/
                    ├── AssetsPage.tsx
                    ├── AssetsTable.tsx
                    ├── AssetsFilters.tsx
                    ├── ExportModal.tsx        ← Excel via SheetJS, 100% cliente
                    └── AssetFormModal/
                        ├── index.tsx
                        ├── useAssetForm.ts    ← + maintenanceArea, criticality
                        ├── FieldsIdentificacion.tsx
                        ├── FieldsUbicacion.tsx   ← area_id = área de asignación del activo
                        └── FieldsAsignacion.tsx  ← + select maintenance_area + select criticality
```

---

## 5. Base de Datos PostgreSQL

### Conexión
```
Host: localhost   Puerto: 5432   DB: sigaf   User: sigaf_user
Password: ver Backend/api/.env
```

### Tablas principales
```sql
assets              -- inventario principal (~11,497 filas)
asset_history       -- log de cambios para auditoría
assignments         -- área responsable + funcionario
transfers           -- traslados permanentes/transitorios
writeoffs           -- bajas
actas               -- actas de entrega/salida
plate_sequences     -- consecutivos por [ciudad+edificio+tipo] — CRÍTICO, no tocar

-- Módulo de Seguimiento y Control (Fase 2 — pendiente de implementar)
-- maintenance_schedules   -- cronogramas anuales por área técnica
-- maintenance_activities  -- ejecución vs. programado por actividad
-- maintenance_documents   -- soportes adjuntos por actividad
-- alerts                  -- alertas automáticas de vencimiento y falla
```

### Catálogos
```sql
catalog_cities      -- solo '1' = BARRANQUILLA (v1 monociudad)
catalog_buildings   -- 6 edificios Barranquilla (IDs 1-6, city_code='1')
catalog_asset_types -- 6 tipos canónicos
catalog_areas       -- 45 áreas/dependencias
catalog_people      -- funcionarios (vacío hasta módulo de asignaciones)
```

### Catálogo de Edificios — Estado limpio (2026-04-24)

| ID | Código | Nombre | Activos |
|---|---|---|---|
| 1 | 01 | COSMOS | 6,369 |
| 2 | 02 | CONSULTORIO JURÍDICO | 803 |
| 3 | 03 | 20 DE JULIO | 1,407 |
| 4 | 04 | PRADO | 1,171 |
| 5 | 05 | ROMELIO | 1,207 |
| 6 | 06 | CALLE 79 | 540 |

> ⚠️ El 24/04/2026 se eliminaron 8 edificios fantasma de Medellín (IDs 7-12) y Montería (IDs 13-14) que habían sido creados en el seed original. Tenían 0 activos. Las ciudades 2 y 3 también fueron eliminadas de `catalog_cities`.

### Cuentas PUC (código 2 dígitos — posiciones 3-4 de la placa)
| Código | Descripción |
|---|---|
| 45 | PLANTAS, DUCTOS Y TÚNELES |
| 55 | MAQUINARIA Y EQUIPO |
| 60 | EQUIPO MÉDICO Y CIENTÍFICO |
| 65 | MUEBLES, ENSERES Y EQUIPO DE OFICINA |
| 70 | EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN |
| 75 | EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN |

### Función crítica: `generate_plate()`
Función **atómica** en PostgreSQL que genera placa de 12 dígitos:
```
ciudad(1) + edificio(2) + cuenta_PUC(2) + consecutivo(7)
Ejemplo: 101700000001 = Barranquilla(1) + Cosmos(01) + Eq.Cómputo(70) + #1
```
**NUNCA reimplementar en Node. Invocar siempre via:**
```typescript
await pool.query('SELECT generate_plate($1, $2, $3)', [cityCode, buildingCode, assetTypeCode])
```

### Plate sequences (estado actual — auditado y corregido 2026-04-26)
```
01/45 → 1    |  01/55 → 464  |  01/60 → 65   |  01/65 → 4396  |  01/70 → 2137  |  01/75 → 15
02/55 → 24   |  02/65 → 671  |  02/70 → 109
03/55 → 44   |  03/60 → 22   |  03/65 → 950  |  03/70 → 397   ← corregido (era 311)
04/55 → 44   |  04/60 → 1    ← nuevo          |  04/65 → 848   |  04/70 → 364
05/55 → 89   |  05/65 → 926  |  05/70 → 232
06/55 → 13   |  06/65 → 486  |  06/70 → 45
```
> ⚠️ El 26/04/2026 se corrigieron 2 discrepancias críticas en `plate_sequences` que habrían causado colisión de placas al correr `generate_plate()` desde n8n.

### Reglas de integridad
- **Soft delete:** `DELETE` → pone `status = 'DADO_DE_BAJA'`, registro permanece
- **buildingId en assets:** FK a `catalog_buildings.id` — siempre city_code='1'
- **assetTypeCode y buildingId:** no se aceptan en `PUT /assets/:id` (la placa ya fue generada)
- **cityCode hardcodeado** a `'1'` en frontend — única sede actual

### Columnas nuevas en `assets` (sesión 7 — 2026-04-29)

| Columna | Tipo | Valores permitidos | Default | Propósito |
|---|---|---|---|---|
| `maintenance_area` | `VARCHAR(20)` | `INFRAESTRUCTURA` · `SISTEMAS` · `TRANSPORTE` · `ACTIVOS_FIJOS` | NULL | Equipo técnico que **mantiene** el activo. Distinto de `area_id` (área donde está asignado). |
| `criticality` | `VARCHAR(10)` | `ALTO` · `MEDIO` · `BAJO` | `'BAJO'` | Impacto operativo si el activo falla. Usado para priorizar alertas y mantenimientos. |

> **Distinción clave:** `area_id` → *¿a qué dependencia universitaria pertenece el activo?* (del acta de entrega, cuantifica inventario por área). `maintenance_area` → *¿quién lo mantiene técnicamente?* (Infraestructura, Sistemas o Transporte).

### Estados de activo
`ACTIVO` · `BAJA` · `EN_TRASLADO` · `EN_MANTENIMIENTO` · `DADO_DE_BAJA`

---

## 6. Backend API — Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/google` | No | Recibe `{ idToken }`, verifica Google, valida `@americana.edu.co`, devuelve `{ token, user }` |
| GET | `/health` | No | Health check |
| GET | `/assets` | JWT | Lista con filtros: `q, building, type, status, year, page, limit` |
| GET | `/assets/:id` | JWT | Activo por ID con joins completos |
| POST | `/assets` | JWT | Crear activo — invoca `generate_plate()` en PG |
| PUT | `/assets/:id` | JWT | Actualizar — `assetTypeCode` y `buildingId` bloqueados |
| DELETE | `/assets/:id` | JWT | Soft delete → `status = 'DADO_DE_BAJA'` |
| GET | `/catalogs/buildings` | JWT | Edificios activos de city_code='1' |
| GET | `/catalogs/asset-types` | JWT | Tipos de activo activos |
| GET | `/catalogs/areas` | JWT | Áreas activas |
| GET | `/catalogs/people` | JWT | Personas activas |
| * | `/transfers/*` | JWT | 501 Not Implemented (stub) |
| * | `/history/*` | JWT | 501 Not Implemented (stub) |
| * | `/reports/*` | JWT | 501 Not Implemented (stub) |

---

## 7. Frontend — Arquitectura y Patrones

### Rutas

| Ruta | Componente | Estado sidebar |
|---|---|---|
| /assets | AssetsPage | live (punto pulsante) |
| /transfers | ComingSoonPage | soon (badge "pronto") |
| /history | ComingSoonPage | soon |
| /writeoffs | ComingSoonPage | planned (candado) |
| /assignments | ComingSoonPage | planned |
| /actas | ComingSoonPage | planned |
| /reports | ComingSoonPage | soon |
| /dashboard | ComingSoonPage | planned |

**Rutas del módulo Mantenimiento (Fase 2 — pendiente de implementar):**

| Ruta | Módulo | Descripción |
|---|---|---|
| /mantenimiento/cronogramas | Cronogramas | Carga de actividades programadas por área |
| /mantenimiento/seguimiento | Matriz de seguimiento | Ejecutado vs. programado |
| /mantenimiento/alertas | Alertas | Alertas abiertas y cerradas |
| /mantenimiento/soportes | Soportes | Validación documental (adjuntos) |
| /mantenimiento/kpis | Indicadores KPI | Tableros de cumplimiento |
| /mantenimiento/informes | Informes mensuales | Generación automática PDF |

### Sistema de temas (dark/light)
- `darkMode: 'class'` en Tailwind — clase `dark` en `<html>` activa todos los `dark:` variants
- `ThemeContext` en `context/ThemeContext.tsx`: `isDark` + `toggle()`, persiste en `localStorage('sigaf_theme')`
- Default: dark mode si no hay preferencia guardada
- `<ThemeProvider>` es el wrapper más externo en `main.tsx`
- Todos los componentes usan patrón dual: `bg-white dark:bg-mi-800`, `text-gray-900 dark:text-mi-100`, etc.

### Sidebar colapsable
- `localStorage('sigaf_sidebar')` persiste expandido/colapsado
- Ancho: `w-[60px]` colapsado / `w-[220px]` expandido — `transition-[width] duration-300`
- Totalmente dual-theme: `bg-white dark:bg-[#06010F]`, `border-gray-200 dark:border-white/[0.06]`
- 4 secciones colapsables individualmente (Inventario, Operaciones, Gestión, Análisis)
- Estados de ítems:
  - `live`: verde pulsante (emerald cuando inactivo, gold cuando activo)
  - `soon`: badge "pronto" mono, navegable a ComingSoonPage
  - `planned`: Lock icon, opacity 30%, no navegable
- Active state: `useMatch(to)` + `Link` (NO NavLink) — `border-l gold` + glow en icono
- User card footer: avatar con iniciales, theme toggle (Sun/Moon), logout

### Paleta de diseño

| Token | Valor | Uso |
|---|---|---|
| `mi-950` | `#050015` | Fondo más profundo |
| `mi-900` | `#0B022C` | Fondo body dark |
| `mi-850` | `#0D0432` | Footer modal, encabezados tabla dark |
| `mi-800` | `#100538` | Cards, modales |
| `mi-750` | `#14073F` | Inputs dark |
| `mi-700` | `#1A0D4A` | Hover filas, bordes |
| `mi-600` | `#231558` | Bordes, separadores |
| `mi-500` | `#2E1E6E` | Texto deshabilitado |
| `mi-400` | `#4A3A8C` | Scrollbar thumb, avatar gradient end |
| `mi-300` | `#6E60B8` | Texto secundario |
| `mi-100` | `#CCC8EF` | Texto principal dark |
| `mi-50` | `#EEECFA` | Texto blanco suave dark |
| `gold` | `#F5C842` | Accent — activo nav, plaquetas, submit dark |
| Fuente UI | Syne | `font-syne` — títulos, labels |
| Fuente mono | JetBrains Mono | `font-mono` — plaquetas, PUC |

### Logo escudo
- Archivo: `Frontend/web/public/escudo.webp`
- CSS en `index.css`: `.escudo-img` aplica filtro básico; `html.dark .escudo-img` añade gold glow
- Aparece en: sidebar header + header principal de Layout

### Patrón de componentes
- **`AssetsPage`**: orquesta estado de filtros, paginación, modales
- **`AssetFormModal/index.tsx`**: carga 4 catálogos, inyecta en los 3 módulos de campos
- **`useAssetForm.ts`**: lógica pura — fetch en editar, estado como strings, conversores payload, mutación dual
- **`Fields*.tsx`**: dumb components — solo props + render, cero lógica

### Comportamiento del formulario
- Todos los valores se almacenan como `string` (binding directo) y se convierten solo en submit
- En modo **editar**: `assetTypeCode` y `buildingId` se muestran deshabilitados
- `areaId` y `personId` envían `null` en update si vacíos (para desasignar)
- `incorporationYear` vacío (`""`) → `null` → muestra "Inicial" en la UI
- `maintenanceArea` vacío (`""`) → `undefined` en create, `null` en update (para limpiar)
- `criticality` siempre tiene valor — default `'BAJO'` en EMPTY y en create payload

### Tipos compartidos (`shared/src/index.ts`)

| Schema/Tipo | Valores |
|---|---|
| `AssetStatusSchema` | `ACTIVO` · `BAJA` · `EN_TRASLADO` · `EN_MANTENIMIENTO` · `DADO_DE_BAJA` |
| `PlateStatusSchema` | `OK` · `GENERADA` · `DUPLICADA` · `GRUPO_ERRADO` · `FORMATO_INVALIDO` · `REQUIERE_REVISION` |
| `AssetTypeCodeSchema` | `45` · `55` · `60` · `65` · `70` · `75` |
| `MaintenanceAreaSchema` | `INFRAESTRUCTURA` · `SISTEMAS` · `TRANSPORTE` · `ACTIVOS_FIJOS` |
| `CriticalitySchema` | `ALTO` · `MEDIO` · `BAJO` |

### Catálogos
- `buildings`, `assetTypes`, `areas`, `people` → `staleTime: Infinity` — una carga por sesión
- Mismos query keys entre `AssetsFilters` y `AssetFormModal` → sin doble fetch

### ExportModal
- Excel via SheetJS, 100% cliente, sin backend
- `apiAssets.list({ limit: 9999 })` con filtros opcionales
- 18 columnas, nombre de archivo: `activos[_año]_YYYY-MM-DD.xlsx`

### Animación tabla
- `@keyframes fadeRow` + `.row-fade` en `index.css` — fade + translateY
- Delays escalonados via `nth-child` (0ms–180ms en pasos de 20ms)

### Auth y sesión
- `ProtectedRoute` retorna `null` mientras `isLoading = true` — evita flash de redirect
- `localStorage` keys: `sigaf_token` (JWT 8h) + `sigaf_user` (perfil JSON)
- JWT expirado: backend devuelve 401 — interceptor automático pendiente (fase futura)

---

## 8. Flujo n8n (Estado Actual)

```
[Gmail Trigger] REPORTE ACTIVOS NUEVOS (póliza actualizada de oscarcespedes@americana.edu.co)
    ↓
[HTML Extract] extrae URL de Google Sheets del email
[Google Sheets] lee póliza — sheet dinámico (mes actual)
[Code] normalización POLIZA
[Merge] INVENTARIO vs POLIZA
[Code] transformación por cantidad (expande si qty > 1)
[PostgreSQL] INSERT directo → tabla assets   ✅ NUEVO (flujo_inventario_postgresql_1.json)
[Gmail] auto-reply confirmando
```

**Archivo:** `C:\Users\Leonardo Reales\Downloads\flujo_inventario_postgresql_1.json`  
**Pendiente:** importar en n8n, configurar credencial PostgreSQL, prueba end-to-end con email real.

---

## 9. Datos del Excel Maestro

**Archivo:** `C:\Users\Leonardo Reales\Desktop\proyecto_activos\INVENTARIO MAESTRO DE ACTIVOS FIJOS OFICIAL.xlsx`

### Distribución real por edificio (fuente de verdad para el catálogo)

| Edificio | Levant. | 2022 | 2023 | 2024 | 2025 | 2026 | Total |
|---|---|---|---|---|---|---|---|
| COSMOS | 3,310 | 444 | 628 | 574 | 808 | 607 | **6,371** |
| 20 DE JULIO | 1,071 | 49 | 162 | 74 | 1 | 50 | **1,407** |
| ROMELIO | 1,051 | 20 | 68 | — | 18 | 50 | **1,207** |
| PRADO | 17 | — | — | 665 | 355 | 134 | **1,171** |
| CONSULTORIO JURÍDICO | 714 | 30 | 55 | 4 | — | — | **803** |
| CALLE 79 | 484 | 1 | 55 | — | — | — | **540** |
| **TOTAL** | **6,647** | **544** | **968** | **1,317** | **1,182** | **841** | **11,499** |

### Notas de calidad de datos
- 55% de activos no tienen serial real (valor "NO REGISTRA" → migrado como NULL)
- Tipos de activo tenían 11 variantes de los 6 canónicos (trailing spaces, tildes inconsistentes) — normalizados en migrate.py
- RESPONSABLE mezclado entre nombres de personas y áreas — migrado como `responsable_raw`
- PLACA_ESTADO en Excel: OK=9,906 | GENERADA=1,287 | GRUPO_ERRADO=208 | FORMATO_INVALIDO=92

---

## 10. Decisiones Arquitectónicas Clave

| Decisión | Razón |
|---|---|
| `generate_plate()` en PostgreSQL | Atómica — race conditions imposibles con `SELECT ... FOR UPDATE` |
| Soft delete (`DADO_DE_BAJA`) | Trazabilidad — nunca perder historial de activos |
| JWT stateless 8h | Sin sesiones en servidor — más simple para v1 |
| `staleTime: Infinity` en catálogos | Catálogos cambian raramente; una carga por sesión es suficiente |
| Drizzle ORM | `NUMERIC(15,2)` retorna como `string` de PG — manejado con `.toString()` |
| `tsx` para backend dev | Resuelve TypeScript sin compilar — workspaces funcionan directamente |
| npm workspaces | `node_modules/` hoisted a raíz — no duplicar ni mover |
| `cityCode` hardcodeado `'1'` | Única sede actual (Barranquilla). Generalizar en v2 si hay multisede |
| `findBuildings()` filtra `city_code='1'` | Defensa contra datos multi-ciudad en DB — aunque DB ya está limpia |
| Validación `@americana.edu.co` | En `loginWithGoogle.ts` — rechaza cualquier otro dominio |
| `useMatch(to)` + `Link` en sidebar | `NavLink` automáticamente añade clase `active` que interfiere con clases custom |
| Sidebar dual-theme | `bg-white dark:bg-[#06010F]` — responde al toggle igual que el resto del layout |

---

## 11. Variables de Entorno

### Backend (`Backend/api/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sigaf
DB_USER=sigaf_user
DB_PASSWORD=<ver archivo .env>
PORT=3000
GOOGLE_CLIENT_ID=<ver archivo .env>
GOOGLE_CLIENT_SECRET=<ver archivo .env>
JWT_SECRET=sigaf_jwt_secret_change_in_production
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

### Frontend (`Frontend/web/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=<ver archivo .env>
```

---

## 12. Cómo Levantar el Entorno

```bash
# Desde la raíz SIGAF/ — NO hacer cd a subdirectorios

# Terminal 1 — Backend
npm run dev:api          # Puerto 3000

# Terminal 2 — Frontend
npm run dev:web          # Puerto 5173

# Verificar Backend
# GET http://localhost:3000/health

# Verificar PostgreSQL (PowerShell)
Get-Service -Name postgresql*

# Conectar a la BD
# PGPASSWORD=<password> psql -U sigaf_user -d sigaf
```

---

## 13. Bitácora de Sesiones

### Sesión 1 — 2026-04-22 (Análisis y Migración)
- Análisis completo del Excel maestro (11,504 activos, 6 hojas, calidad de datos)
- Diseño del esquema PostgreSQL con `generate_plate()` atómica
- Creación de `Backend/migration/schema.sql` + `seed_catalogs.sql` + `migrate.py`
- Ejecución de la migración Excel → PostgreSQL (~11,497 activos importados)
- Inicialización de `plate_sequences` con los consecutivos reales del Excel

### Sesión 2 — 2026-04-23 (Backend + Frontend base)
- Backend Express + Drizzle ORM completo: CRUD `/assets`, catálogos, Google OAuth
- Frontend React + Vite: AssetsPage con tabla, filtros, paginación
- AssetFormModal con los 3 grupos de campos (Identificación, Ubicación, Asignación)
- ExportModal con SheetJS (18 columnas, 100% cliente)
- Autenticación Google OAuth restringida a `@americana.edu.co`

### Sesión 3 — 2026-04-23 (UI Redesign Dark Theme — 17/17 completados)
- Paleta `mi-*` (midnight indigo) + `gold` (#F5C842) en `tailwind.config.ts`
- `ThemeContext` con toggle dark/light persistido en localStorage
- `Sidebar.tsx` creado: colapsable, 4 secciones, estados live/soon/planned, user card footer
- Nuevas rutas: `/writeoffs`, `/assignments`, `/actas`, `/dashboard` → `ComingSoonPage`
- `Layout.tsx` rediseñado: escudo + título dinámico en header, logout en sidebar
- Dual-theme en todos los componentes (`bg-white dark:bg-mi-800`, etc.)
- `index.css`: grid pattern dark, scrollbar custom, `.escudo-img`, `@keyframes fadeRow`
- Build limpio: `tsc -b && vite build` sin errores (0 errores TypeScript)

### Sesión 7 — 2026-04-29 (Fase 1 Módulo Seguimiento y Control)

**Análisis del documento institucional:** `DATOS PARA CREACIÓN DE HERRAMIENTA DE SEGUIMIENTO Y CONTROL DE ACTIVOS.docx` — informe técnico ISO 55001 con 9 módulos requeridos, 10 KPIs, 8 tipos de alerta y flujo operativo mensual.

**Cambios implementados (Fase 1 — base maestra):**
- Nueva migración `add_maintenance_fields.sql` aplicada en Supabase — 2 columnas nuevas en `assets`:
  - `maintenance_area VARCHAR(20)` — equipo técnico mantenedor (INFRAESTRUCTURA / SISTEMAS / TRANSPORTE / ACTIVOS_FIJOS)
  - `criticality VARCHAR(10) DEFAULT 'BAJO'` — impacto operativo (ALTO / MEDIO / BAJO)
- `shared/src/index.ts`: `MaintenanceAreaSchema` + `CriticalitySchema` + tipos exportados
- `schema.ts`, `assetRepository.ts`: campos en Drizzle + BASE_FIELDS + create + toUpdateValues
- `useAssetForm.ts`: campos en interfaz, EMPTY, hidratación y ambos payloads
- `lib/api.ts`: campos en interfaz `Asset`
- `FieldsAsignacion.tsx`: dos selects nuevos con helper text y badge de color por criticidad

**Decisión de diseño clave documentada:**
- `area_id` (ya existía) = dependencia que recibe el activo por acta de entrega → cuantifica inventario por área
- `maintenance_area` (nuevo) = equipo técnico que ejecuta el mantenimiento → alimentará cronogramas Fase 2

**Fase 2+ (módulo completo) queda pendiente para próxima sesión.**

---

### Sesión 6 — 2026-04-26 (Auditoría plate_sequences + correcciones Supabase)

**Alcance confirmado:** SIGAF opera exclusivamente en **Barranquilla** (city_code='1'). Medellín y Montería fuera de scope.

**Auditoría completa de `plate_sequences` vs `assets` (Supabase):**
- Script `audit_placas.py` ejecutado contra Supabase — 22 grupos en `plate_sequences`, 23 grupos con activos reales
- Se detectaron **2 discrepancias críticas** que habrían causado colisión de placas:
  1. **Grupo 10370** (20 de Julio / Equipo Comunicación): tabla decía 311, realidad era 397 → **UPDATE last_sequence = 397**
  2. **Grupo 10460** (Prado / Equipo Médico): fila inexistente, pero existía 1 activo real → **INSERT last_sequence = 1**
- Ambas correcciones aplicadas directamente en Supabase y verificadas
- `plate_sequences` ahora 100% sincronizada — `generate_plate()` listo para n8n sin riesgo de colisión

**Búsqueda de activo:**
- Sennheiser E945 confirmado en DB: 2 unidades (placas `101700002131` y `101700002132`, Cosmos / Producción Audiovisual)

**Pendiente de esta sesión → próxima sesión:**
- Entregable 2: workflow n8n — modificar nodos (Filter PLACA_SIGAF vacío + Google Sheets Update Row)
- Entregable 3: Code node JS para agrupar placas generadas por fila póliza

---

### Sesión 5 — 2026-04-24 (n8n → PostgreSQL)

**Análisis del flujo n8n existente:**
- Se analizó `Flujo inventario de activos fijos (5).json` (flujo activo en producción)
- Flujo: Gmail Trigger (póliza actualizada) → extrae URL → lee Google Sheets mes dinámico → normaliza → merge → expande por cantidad → **append Google Sheets** (NODO A REEMPLAZAR) → Gmail reply
- Se generó versión actualizada con nodo PostgreSQL INSERT directo

**Nuevo flujo generado:**
- Archivo: `C:\Users\Leonardo Reales\Downloads\flujo_inventario_postgresql_1.json`
- Nodo Google Sheets append reemplazado por nodo `PostgreSQL` con INSERT parametrizado
- Pendiente: importar en n8n, configurar credencial PostgreSQL, probar en staging

---

### Sesión 4 — 2026-04-24 (Fix tema sidebar + Limpieza catálogo edificios)

**Fix sidebar dual-theme:**
- El sidebar era "always dark" (`bg-[#06010F]` sin prefijos `dark:`)
- Reescrito con clases duales: `bg-white dark:bg-[#06010F]`
- Todos los textos, bordes, hover states, user card — clases duales completas
- Ítem activo en light mode: `text-mi-700` (indigo); en dark mode: `text-gold`

**Limpieza catálogo de edificios (error crítico):**
- La DB tenía 14 edificios: 6 reales + 8 fantasma de Medellín y Montería
- Causa: seed original tenía multi-ciudad; `findBuildings()` no filtraba por city_code
- El dropdown mostraba "INVESTIGACIÓN OLIVOS", "BANCOLOMBIA", "CLUB MEDELLÍN", etc.
- Acciones:
  - `DELETE FROM catalog_buildings WHERE city_code IN ('2', '3')` — eliminados IDs 7-14 (0 activos)
  - `DELETE FROM catalog_cities WHERE code IN ('2', '3')` — solo queda BARRANQUILLA
  - `catalogRepository.ts`: `findBuildings()` ahora filtra `AND city_code = '1'`
  - `seed_catalogs.sql`: agregado CALLE 79 (faltaba), `ON CONFLICT` removido

---

## 14. Próximas Fases (por prioridad)

### Módulo de Seguimiento y Control de Activos (ISO 55001)
Documento de referencia: `DATOS PARA CREACIÓN DE HERRAMIENTA DE SEGUIMIENTO Y CONTROL DE ACTIVOS.docx`

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Campos `maintenance_area` + `criticality` en `assets` | ✅ Completo (sesión 7) |
| Fase 2 | Tablas de mantenimiento: `maintenance_schedules`, `maintenance_activities`, `maintenance_documents` | 🔴 Pendiente |
| Fase 3 | Motor de alertas automáticas (cron diario en Supabase Edge Functions) | 🔴 Pendiente |
| Fase 4 | KPIs de mantenimiento + nuevos tableros en Dashboard | 🔴 Pendiente |
| Fase 5 | Generador de informe mensual PDF | 🔴 Pendiente |
| Fase 6 | Upload de soportes a Supabase Storage + validación documental | 🔴 Pendiente |

### Otras tareas pendientes
1. **Interceptor JWT expirado** — detectar 401 en `api.ts` y llamar `logout()` automáticamente
2. **Traslados** — módulo completo frontend + backend (stub `/transfers/*` ya existe)
3. **Historial por activo** — timeline de auditoría (stub `/history/*` ya existe)
4. **n8n → PostgreSQL** — pendiente: Entregable 2 (nodos n8n Filter + Sheets Update) y Entregable 3 (Code node JS agrupar placas)
5. **Módulo de bajas** — flujo soft delete con motivo + aprobación
6. **Módulo de asignaciones** — catálogo de personas + actas de entrega

### Mejoras UI pendientes
- Stat cards KPI en `AssetsPage` (Total, Activos, En traslado, Bajas)
- Plaqueta como badge visual (`bg-gold/10 border border-gold/20 rounded px-2`)
- Botón Editar como outline button en vez de texto link

---

## 15. Comandos de Referencia Rápida

```bash
# Build completo
npm run build:api
npm run build:web

# Verificar BD edificios
# PGPASSWORD=<pw> psql -U sigaf_user -d sigaf -c "SELECT id, code, name FROM catalog_buildings ORDER BY id;"

# Ver plate_sequences
# PGPASSWORD=<pw> psql -U sigaf_user -d sigaf -c "SELECT building_code, asset_type_code, last_sequence FROM plate_sequences ORDER BY building_code, asset_type_code;"

# Contar activos por estado
# PGPASSWORD=<pw> psql -U sigaf_user -d sigaf -c "SELECT status, COUNT(*) FROM assets GROUP BY status ORDER BY status;"

# PostgreSQL (verificar servicio en Windows)
Get-Service -Name postgresql*
```

---

*Actualizar la Sección 13 (Bitácora) al finalizar cada sesión de trabajo.*
