# Paz y Salvo - workflow n8n

Archivo importable: `Paz y Salvo - Generar y Firmar Acta.json`

## Variables n8n requeridas

- `SIGAF_API_URL`: URL publica del backend SIGAF, sin slash final.
- `SIGAF_SIGN_DOCUMENT_SECRET`: debe coincidir con `SIGN_DOCUMENT_SECRET` del backend.
- `SIGAF_SYNC_SECRET`: fallback para callback; normalmente coincide con `N8N_SIGN_RESULT_SECRET` o `SYNC_SECRET`.
- `PAZ_Y_SALVO_TEMPLATE_DOC_ID`: Google Doc plantilla del acta.
- `PAZ_Y_SALVO_DRIVE_FOLDER_ID`: carpeta Drive destino para copias firmadas y PDF.

## Backend requerido

- `N8N_PAZ_Y_SALVO_WEBHOOK`: URL productiva del webhook `sigaf-paz-y-salvo-firmar-acta`.
- `SIGAF_API_URL`: misma URL publica del API usada por n8n para callbacks.
- `SIGN_DOCUMENT_SECRET`: secreto para `POST /sync/sign-document`.
- `N8N_SIGN_RESULT_SECRET` o `SYNC_SECRET`: secreto para `POST /sync/paz-y-salvo/firma-completada`.
- `SIGAF_SIGNATURE_IMAGE_FILE_ID`: imagen institucional de firma en Drive.

## Contrato de entrada

El backend envia `eventType = PAZ_Y_SALVO_SIGN_REQUESTED` con:

- `eventId`, `sigafCaseId`, `actaNumber`, `fechaActa`, `motivo`
- `funcionarioEntrega`
- `funcionarioRecibe`
- `observaciones`
- `items[]`
- `signature.signatureImageFileId`
- `signature.signatureAnchor`
- `callback.secret`

## Placeholders de plantilla

- `{{CODIGO_ACTA}}`
- `{{FECHA_ACTA}}`
- `{{VERSION}}`
- `{{MOTIVO}}`
- `{{FUNCIONARIO_ENTREGA_NOMBRE}}`
- `{{FUNCIONARIO_ENTREGA_IDENTIFICACION}}`
- `{{CARGO_FUNCIONARIO}}`
- `{{AREA_ENTREGA}}`
- `{{FECHA_TERMINACION_CONTRATO}}`
- `{{FUNCIONARIO_RECIBE_NOMBRE}}`
- `{{FUNCIONARIO_RECIBE_EMAIL}}`
- `{{OBSERVACIONES}}`
- `{{ACTIVOS_TABLA}}`

`{{ACTIVOS_TABLA}}` se reemplaza con filas separadas por tabs y saltos de linea. Si la plantilla exige una tabla nativa de Google Docs, agregar una segunda iteracion con `documents.get` + `insertTable` + llenado por indices.

## Callback final

El workflow llama:

`POST /sync/paz-y-salvo/firma-completada`

con:

```json
{
  "eventId": "evt_PYS-YYYY-NNN_SIGN_REQUESTED",
  "sigafCaseId": "123",
  "status": "COMPLETADA",
  "signedBy": "responsable",
  "document": {
    "signedGoogleDocId": "...",
    "signedGoogleDocUrl": "...",
    "signedPdfDriveFileId": "...",
    "signedPdfDriveUrl": "..."
  }
}
```

## Estado de validacion

- JSON parsea correctamente.
- `validate_workflow` MCP: valido, 0 errores.
- Advertencias pendientes: falta Error Workflow dedicado y URLs formadas desde variables n8n.
