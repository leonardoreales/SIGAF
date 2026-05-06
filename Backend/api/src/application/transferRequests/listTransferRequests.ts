import { TransferRequestFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function listTransferRequests(rawFilter: unknown) {
  const filter = TransferRequestFilterSchema.parse(rawFilter)
  return repo.findMany(filter)
}
