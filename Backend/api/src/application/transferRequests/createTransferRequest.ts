import { CreateTransferRequestSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function createTransferRequest(rawData: unknown) {
  const data = CreateTransferRequestSchema.parse(rawData)
  return repo.create(data)
}
