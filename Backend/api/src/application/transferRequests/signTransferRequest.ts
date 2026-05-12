import axios from 'axios'
import * as repo from '../../infrastructure/db/transferRequestRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

export async function signTransferRequest(id: number, signData: any) {
  // 1. Obtener la solicitud
  const request = await repo.findById(id)
  if (!request) {
    throw new AppError(404, 'Solicitud no encontrada', 'NOT_FOUND')
  }

  // 2. Validar estado
  if (!['REVISION', 'APROBADA'].includes(request.status)) {
    throw new AppError(400, `La solicitud no puede ser firmada en estado ${request.status}`, 'INVALID_STATE')
  }

  // 3. Preparar payload para n8n
  const formData = request.formData || {}
  const items = request.items || []

  const payload = {
    eventType: "TRANSFER_REQUEST_SIGN_REQUESTED",
    eventId: `evt_TR-${request.requestNumber}_${new Date().getTime()}`,
    sigafRequestId: request.requestNumber,
    correlationId: request.formData?.correlationId || request.requestNumber,
    idSolicitud: request.formData?.idSolicitud || request.requestNumber,

    documentToSign: {
      googleDocId: request.formData?.document?.googleDocId || request.formData?.googleDocId,
      googleDocUrl: request.formData?.document?.googleDocUrl || request.formData?.googleDocUrl,
      originalDriveFileId: request.formData?.document?.originalDriveFileId || request.formData?.originalDriveFileId || request.docxDriveUrl,
    },

    emailContext: {
      messageId: request.formData?.emailContext?.messageId || request.formData?.messageId,
      threadId: request.formData?.emailContext?.threadId || request.formData?.threadId,
      senderEmail: request.senderEmail,
      senderName: request.formData?.emailContext?.senderName || request.formData?.senderName,
      subject: request.subject,
    },

    signature: {
      requestedByName: signData.requestedByName || "Leonardo Reales",
      requestedByEmail: signData.requestedByEmail || "leonardoreales@americana.edu.co",
      signatureRole: "RESPONSABLE_ACTIVOS_FIJOS",
      signatureAnchor: "FIRMA DEL RESPONSABLE ACTIVOS FIJOS"
    },

    summary: {
      solicitante: request.formData?.formData?.solicitante || request.formData?.solicitante,
      dependencia: request.formData?.formData?.dependencia || request.formData?.dependencia,
      itemsCount: items.length,
      movementType: request.formData?.formData?.movement?.movementType || request.formData?.movement?.movementType,
      movementDate: request.formData?.formData?.movement?.movementDateRaw || request.formData?.movement?.movementDateRaw,
    }
  }

  // 4. Llamar a n8n
  const webhookUrl = process.env.N8N_SIGN_WEBHOOK || 'https://n8n.americana.edu.co/webhook/traslados-firma-acta'
  
  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        'x-sigaf-sync-secret': process.env.SYNC_SECRET
      }
    })
  } catch (error: any) {
    console.error('[SIGAF] Error llamando a n8n para firma:', error.message)
    throw new AppError(500, 'Error al conectar con el motor de firmas (n8n)', 'EXTERNAL_ERROR')
  }

  // 5. Actualizar estado a REVISION (o uno intermedio si existe)
  // Según el PDF, el estado recomendado es FIRMA_SOLICITADA o FIRMA_EN_PROCESO
  // Pero el enum actual es ['RECIBIDA', 'REVISION', 'APROBADA', 'FIRMADA', 'RECHAZADA']
  // Usaremos REVISION por ahora si no está ya, o lo dejamos igual pero notificamos
  
  const updated = await repo.update(id, { 
    status: 'REVISION',
    notes: (request.notes || '') + `\n[${new Date().toISOString()}] Firma solicitada por ${payload.signature.requestedByName}.`
  })

  // 6. Notificar por SSE
  sseManager.broadcast('transfer_request:updated', {
    id: request.id,
    requestNumber: request.requestNumber,
    status: updated.status,
    message: 'Proceso de firma iniciado'
  })

  return { ok: true, message: 'Firma solicitada correctamente', requestId: id }
}
