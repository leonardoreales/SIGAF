import { TransferRequestStatusSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRequestRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

function firstNonEmpty(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.trim()) as string | undefined
}

export async function completeTransferRequestSignature(rawData: any) {
  const eventId = firstNonEmpty(rawData?.eventId)
  const sigafRequestId = firstNonEmpty(rawData?.sigafRequestId)
  const status = TransferRequestStatusSchema.parse(rawData?.status || 'RESPUESTA_ENVIADA')

  if (!eventId) throw new AppError(400, 'eventId requerido', 'VALIDATION_ERROR')
  if (!sigafRequestId) throw new AppError(400, 'sigafRequestId requerido', 'VALIDATION_ERROR')

  const request = await repo.findByRequestNumber(sigafRequestId)
  const currentFormData = request.formData || {}
  const previousResult = currentFormData.signatureWorkflowResult as Record<string, unknown> | undefined

  if (previousResult?.eventId === eventId && ['FIRMADA', 'RESPUESTA_ENVIADA'].includes(String(request.status))) {
    return { ok: true, duplicate: true, request }
  }

  const signedPdf = {
    signedGoogleDocId: firstNonEmpty(rawData?.signedGoogleDocId, rawData?.document?.signedGoogleDocId),
    signedGoogleDocUrl: firstNonEmpty(rawData?.signedGoogleDocUrl, rawData?.document?.signedGoogleDocUrl),
    signedPdfDriveFileId: firstNonEmpty(rawData?.signedPdfDriveFileId, rawData?.document?.signedPdfDriveFileId),
    signedPdfDriveUrl: firstNonEmpty(rawData?.signedPdfDriveUrl, rawData?.document?.signedPdfDriveUrl),
    emailSentAt: firstNonEmpty(rawData?.emailSentAt),
  }

  await repo.update(request.id, {
    status,
    signatureAutoriza: firstNonEmpty(rawData?.signatureAutoriza, rawData?.signedBy, rawData?.requestedByName),
    signedBy: firstNonEmpty(rawData?.signedBy, rawData?.requestedByEmail, 'n8n-signature-workflow'),
    notes: `${request.notes || ''}\n[${new Date().toISOString()}] Resultado firma n8n: ${status}. EventId: ${eventId}.`.trim(),
  })

  const updated = await repo.updateFormData(request.id, {
    ...currentFormData,
    signatureWorkflowResult: {
      eventId,
      status,
      correlationId: rawData?.correlationId,
      idSolicitud: rawData?.idSolicitud,
      signedPdf,
      error: rawData?.error || null,
      updatedAt: new Date().toISOString(),
    },
    signedPdf,
  })

  sseManager.broadcast('transfer_request:updated', {
    id: updated.id,
    requestNumber: updated.requestNumber,
    status: updated.status,
    message: 'Resultado de firma recibido desde n8n',
  })

  return { ok: true, duplicate: false, request: updated }
}
