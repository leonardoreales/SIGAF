import { CreateTransferSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRepository'

export async function createTransfer(rawData: unknown) {
  const data = CreateTransferSchema.parse(rawData)
  return repo.create(data)
}
