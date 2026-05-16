import {
  CompletePazYSalvoSignatureSchema,
  type CompletePazYSalvoSignature,
} from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

/**
 * Callback que n8n llama cuando termina el proceso de firma.
 * Idempotente por eventId: si llega dos veces con el mismo eventId y el caso
 * ya está en estado final, devuelve `duplicate: true` sin re-aplicar cambios.
 */
export async function completePazYSalvoSignature(rawData: unknown) {
  let data: CompletePazYSalvoSignature
  try {
    data = CompletePazYSalvoSignatureSchema.parse(rawData)
  } catch {
    throw new AppError(400, 'Payload de firma paz y salvo inválido', 'VALIDATION_ERROR')
  }

  const caseId = Number(data.sigafCaseId)
  if (!Number.isFinite(caseId) || caseId <= 0) {
    throw new AppError(400, `sigafCaseId inválido: ${data.sigafCaseId}`, 'VALIDATION_ERROR')
  }

  const current = await repo.findById(caseId)

  // Idempotencia: si llega el mismo eventId y el caso ya está en estado final, no re-aplicar.
  if (
    current.n8nEventId === data.eventId &&
    (current.status === 'FIRMADA' || current.status === 'COMPLETADA')
  ) {
    return { ok: true, duplicate: true, case: current }
  }

  const updated = await repo.applySignatureResult(caseId, {
    status:              data.status,
    signedBy:            data.signedBy,
    signedGoogleDocUrl:  data.document?.signedGoogleDocUrl,
    signedPdfDriveUrl:   data.document?.signedPdfDriveUrl,
    error:               data.error ?? null,
  })

  sseManager.broadcast('paz_y_salvo:updated', {
    id:         updated.id,
    actaNumber: updated.actaNumber,
    status:     updated.status,
    message:    'Resultado de firma recibido desde n8n',
  })

  return { ok: true, duplicate: false, case: updated }
}
