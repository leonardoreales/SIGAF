import { UpdateTransferSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRepository'

export async function updateTransfer(id: number, rawData: unknown) {
  const data = UpdateTransferSchema.parse(rawData)
  return repo.update(id, data)
}
