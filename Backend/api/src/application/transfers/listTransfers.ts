import { TransferFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRepository'

export async function listTransfers(rawFilter: unknown) {
  const filter = TransferFilterSchema.parse(rawFilter)
  return repo.findMany(filter)
}
