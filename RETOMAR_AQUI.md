# SIGAF — Estado de sesión para retomar

> Última actualización: 2026-04-23  
> Proyecto: Sistema Integrado de Gestión de Activos Fijos — Corporación Universitaria Americana, Barranquilla  
> Stack: Node/Express/Drizzle ORM + React/Vite/Tailwind + PostgreSQL 18

---

## 1. Estado general

| Capa | Estado |
|---|---|
| Base de datos PostgreSQL | ✅ Migrada — ~11,504 activos cargados |
| Backend API (`Backend/api`) | ✅ Completo y verificado corriendo |
| Frontend (`Frontend/web`) | ✅ Completo — `tsc` + `vite build` sin errores |
| `node_modules` | ✅ Instalado desde raíz (`npm install`) — npm workspaces hoista todo |

---

## 2. Estructura del monorepo

```
SIGAF/
├── package.json                 ← workspace root. Scripts: dev:api, dev:web, build:api, build:web
├── node_modules/                ← hoisted por npm workspaces (NO mover, es correcto aquí)
├── shared/src/index.ts          ← @sigaf/shared — Zod schemas (assets + auth)
├── Backend/
│   ├── api/                     ← Express + Drizzle. Puerto 3000
│   │   ├── .env                 ← credenciales reales (gitignoreado)
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.ts         ← entry point, CORS, todos los routers montados
│   │       ├── infrastructure/
│   │       │   ├── db/          ← client.ts, schema.ts, assetRepository.ts, catalogRepository.ts
│   │       │   └── auth/        ← googleVerifier.ts
│   │       ├── application/
│   │       │   ├── assets/      ← listAssets, getAsset, createAsset, updateAsset, deleteAsset
│   │       │   ├── catalogs/    ← listBuildings, listAssetTypes, listAreas, listPeople
│   │       │   └── auth/        ← loginWithGoogle.ts
│   │       ├── interfaces/http/
│   │       │   ├── assets.router.ts + assets.controller.ts
│   │       │   ├── catalogs.router.ts + catalogs.controller.ts
│   │       │   ├── auth.router.ts
│   │       │   ├── transfers.router.ts  ← stub 501
│   │       │   ├── history.router.ts    ← stub 501
│   │       │   └── reports.router.ts    ← stub 501
│   │       └── shared/
│   │           ├── errors.ts
│   │           └── middleware/  ← error.ts, authenticate.ts
│   └── migration/               ← scripts Python + SQL (ya ejecutados, NO tocar)
└── Frontend/
    └── web/                     ← @sigaf/web — Vite + React. Puerto 5173
        ├── .env                 ← VITE_API_URL + VITE_GOOGLE_CLIENT_ID (gitignoreado)
        ├── package.json, vite.config.ts, index.html
        ├── tsconfig.json        ← incluye "types": ["vite/client"] (fix aplicado)
        ├── tailwind.config.ts, postcss.config.js
        └── src/
            ├── index.css        ✅ Tailwind directives
            ├── main.tsx         ✅ Entry point — providers anidados
            ├── App.tsx          ✅ Rutas (login / assets / catch-all)
            ├── lib/
            │   ├── api.ts       ✅ Cliente HTTP, tipos, apiAuth/apiAssets/apiCatalogs
            │   ├── queryClient.ts ✅ TanStack Query config
            │   └── utils.ts     ✅ cn()
            ├── context/
            │   └── AuthContext.tsx  ✅ user, isLoading, error, login(), logout()
            ├── components/
            │   ├── ProtectedRoute.tsx ✅ Guarda rutas privadas
            │   └── Layout.tsx        ✅ Navbar sticky + Outlet
            └── pages/
                ├── LoginPage.tsx     ✅ Google OAuth, validación dominio
                └── assets/
                    ├── AssetsPage.tsx    ✅ Orquestador principal
                    ├── AssetsTable.tsx   ✅ Tabla + skeleton + badges + paginación
                    ├── AssetsFilters.tsx ✅ Filtros con catálogos cacheados
                    └── AssetFormModal/   ✅ Patrón orquestador + módulos
                        ├── index.tsx             ← orquestador: shell + cableado
                        ├── useAssetForm.ts       ← hook: fetch, estado, payloads, mutación
                        ├── FieldsIdentificacion.tsx ← nombre, tipo, PUC, marca, modelo, serial, cantidad
                        ├── FieldsUbicacion.tsx      ← edificio, piso, bloque, área, ubicación
                        └── FieldsAsignacion.tsx     ← persona, responsable, estado, año, valor, notas
```

---

## 3. Backend — Endpoints completos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/google` | No | Recibe `{ idToken }`, verifica Google, valida `@americana.edu.co`, devuelve `{ token, user }` |
| GET | `/health` | No | Health check |
| GET | `/assets` | JWT | Lista con filtros: `q, building, type, status, year, page, limit` |
| GET | `/assets/:id` | JWT | Activo por ID |
| POST | `/assets` | JWT | Crear activo (genera plaqueta vía `generate_plate()` en PG) |
| PUT | `/assets/:id` | JWT | Actualizar activo |
| DELETE | `/assets/:id` | JWT | Soft delete → `status = 'DADO_DE_BAJA'` |
| GET | `/catalogs/buildings` | JWT | Edificios activos |
| GET | `/catalogs/asset-types` | JWT | Tipos de activo activos |
| GET | `/catalogs/areas` | JWT | Áreas activas |
| GET | `/catalogs/people` | JWT | Personas activas |
| * | `/transfers/*` | JWT | 501 Not Implemented |
| * | `/history/*` | JWT | 501 Not Implemented |
| * | `/reports/*` | JWT | 501 Not Implemented |

