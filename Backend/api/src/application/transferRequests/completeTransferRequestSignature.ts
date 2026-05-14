import { CompleteTransferRequestSignatureSchema, type CompleteTransferRequestSignature } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRequestRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

function firstNonEmpty(...values: (string | undefined | null)[]) {
  return values.find((v) => typeof v === 'string' && v.trim()) as string | undefined
}

export async function completeTransferRequestSignature(rawData: unknown) {
  let data: CompleteTransferRequestSignature
  try {
    data = CompleteTransferRequestSignatureSchema.parse(rawData)
  } catch {
    throw new AppError(400, 'Payload de firma inválido', 'VALIDATION_ERROR')
  }

  const { eventId, sigafRequestId, status } = data

  const request = await repo.findByRequestNumber(sigafRequestId)
  const currentFormData = request.formData || {}
  const previousResult = currentFormData.signatureWorkflowResult as Record<string, unknown> | undefined

  if (previousResult?.eventId === eventId && ['FIRMADA', 'RESPUESTA_ENVIADA'].includes(String(request.status))) {
    return { ok: true, duplicate: true, request }
  }

  const signedPdf = {
    signedGoogleDocId:    firstNonEmpty(data.signedGoogleDocId,    data.document?.signedGoogleDocId),
    signedGoogleDocUrl:   firstNonEmpty(data.signedGoogleDocUrl,   data.document?.signedGoogleDocUrl),
    signedPdfDriveFileId: firstNonEmpty(data.signedPdfDriveFileId, data.document?.signedPdfDriveFileId),
    signedPdfDriveUrl:    firstNonEmpty(data.signedPdfDriveUrl,    data.document?.signedPdfDriveUrl),
    emailSentAt:          firstNonEmpty(data.emailSentAt),
  }

  await repo.update(request.id, {
    status,
    signatureAutoriza: firstNonEmpty(data.signatureAutoriza, data.signedBy, data.requestedByName),
    signedBy:          firstNonEmpty(data.signedBy, data.requestedByEmail, 'n8n-signature-workflow'),
    notes: `${request.notes || ''}\n[${new Date().toISOString()}] Resultado firma n8n: ${status}. EventId: ${eventId}.`.trim(),
  })

  const updated = await repo.updateFormData(request.id, {
    ...currentFormData,
    signatureWorkflowResult: {
      eventId,
      status,
      correlationId: data.correlationId,
      idSolicitud:   data.idSolicitud,
      signedPdf,
      error:         data.error ?? null,
      updatedAt:     new Date().toISOString(),
    },
    signedPdf,
  })

  sseManager.broadcast('transfer_request:updated', {
    id:            updated.id,
    requestNumber: updated.requestNumber,
    status:        updated.status,
    message:       'Resultado de firma recibido desde n8n',
  })

  return { ok: true, duplicate: false, request: updated }
}
