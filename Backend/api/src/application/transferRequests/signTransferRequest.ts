import axios from 'axios'
import crypto from 'crypto'
import * as repo from '../../infrastructure/db/transferRequestRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

interface SignRequester {
  name?: string
  email?: string
}

const SIGNABLE_STATUSES = [
  'PENDIENTE_GESTION_ACTIVOS_FIJOS',
  'REVISION',
  'APROBADA',
]

const IN_PROGRESS_STATUSES = [
  'FIRMA_SOLICITADA',
  'FIRMA_EN_PROCESO',
  'PDF_GENERADO',
  'RESPUESTA_ENVIANDO',
]

function firstNonEmpty(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.trim()) as string | undefined
}

function buildHmac(body: string) {
  const secret = process.env.N8N_SIGN_HMAC_SECRET
  if (!secret) return undefined
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
}

function requireField(value: string | undefined, label: string) {
  if (!value) throw new AppError(400, `${label} requerido para solicitar firma`, 'VALIDATION_ERROR')
  return value
}

export async function signTransferRequest(id: number, signData: any, requester?: SignRequester) {
  const request = await repo.findById(id)

  if (request.status === 'FIRMADA' || request.status === 'RESPUESTA_ENVIADA') {
    return { ok: true, message: 'La solicitud ya fue firmada', requestId: id, status: request.status }
  }

  if (IN_PROGRESS_STATUSES.includes(request.status)) {
    return { ok: true, message: 'La firma ya está en proceso', requestId: id, status: request.status }
  }

  if (!SIGNABLE_STATUSES.includes(request.status)) {
    throw new AppError(400, `La solicitud no puede ser firmada en estado ${request.status}`, 'INVALID_STATE')
  }

  const formData = request.formData || {}
  const emailContext = formData.emailContext || {}
  const document = formData.document || {}
  const items = request.items || []

  const requestedByName = firstNonEmpty(
    signData?.requestedByName,
    requester?.name,
    'Leonardo Reales',
  )
  const requestedByEmail = firstNonEmpty(
    signData?.requestedByEmail,
    requester?.email,
    'leonardoreales@americana.edu.co',
  )

  const payload = {
    eventType: 'TRANSFER_REQUEST_SIGN_REQUESTED',
    eventId: `evt_${request.requestNumber}_SIGN_REQUESTED`,
    sigafRequestId: request.requestNumber,

    correlationId: firstNonEmpty(formData.correlationId, request.requestNumber),
    idSolicitud: firstNonEmpty(formData.idSolicitud, request.requestNumber),

    documentToSign: {
      googleDocId: requireField(
        firstNonEmpty(document.googleDocId, formData.googleDocId),
        'googleDocId',
      ),
      googleDocUrl: firstNonEmpty(document.googleDocUrl, formData.googleDocUrl),
      originalDriveFileId: firstNonEmpty(
        document.originalDriveFileId,
        formData.originalDriveFileId,
        request.docxDriveUrl,
      ),
    },

    emailContext: {
      messageId: requireField(
        firstNonEmpty(emailContext.messageId, formData.messageId),
        'messageId',
      ),
      threadId: requireField(
        firstNonEmpty(emailContext.threadId, formData.threadId),
        'threadId',
      ),
      senderEmail: requireField(
        firstNonEmpty(request.senderEmail, emailContext.senderEmail, formData.senderEmail),
        'senderEmail',
      ),
      senderName: firstNonEmpty(emailContext.senderName, formData.senderName),
      subject: firstNonEmpty(request.subject, emailContext.subject, 'Solicitud F-AF-039 firmada'),
    },

    signature: {
      requestedByName,
      requestedByEmail,
      signatureRole: 'RESPONSABLE_ACTIVOS_FIJOS',
      signatureImageFileId: requireField(
        firstNonEmpty(signData?.signatureImageFileId, process.env.SIGAF_SIGNATURE_IMAGE_FILE_ID),
        'signatureImageFileId',
      ),
      signatureAnchor: firstNonEmpty(
        signData?.signatureAnchor,
        'FIRMA DEL RESPONSABLE ACTIVOS FIJOS',
      ),
    },

    summary: {
      solicitante: firstNonEmpty(formData.solicitante, formData.authorizedPerson?.fullName),
      dependencia: firstNonEmpty(formData.dependencia, formData.assetResponsible?.area),
      itemsCount: items.length,
      movementType: firstNonEmpty(formData.movement?.movementType),
      movementDate: firstNonEmpty(formData.movement?.movementDateRaw, formData.fecha),
    },
  }

  const webhookUrl = process.env.N8N_SIGN_WEBHOOK
  if (!webhookUrl) {
    throw new AppError(500, 'N8N_SIGN_WEBHOOK no configurado', 'CONFIG_ERROR')
  }

  const body = JSON.stringify(payload)

  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-sigaf-sign-request-secret': process.env.N8N_SIGN_REQUEST_SECRET || process.env.SYNC_SECRET || '',
        ...(buildHmac(body) ? { 'x-sigaf-signature': buildHmac(body) } : {}),
      },
      timeout: 30000,
    })
  } catch (error: any) {
    console.error('[SIGAF] Error llamando a n8n para firma:', error.message)
    throw new AppError(502, 'Error al conectar con el motor de firmas (n8n)', 'EXTERNAL_ERROR')
  }

  const updated = await repo.update(id, {
    status: 'FIRMA_SOLICITADA',
    notes: `${request.notes || ''}\n[${new Date().toISOString()}] Firma solicitada por ${requestedByName}. EventId: ${payload.eventId}.`.trim(),
  })

  sseManager.broadcast('transfer_request:updated', {
    id: request.id,
    requestNumber: request.requestNumber,
    status: updated.status,
    message: 'Proceso de firma iniciado',
  })

  return { ok: true, message: 'Firma solicitada correctamente', requestId: id, eventId: payload.eventId }
}