---

## 4. Frontend — Decisiones de implementación clave

### Patrón aplicado: Orquestador + Módulos

- **`AssetsPage`** orquesta: maneja estado de filtros, paginación, modal. Delega renderizado a `AssetsTable`, `AssetsFilters` y `AssetFormModal`.
- **`AssetFormModal/index.tsx`** orquesta el modal: instancia `useAssetForm`, carga los 4 catálogos y los inyecta en los 3 módulos de campos.
- **`useAssetForm.ts`** es lógica pura: fetch del activo en modo editar, estado del form como strings, conversores `toCreatePayload` / `toUpdatePayload`, mutación dual.
- Los módulos `Fields*.tsx` son **dumb components**: solo reciben props y renderizan — cero lógica de negocio.

### Comportamiento del form

- Todos los valores del form se almacenan como `string` internamente (fácil binding a inputs HTML) y se convierten a tipos correctos solo al hacer submit.
- En modo **editar**: `assetTypeCode` y `buildingId` se muestran deshabilitados (el backend no los acepta en `UpdateAsset`).
- `cityCode` está hardcodeado a `'1'` (Barranquilla) — única sede actual.
- `areaId` y `personId` se envían como `null` en update si están vacíos (para poder desasignar).

### Catálogos

- `buildings`, `assetTypes`, `areas`, `people` → `staleTime: Infinity` — se piden una sola vez y viven en caché toda la sesión.
- Los filtros de `AssetsFilters` comparten el mismo query key que el modal → sin doble fetch.

### Filtros y paginación

- Cualquier cambio de filtro resetea `page: 1` automáticamente.
- El input de búsqueda aplica en `Enter` o `blur` (no en cada keystroke) para evitar queries excesivas.
- `placeholderData: (prev) => prev` en `useQuery` de assets → mantiene datos anteriores visibles mientras carga la nueva página (sin parpadeo).

### Auth y sesión

- `ProtectedRoute` retorna `null` mientras `isLoading = true` — previene flash de redirect a `/login` en recargas con sesión activa.
- `localStorage` keys: `sigaf_token` (JWT) y `sigaf_user` (JSON del perfil).
- JWT expira en 8h — al expirar, el backend devuelve 401, `ApiError` se propaga, la UI puede manejarlo en futuras iteraciones.

---

## 5. Variables de entorno

### Backend (`Backend/api/.env`)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sigaf
DB_USER=sigaf_user
DB_PASSWORD=tu_password_aqui
PORT=3000
GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_GOOGLE_CLIENT_SECRET
JWT_SECRET=sigaf_jwt_secret_change_in_production
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

### Frontend (`Frontend/web/.env`)
```
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

---

## 6. Cómo levantar el entorno de desarrollo

```bash
# Desde la raíz SIGAF/ — NO hacer cd a ningún subdirectorio

# Terminal 1 — Backend
npm run dev:api

# Terminal 2 — Frontend
npm run dev:web
```

- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost:5173`
- Login con cuenta `@americana.edu.co`

---

## 7. Decisiones de arquitectura clave

- **generate_plate()**: función atómica en PostgreSQL. Se invoca vía `pool.query('SELECT generate_plate($1,$2,$3)', [...])`. NUNCA reimplementar en Node.
- **Soft delete**: DELETE pone `status = 'DADO_DE_BAJA'`, no elimina el registro.
- **JWT stateless**: el backend verifica el Google ID token, valida dominio `@americana.edu.co`, emite su propio JWT de 8h.
- **shared/**: paquete `@sigaf/shared` con Zod schemas. Consumible por frontend y backend.
- **Drizzle ORM**: `NUMERIC(15,2)` retorna como `string`. Manejado en `toUpdateValues()` con `.toString()`.
- **tsx**: resuelve `"main": "./src/index.ts"` directamente, sin compilar. Workspaces funcionan.
- **npm workspaces**: `node_modules/` está en la raíz por diseño. No mover, no duplicar.
- **tsconfig fix**: `"types": ["vite/client"]` requerido para `import.meta.env` en TypeScript strict.

---

## 8. Lo que falta — próximas fases

1. **Traslados** — módulo completo frontend + backend (router stub ya existe en `/transfers/*`)
2. **Historial por activo** — timeline de eventos de auditoría (stub existe en `/history/*`)
3. **Reportes/exportación** — Excel o PDF para auditoría (stub existe en `/reports/*`)
4. **Manejo de JWT expirado** — interceptor en `api.ts` que detecte 401 y llame `logout()` automáticamente
5. **n8n** — redirigir workflow de Google Sheets a INSERT directo en PostgreSQL

---

## 9. Cómo retomar en una sesión nueva

1. Leer este archivo primero.
2. Escanear el árbol: `find . -not -path "*/node_modules/*" -not -path "*/.git/*" | sort`
3. El frontend está **100% completo** — no crear archivos nuevos en `src/` a menos que sea una fase nueva.
4. Levantar ambos servidores con `npm run dev:api` y `npm run dev:web` desde la raíz.
5. Probar login con cuenta `@americana.edu.co` en `http://localhost:5173`.
6. Continuar desde **sección 8** — elegir la siguiente fase según prioridad.
