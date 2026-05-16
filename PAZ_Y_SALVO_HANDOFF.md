# Paz y Salvo — Handoff de sesión (2026-05-15)

Documento para retomar el módulo **Actas de Devolución / Paz y Salvo** en la próxima sesión sin perder contexto.

> Plan original aprobado: `C:\Users\Leonardo Reales\.claude\plans\robust-snacking-lecun.md`
> Memoria viva: `project_paz_y_salvo.md` (auto-cargada por Claude Code)

---

## TL;DR

Backend está al **70%**. El próximo paso es **exponer las rutas HTTP** (Fase 3.5) y el **callback n8n** (Fase 3.6). Luego frontend (Fase 4) y workflow n8n (Fase 5).

- `npm run build:api` ✅ PASA limpio al 2026-05-15 22:30
- DB de producción ya tiene tablas + 157 funcionarios importados
- Falta: controller + router + registrar en `index.ts` + handler en `sync.controller.ts`

---

## Estado actual por fases

| Fase | Descripción | Estado |
|---|---|---|
| 1 | DB migration (`paz_y_salvo_cases`, `paz_y_salvo_items`, cols en `catalog_people`) | ✅ Aplicado en Supabase |
| 2 | `import_funcionarios.py` (157 personas + 23 áreas) | ✅ Committed en producción |
| 3.1 | Shared Zod schemas en `shared/src/index.ts` | ✅ |
| 3.2 | Drizzle schema (`Backend/api/src/infrastructure/db/schema.ts`) | ✅ |
| 3.3 | Repository (`pazYSalvoRepository.ts`, 290+ LOC) | ✅ |
| 3.4 | 8 use cases en `application/pazYSalvo/` | ✅ |
| **3.5** | **Controller + Router + registro en `index.ts`** | ⏳ **SIGUIENTE** |
| 3.6 | Handler en `sync.controller.ts` + ruta callback n8n | ⏳ |
| 4 | Frontend (PazYSalvoPage + Modal + Drawer + apiPazYSalvo + SSE) | ⏳ |
| 5 | n8n workflow (Google Doc + firma + PDF + callback) | ⏳ |

---

## ✅ Archivos ya creados (no tocar salvo bug)

```
shared/src/index.ts                                                  (+ ~120 LOC paz y salvo)
Backend/migration/migrate_paz_y_salvo.sql                            (✅ ejecutado)
Backend/migration/import_funcionarios.py                             (✅ committed 157 personas)
Backend/api/src/infrastructure/db/schema.ts                          (+ catalogPeople cols, pazYSalvoCases, pazYSalvoItems)
Backend/api/src/infrastructure/db/pazYSalvoRepository.ts             (NEW, 290+ LOC)
Backend/api/src/application/pazYSalvo/createPazYSalvo.ts             (NEW, single-step + n8n dispatch)
Backend/api/src/application/pazYSalvo/getPazYSalvo.ts                (NEW)
Backend/api/src/application/pazYSalvo/listPazYSalvo.ts               (NEW)
Backend/api/src/application/pazYSalvo/listPazYSalvoPeople.ts         (NEW)
Backend/api/src/application/pazYSalvo/updatePazYSalvo.ts             (NEW)
Backend/api/src/application/pazYSalvo/getPazYSalvoStats.ts           (NEW)
Backend/api/src/application/pazYSalvo/completePazYSalvoSignature.ts  (NEW, idempotente eventId)
Backend/api/src/application/pazYSalvo/cancelPazYSalvo.ts             (NEW)
```

---

## ⏳ Próximo paso — Fase 3.5

### Acción 1 — Crear `Backend/api/src/interfaces/http/pazYSalvo.controller.ts`

Plantilla: copiar estructura de [Backend/api/src/interfaces/http/writeoffs.controller.ts](Backend/api/src/interfaces/http/writeoffs.controller.ts).

Imports requeridos:
```ts
import type { Request, Response, NextFunction } from 'express'
import { listPazYSalvo }               from '../../application/pazYSalvo/listPazYSalvo'
import { listPazYSalvoPeople }         from '../../application/pazYSalvo/listPazYSalvoPeople'
import { getPazYSalvo }                from '../../application/pazYSalvo/getPazYSalvo'
import { getPazYSalvoStats }           from '../../application/pazYSalvo/getPazYSalvoStats'
import { createPazYSalvo }             from '../../application/pazYSalvo/createPazYSalvo'
import { updatePazYSalvo }             from '../../application/pazYSalvo/updatePazYSalvo'
import { cancelPazYSalvo }             from '../../application/pazYSalvo/cancelPazYSalvo'
```

