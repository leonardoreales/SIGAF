import { canTransitionPazYSalvoStatus, type PazYSalvoStatus } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

export async function cancelPazYSalvo(id: number, reason?: string) {
  const current = await repo.findById(id)
  if (!canTransitionPazYSalvoStatus(current.status as PazYSalvoStatus, 'CANCELADA')) {
    throw new AppError(
      400,
      `No se puede cancelar un caso en estado ${current.status}`,
      'INVALID_TRANSITION',
    )
  }

  const updated = await repo.update(id, {
    status: 'CANCELADA',
    notes: `${current.notes ?? ''}\n[${new Date().toISOString()}] Cancelado${reason ? `: ${reason}` : ''}`.trim(),
  })

  sseManager.broadcast('paz_y_salvo:updated', {
    id:         updated.id,
    actaNumber: updated.actaNumber,
    status:     'CANCELADA',
    message:    'Caso cancelado',
  })

  return updated
}
