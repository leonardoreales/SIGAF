# Flujo F-AF-039 — Configuración y Refinamiento

**Workflow:** `AVe15lGWfVkt8cwt` — SIGAF – Ingesta de Solicitudes F-AF-039  
**Instancia n8n:** `https://n8n.americana.edu.co`  
**Estado actual:** ✅ Desplegado · ⚠️ Pendiente variables de entorno  
**Última actualización:** 2026-05-08

---

## Tabla de contenido

1. [Arquitectura del flujo](#1-arquitectura-del-flujo)
2. [Configuración pendiente](#2-configuración-pendiente)
3. [Referencia del payload GAS → n8n](#3-referencia-del-payload-gas--n8n)
4. [Nodos — detalle técnico](#4-nodos--detalle-técnico)
5. [Checklist de activación end-to-end](#5-checklist-de-activación-end-to-end)
6. [Guía de pruebas](#6-guía-de-pruebas)
7. [Troubleshooting](#7-troubleshooting)
8. [Sprint 3 — RequestDetailModal (próximo)](#8-sprint-3--requestdetailmodal-próximo)
9. [Sprint 4 — Seguridad](#9-sprint-4--seguridad)

---

## 1. Arquitectura del flujo

```
GAS (Gmail Scanner)
    │
    │  POST https://n8n.americana.edu.co/webhook/traslados-sigaf
    │  Headers: X-SIGAF-SYNC-SECRET, X-SIGAF-SCHEMA-VERSION, X-SIGAF-SOURCE
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Webhook  (295a767d)                                            │
│  mode: onReceived  →  responde 200 inmediatamente               │
│  el flujo continúa de forma asíncrona                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Validar Secreto SIGAF  (sigaf-v2-001)  [Code]                  │
│  Lee header x-sigaf-sync-secret                                 │
│  Compara con $env.SIGAF_SYNC_SECRET                             │
│  → lanza error si no coincide                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Normalizar payload GAS  (sigaf-v2-002)  [Code]                 │
│  Extrae driveFileId de attachments (isMainAttachment=true)      │
│  isCandidate = !!driveFileId && classification.score >= 100     │
│  Normaliza from.email / from.name                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ¿Es candidato válido?  (sigaf-v2-003)  [IF]                    │
│  Condition: $json.isCandidate === true                          │
└──────────────┬──────────────────────────┬───────────────────────┘
               │ TRUE                     │ FALSE
               ▼                          ▼
┌──────────────────────────┐  ┌───────────────────────────────────┐
│  Exportar Google Doc     │  │  Descartar – No candidato         │
│  como TXT                │  │  (sigaf-v2-004)  [Code]           │
│  (sigaf-v2-005)          │  │  Retorna { discarded: true,       │
│  [HTTP GET]              │  │    reason, correlationId }        │
│  /drive/v3/files/{id}    │  └───────────────────────────────────┘
│  /export?mimeType=       │
│    text/plain            │
│  Cred: Actas_AF          │
└──────────────┬───────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parsear F-AF-039 y construir payload SIGAF  (sigaf-v2-006)     │
│  [Code]                                                         │
│  ctx = $('Normalizar payload GAS').item.json  ← preserva        │
│  rawText = $json.data  ← texto plano del Google Doc             │
│  Extrae: solicitante, dependencia, fecha, motivo, items[]       │
│  Construye sigafPayload con trazabilidad formData completa      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST → SIGAF /sync/transfer-request  (sigaf-v2-007)            │
│  [HTTP Request]                                                 │
│  URL: $env.SIGAF_API_URL/sync/transfer-request                  │
│  Header: X-Sync-Secret: $env.SIGAF_SYNC_SECRET                  │
│  Body: JSON del sigafPayload                                     │
│  neverError: true  (errores 4xx/5xx no detienen el flujo)       │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
              Backend SIGAF crea el registro
              sseManager.broadcast('transfer_request:created')
                         │
                         ▼
              Frontend TransfersPage.tsx
              EventSource → queryClient.invalidateQueries
              → tabla actualizada en tiempo real
```

---

## 2. Configuración pendiente

### 2.1 Variables de entorno en n8n

Ir a **n8n → Settings → Environment Variables** y agregar:

| Variable | Valor | Dónde obtenerlo |
|---|---|---|
| `SIGAF_API_URL` | `https://reappoint-grass-tinkling.ngrok-free.dev` | ngrok tunnel activo en tu PC |
| `SIGAF_SYNC_SECRET` | Mismo valor que `SYNC_SECRET` en `Backend/api/.env` | Ver valor actual abajo |

**Valor actual de `SYNC_SECRET`** (copiarlo tal cual en n8n):
```
29034375360e45b156b74843132bac344a2d55bf62cd58a3c38cb7b0cec7a3ca
```

> **Nota de seguridad (Sprint 4):** Este secreto debe rotarse antes de producción. Ver [sección 9](#9-sprint-4--seguridad).

### 2.2 Credencial OAuth2 — `Actas_AF`

El nodo **Exportar Google Doc como TXT** usa la credencial `Actas_AF` (`w8uwjeJ8xlkaenZc`).

**Verificar en n8n → Credentials → Actas_AF:**

1. Abrir la credencial
2. Si muestra "Token expired" o botón de reautorización → reconectar con la cuenta de Google que tiene acceso a los archivos DOCX en Drive
3. Confirmar que la cuenta tiene permiso de lectura sobre la carpeta Drive donde GAS sube los archivos
4. Guardar y cerrar

### 2.3 Variables de entorno en GAS

En Google Apps Script → Proyecto "Traslados SIGAF" → **Project Settings → Script Properties:**

| Propiedad | Valor |
|---|---|
| `N8N_WEBHOOK_SECRET` | Mismo valor que `SIGAF_SYNC_SECRET` configurado en n8n |

> Si `N8N_WEBHOOK_SECRET` está vacío, la validación del nodo `Validar Secreto SIGAF` fallará con `Invalid secret`.

---

## 3. Referencia del payload GAS → n8n

El webhook recibe este JSON del Google Apps Script:

```json
{
  "source": "apps_script_gmail_collector",
  "correlationId": "F-AF-039-20260508-abc123",
  "idSolicitud": "F-AF-039-20260508-abc123",
  "from": {
    "name": "Nombre del solicitante",
    "email": "solicitante@americana.edu.co"
  },
  "subject": "Traslado F-AF-039 - Equipos oficina 204",
  "body": {
    "summary": "...",
    "driveFileId": "",
    "driveUrl": ""
  },
  "classification": {
    "type": "F_AF_039",
    "score": 150,
    "matched": ["F-AF-039", "traslado", "activos"]
  },
  "drive": {
    "folderId": "1BxK...",
    "folderUrl": "https://drive.google.com/drive/folders/1BxK..."
  },
  "attachments": [
    {
      "filename": "F-AF-039 Traslado.docx",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "isMainAttachment": true,
      "driveFileId": "1AbCdEfGhIjK...",
      "driveUrl": "https://docs.google.com/document/d/1AbCdEfGhIjK.../edit",
      "extension": "docx"
    }
  ],
  "sheet": {
    "spreadsheetId": "1XyZ...",
    "sheetName": "SOLICITUDES_F_AF_039",
    "rowNumber": 5
  }
}
```

**Campos críticos para el flujo:**

| Campo | Nodo que lo usa | Notas |
|---|---|---|
| `attachments[0].driveFileId` | Exportar Google Doc | **NO** usar `body.driveFileId` — siempre vacío |
| `attachments[0].driveUrl` | Diagnóstico | Confirma que GAS subió el DOCX como Google Doc |
| `classification.score` | Normalizar payload GAS | `>= 100` → candidato válido |
| `correlationId` | Parsear F-AF-039 | Trazabilidad end-to-end |
| `from.email` | Parsear F-AF-039 | `senderEmail` en el registro SIGAF |
| `sheet.rowNumber` | Futuro Sprint 1b | Para actualizar el Sheets con el resultado |

---

## 4. Nodos — detalle técnico

### Nodo 1 — Webhook (`295a767d`)

```
Tipo:    n8n-nodes-base.webhook  v2
Método:  POST
Path:    traslados-sigaf
Mode:    onReceived  (responde inmediatamente, flujo async)
```

**URL de producción:** `https://n8n.americana.edu.co/webhook/traslados-sigaf`

---

### Nodo 2 — Validar Secreto SIGAF (`sigaf-v2-001`)

```javascript
// Code node
const secret = $env.SIGAF_SYNC_SECRET
const received = $input.item.json.headers['x-sigaf-sync-secret'] ?? ''
if (!secret || secret !== received) {
  throw new Error(`Invalid secret. Expected env.SIGAF_SYNC_SECRET. Got: ${received.substring(0,8)}...`)
}
return [$input.item]
```

---

### Nodo 3 — Normalizar payload GAS (`sigaf-v2-002`)

```javascript
// Code node
const body = $input.item.json.body
const mainAtt = body.attachments?.find(a => a.isMainAttachment) ?? null
const driveFileId = mainAtt?.driveFileId ?? ''
const score = body.classification?.score ?? 0
return [{
  json: {
    correlationId: body.correlationId,
    idSolicitud:   body.idSolicitud,
    fromEmail:     body.from?.email ?? body.from ?? '',
    fromName:      body.from?.name  ?? '',
    subject:       body.subject,
    driveFileId,
    driveUrl:      mainAtt?.driveUrl ?? '',
    sheetInfo:     body.sheet ?? null,
    score,
    isCandidate:   !!(driveFileId && score >= 100),
  }
}]
```

---

### Nodo 4 — ¿Es candidato válido? (`sigaf-v2-003`)

```
Tipo:    n8n-nodes-base.if  v2
Condición: {{ $json.isCandidate }} === true  (boolean)
```

---

### Nodo 5 — Descartar – No candidato (`sigaf-v2-004`)

```javascript
// Code node — rama FALSE del IF
return [{
  json: {
    discarded:     true,
    reason:        'No attachment or classification score < 100',
    correlationId: $json.correlationId,
    score:         $json.score,
  }
}]
```

---

### Nodo 6 — Exportar Google Doc como TXT (`sigaf-v2-005`)

```
Tipo:       n8n-nodes-base.httpRequest  v4
Método:     GET
URL:        https://www.googleapis.com/drive/v3/files/{{ $json.driveFileId }}/export
Query:      mimeType = text/plain
Auth:       OAuth2 → credencial "Actas_AF" (w8uwjeJ8xlkaenZc)
Response:   text (no JSON)
```

**Por qué funciona sin conversión DOCX → Google Doc:**  
GAS sube el archivo usando la API de Drive con `convert: true`, por lo que ya se almacena como Google Doc nativo. La URL `driveUrl` contiene `docs.google.com/document/d/` como confirmación. El endpoint `/export?mimeType=text/plain` extrae el texto directamente.

---

### Nodo 7 — Parsear F-AF-039 y construir payload SIGAF (`sigaf-v2-006`)

```javascript
// Code node — accede a contexto anterior via referencia directa al nodo
const ctx     = $('Normalizar payload GAS').item.json   // ← evita Merge node
const rawText = $json.data                               // texto plano del Doc

// Regex parsers para el formulario F-AF-039
const get = (label, text) => {
  const m = text.match(new RegExp(label + '[:\\s]+([^\\n]+)', 'i'))
  return m ? m[1].trim() : ''
}

const lines  = rawText.split('\n').map(l => l.trim()).filter(Boolean)
const items  = []
let inTable  = false
for (const line of lines) {
  // detectar inicio de tabla de activos (ajustar regex según formato real del DOCX)
  if (/^(placa|plate|código|code)/i.test(line)) { inTable = true; continue }
  if (inTable && /^\w+-\d+/.test(line)) {
    const [placa, ...rest] = line.split(/\s{2,}|\t/)
    items.push({ placa: placa.trim(), descripcion: rest.join(' ').trim() })
  }
}

const sigafPayload = {
  requestNumber:  ctx.correlationId,
  senderEmail:    ctx.fromEmail,
  subject:        ctx.subject,
  rawText,
  docxDriveUrl:   ctx.driveUrl,
  formData: {
    solicitante: get('solicitante', rawText) || ctx.fromName,
    dependencia: get('dependencia|área|unidad', rawText),
    fecha:       get('fecha', rawText),
    motivo:      get('motivo|justificación|razón', rawText),
  },
  items,
}

return [{ json: { sigafPayload, correlationId: ctx.correlationId } }]
```

> **Ajuste necesario:** Los regex de parseo deben calibrarse con muestras reales del DOCX F-AF-039. Ver [sección 6 — Pruebas](#6-guía-de-pruebas) para el procedimiento de calibración.

---

### Nodo 8 — POST → SIGAF /sync/transfer-request (`sigaf-v2-007`)

```
Tipo:         n8n-nodes-base.httpRequest  v4
Método:       POST
URL:          {{ $env.SIGAF_API_URL }}/sync/transfer-request
Headers:
  Content-Type:   application/json
  X-Sync-Secret:  {{ $env.SIGAF_SYNC_SECRET }}
Body:         JSON.stringify($json.sigafPayload)
neverError:   true  ← errores HTTP no detienen el flujo
```

**Endpoint backend:** [Backend/api/src/interfaces/http/](../../Backend/api/src/interfaces/http/) → `POST /sync/transfer-request`  
**Secreto:** Mismo `SYNC_SECRET` de `Backend/api/.env`

---

## 5. Checklist de activación end-to-end

### Fase 1 — Configuración n8n

- [ ] **Ir a n8n → Settings → Environment Variables**
  - [ ] Agregar `SIGAF_API_URL` = URL base del backend
  - [ ] Agregar `SIGAF_SYNC_SECRET` = `29034375360e45b156b74843132bac344a2d55bf62cd58a3c38cb7b0cec7a3ca`
- [ ] **Verificar credencial `Actas_AF`**
  - [ ] Abrir n8n → Credentials → buscar "Actas_AF"
  - [ ] Reconectar OAuth2 si el token expiró
  - [ ] Confirmar que la cuenta Google tiene acceso a los archivos en Drive
- [ ] **Confirmar workflow activo**
  - [ ] Ir a `https://n8n.americana.edu.co/workflow/AVe15lGWfVkt8cwt`
  - [ ] Toggle "Active" debe estar en ON

### Fase 2 — Configuración GAS

- [ ] **Ir a Google Apps Script → Proyecto "Traslados SIGAF"**
  - [ ] Project Settings → Script Properties
  - [ ] Agregar/verificar `N8N_WEBHOOK_SECRET` con el mismo valor que `SIGAF_SYNC_SECRET`
- [ ] **Confirmar trigger activo**
  - [ ] En GAS → Triggers: `scanGmailRequests` debe ejecutarse cada 10 minutos

### Fase 3 — Prueba de humo

- [ ] Ejecutar `scanGmailRequests()` manualmente en GAS (Run → Run function)
- [ ] Verificar en Google Sheets (columna `N8N_WEBHOOK_STATUS`) → debe mostrar `SUCCESS`
- [ ] Verificar en n8n → Executions del workflow → debe aparecer ejecución reciente
- [ ] Verificar en SIGAF frontend → módulo Traslados → nueva solicitud debe aparecer

---

## 6. Guía de pruebas

### 6.1 Prueba de secreto

Desde terminal local, simular una request inválida:

```bash
curl -X POST https://n8n.americana.edu.co/webhook/traslados-sigaf \
  -H "Content-Type: application/json" \
  -H "X-SIGAF-SYNC-SECRET: secreto-incorrecto" \
  -d '{"source":"test"}'
```

**Resultado esperado:** n8n responde `{"message":"Workflow was started"}` (modo `onReceived`) pero la ejecución interna falla en nodo 2 con "Invalid secret".

### 6.2 Prueba de candidato descartado

```bash
curl -X POST https://n8n.americana.edu.co/webhook/traslados-sigaf \
  -H "Content-Type: application/json" \
  -H "X-SIGAF-SYNC-SECRET: 29034375360e45b156b74843132bac344a2d55bf62cd58a3c38cb7b0cec7a3ca" \
  -d '{
    "source": "test",
    "correlationId": "TEST-001",
    "classification": { "score": 50, "type": "OTRO" },
    "attachments": [],
    "from": { "email": "test@test.com", "name": "Test" },
    "subject": "Correo sin adjunto F-AF-039"
  }'
```

**Resultado esperado:** Ejecución termina en nodo 5 (Descartar), sin POST al backend.

### 6.3 Calibración del parser F-AF-039

Para calibrar los regex del nodo 7:

1. Tomar un archivo DOCX F-AF-039 real
2. Subirlo manualmente a Google Drive con la cuenta `Actas_AF`
3. Usar el endpoint de exportación directamente:
   ```
   GET https://www.googleapis.com/drive/v3/files/{FILE_ID}/export?mimeType=text/plain
   ```
4. Analizar el texto plano resultante
5. Ajustar los regex en el nodo `Parsear F-AF-039 y construir payload SIGAF`

**Campos a validar en el texto plano:**
- Nombre del solicitante
- Dependencia / área de origen
- Fecha de solicitud
- Motivo / justificación
- Tabla de activos (placa, descripción, cantidad)

### 6.4 Verificación end-to-end completa

1. Enviar correo a Gmail con DOCX F-AF-039 adjunto
2. Esperar hasta 10 minutos (trigger GAS) o ejecutar `scanGmailRequests()` manualmente
3. Verificar Sheets → columna `N8N_RESPONSE` debe mostrar `Workflow was started`
4. Verificar n8n → Executions → última ejecución debe ser `Success`
5. Verificar SIGAF backend → `GET /transfers/requests` → debe incluir la nueva solicitud
6. Verificar frontend → módulo Traslados → fila nueva sin refrescar (SSE en tiempo real)

---

## 7. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| GAS muestra `N8N_WEBHOOK_STATUS: ERROR` | Secret vacío en GAS Script Properties | Agregar `N8N_WEBHOOK_SECRET` en GAS |
| Ejecución falla en nodo 2 con "Invalid secret" | `SIGAF_SYNC_SECRET` no configurado en n8n | Agregar variable en n8n Settings → Variables |
| Ejecución falla en nodo 6 con 401 | Credencial `Actas_AF` expirada | Reconectar OAuth2 en n8n Credentials |
| Ejecución falla en nodo 6 con 404 | `driveFileId` vacío o archivo no encontrado | Verificar que GAS suba el archivo antes de enviar el webhook |
| Ejecución falla en nodo 8 con 401 | `SIGAF_SYNC_SECRET` no coincide con `SYNC_SECRET` | Verificar que ambos valores sean idénticos |
| Ejecución falla en nodo 8 con 400/422 | Zod validation falla en backend | Revisar `sigafPayload` en nodo 7 vs `CreateTransferRequestSchema` |
| Frontend no actualiza en tiempo real | SSE no conectado o EventSource cerrado | Verificar `GET /sync/events` responde 200; revisar consola del navegador |
| Items[] vacío en la solicitud creada | Regex de tabla no coincide con formato DOCX | Ejecutar prueba 6.3 para calibrar parser |

---

## 8. Sprint 3 — RequestDetailModal (próximo)

### Objetivo

Crear el modal de detalle y firma de solicitudes de traslado en el frontend SIGAF.

### Archivos a modificar / crear

| Archivo | Cambio |
|---|---|
| `Frontend/web/src/pages/transfers/RequestDetailModal.tsx` | **Crear nuevo** |
| `Frontend/web/src/pages/transfers/TransfersPage.tsx` | Conectar `handleViewRequest` stub (línea ~149) |

### Especificación del modal

```tsx
// Estado en TransfersPage.tsx
const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
const handleViewRequest = (id: number) => setSelectedRequestId(id)

// Modal a crear
<RequestDetailModal
  requestId={selectedRequestId}
  onClose={() => setSelectedRequestId(null)}
  onSigned={() => {
    queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
    setSelectedRequestId(null)
    toast.success('Solicitud firmada correctamente')
  }}
/>
```

### Contenido del modal

```
┌─────────────────────────────────────────────────────┐
│  Solicitud #F-AF-039-20260508-abc123                │
│  📅 2026-05-08  ·  ✉️ solicitante@americana.edu.co  │
├─────────────────────────────────────────────────────┤
│  Información del formulario                          │
│  Solicitante:  [nombre]                             │
│  Dependencia:  [área]                               │
│  Motivo:       [texto]                              │
├─────────────────────────────────────────────────────┤
│  Activos solicitados                                 │
│  ┌────────────┬──────────────────────────────┐      │
│  │ Placa      │ Descripción                  │      │
│  ├────────────┼──────────────────────────────┤      │
│  │ M-70-0001  │ Computador portátil HP       │      │
│  └────────────┴──────────────────────────────┘      │
├─────────────────────────────────────────────────────┤
│  Estado: PENDIENTE                                   │
│                                                     │
│  [Cancelar]              [Firmar y aprobar →]       │
└─────────────────────────────────────────────────────┘
```

### API involucrada

```typescript
// Ya existe en Frontend/web/src/lib/api.ts
apiTransferRequests.getById(id)    // GET /transfers/requests/:id
apiTransferRequests.update(id, {   // PUT /transfers/requests/:id
  status: 'FIRMADA',
  signedBy: user.email,
})
```

### Backend — endpoint de firma

`PUT /transfers/requests/:id` en [Backend/api/src/interfaces/http/transferRequests.router.ts](../../Backend/api/src/interfaces/http/transferRequests.router.ts)

Cuando `status → FIRMADA`, el backend dispara automáticamente:
- `sseManager.broadcast('transfer_request:updated', ...)`
- Fire-and-forget a `N8N_TRANSFERS_WEBHOOK` (workflow Post-Firma)

---

## 9. Sprint 4 — Seguridad

### Rotación del secreto de sincronización

El secreto actual `29034375360e45b156b74843132bac344a2d55bf62cd58a3c38cb7b0cec7a3ca` debe rotarse antes de poner en producción pública.

**Procedimiento:**

1. **Generar nuevo secreto**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Actualizar en los 3 puntos de configuración de forma simultánea:**

   | Sistema | Ubicación | Variable |
   |---|---|---|
   | GAS | Script Properties | `N8N_WEBHOOK_SECRET` |
   | n8n | Settings → Variables | `SIGAF_SYNC_SECRET` |
   | Backend | `Backend/api/.env` | `SYNC_SECRET` |

3. **Verificar después de la rotación** ejecutando una prueba de humo completa (ver sección 6.4).

### SQL injection pendiente

**Archivo:** `Backend/api/src/infrastructure/db/transferRequestRepository.ts`  
**Ubicación:** función `buildWhere()` aprox. líneas 79-82

Las condiciones de filtro se construyen con concatenación de strings. Deben migrarse a parámetros preparados vía Drizzle ORM o `pg.query` con `$1, $2...`.

---

## Resumen de estado

| Componente | Estado | Bloqueante |
|---|---|---|
| Workflow n8n desplegado | ✅ Activo en producción | — |
| Variables `SIGAF_API_URL` y `SIGAF_SYNC_SECRET` | ⚠️ Pendiente | Sin estas vars el nodo 2 y nodo 8 fallan |
| Credencial OAuth2 `Actas_AF` | ⚠️ Verificar | Nodo 6 falla con 401 si expiró |
| `N8N_WEBHOOK_SECRET` en GAS | ⚠️ Verificar | GAS no envía el header correcto si está vacío |
| Backend SSE broadcast | ✅ Completo | — |
| Frontend EventSource | ✅ Completo | — |
| Sprint 3 — RequestDetailModal | ⏳ Pendiente | — |
| Sprint 4 — Seguridad | ⏳ Pendiente | — |