Handlers: `list`, `listPeople`, `getOne`, `stats`, `create`, `update`, `cancel`.

Nota: `createPazYSalvo(body, createdBy)` requiere `req.user.id` (createdBy). Mirar `writeoffs.controller.ts:create` si pasa `req.user` también — pasar `(req.body, (req as any).user?.id)`.

### Acción 2 — Crear `Backend/api/src/interfaces/http/pazYSalvo.router.ts`

```ts
import { Router } from 'express'
import * as controller from './pazYSalvo.controller'

const router = Router()

router.get('/stats',   controller.stats)
router.get('/people',  controller.listPeople)   // entry view frontend
router.get('/',        controller.list)
router.get('/:id',     controller.getOne)
router.post('/',       controller.create)        // single-step + dispara n8n
router.put('/:id',     controller.update)
router.post('/:id/cancel', controller.cancel)

export default router
```

### Acción 3 — Registrar en `Backend/api/src/index.ts`

```ts
import pazYSalvoRouter from './interfaces/http/pazYSalvo.router'
// …
app.use('/paz-y-salvo', authenticate, pazYSalvoRouter)
```

Considerar `authorize(['ADMIN','ACTIVOS_FIJOS'])` en `POST`/`PUT`/`cancel` siguiendo patrón writeoffs.

---

## ⏳ Fase 3.6 — Callback n8n

En [Backend/api/src/interfaces/http/sync.controller.ts](Backend/api/src/interfaces/http/sync.controller.ts) agregar handler (plantilla = `transferRequestSignResult`, líneas 54-66):

```ts
import { completePazYSalvoSignature } from '../../application/pazYSalvo/completePazYSalvoSignature'

export async function pazYSalvoFirmaCompletada(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.N8N_SIGN_RESULT_SECRET || process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'N8N_SIGN_RESULT_SECRET no configurado', 'CONFIG_ERROR'))

    if (req.headers['x-sigaf-sign-result-secret'] !== secret) {
      return next(new AppError(401, 'Secreto de resultado de firma inválido', 'UNAUTHORIZED'))
    }

    const result = await completePazYSalvoSignature(req.body)
    res.json(result)
  } catch (err) { next(err) }
}
```

Y en `sync.router.ts`:
```ts
router.post('/paz-y-salvo/firma-completada', controller.pazYSalvoFirmaCompletada)
```

---

## Validación final Fase 3

```bash
npm run build:api
```

Debe pasar 0 errores. Luego commit:
```
git add -A
git commit -m "feat: expose paz y salvo HTTP routes + n8n callback"
```

---

## Endpoints definitivos

```
GET  /paz-y-salvo/people            (auth)         → entry view funcionarios + estado
GET  /paz-y-salvo/stats             (auth)         → contadores
GET  /paz-y-salvo                   (auth)         → lista cases paginada
GET  /paz-y-salvo/:id               (auth)         → case + items + persona
POST /paz-y-salvo                   (auth ADMIN|AF) → single-step create + dispatch n8n
PUT  /paz-y-salvo/:id               (auth ADMIN|AF) → update con transición validada
POST /paz-y-salvo/:id/cancel        (auth ADMIN|AF) → cancela caso abierto
POST /sync/paz-y-salvo/firma-completada (no JWT)   → callback n8n con secret
```

---

## Variables de entorno requeridas

Ya configuradas (reusar de transfer requests):
- `JWT_SECRET`, `SYNC_SECRET`, `N8N_SIGN_RESULT_SECRET`, `N8N_SIGN_HMAC_SECRET`

Nuevas (opcional, fallback a `N8N_SIGN_WEBHOOK`):
- `N8N_PAZ_Y_SALVO_WEBHOOK` — URL del workflow Paz y Salvo en n8n

---

## Para Fase 4 (frontend) y Fase 5 (n8n) — ver memoria

`project_paz_y_salvo.md` contiene placeholders Google Doc, decisiones de diseño, esquemas SSE y notas para el modal.
