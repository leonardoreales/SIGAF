import {
  UpdatePazYSalvoSchema,
  canTransitionPazYSalvoStatus,
  type PazYSalvoStatus,
} from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'
import { AppError } from '../../shared/errors'

export async function updatePazYSalvo(id: number, body: unknown) {
  const data = UpdatePazYSalvoSchema.parse(body)

  if (data.status !== undefined) {
    const current = await repo.findById(id)
    if (!canTransitionPazYSalvoStatus(current.status as PazYSalvoStatus, data.status)) {
      throw new AppError(
        400,
        `Transición inválida: ${current.status} → ${data.status}`,
        'INVALID_TRANSITION',
      )
    }
  }

  return repo.update(id, data)
}
