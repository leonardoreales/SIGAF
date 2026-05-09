import { CreateTransferRequestSchema } from '@sigaf/shared'
import * as repo        from '../../infrastructure/db/transferRequestRepository'
import { sseManager }   from '../../infrastructure/sse/SseManager'

export async function createTransferRequest(rawData: unknown) {
  const data   = CreateTransferRequestSchema.parse(rawData)
  const result = await repo.create(data)
  sseManager.broadcast('transfer_request:created', {
    requestNumber: result.requestNumber,
    status:        result.status,
  })
  return result
}
