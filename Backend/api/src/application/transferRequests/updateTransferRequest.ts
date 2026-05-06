import { UpdateTransferRequestSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function updateTransferRequest(id: number, rawData: unknown) {
  const data   = UpdateTransferRequestSchema.parse(rawData)
  const result = await repo.update(id, data)

  if (data.status === 'FIRMADA' && process.env.N8N_TRANSFERS_WEBHOOK) {
    const { signatureEntrega, signatureRecibe, signatureAutoriza, rawText, ...webhookData } =
      result as Record<string, unknown>
    ;(async () => {
      try {
        await fetch(process.env.N8N_TRANSFERS_WEBHOOK!, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ event: 'REQUEST_SIGNED', ...webhookData }),
        })
      } catch (err) {
        console.error('[n8n webhook] Error firing transfer-request webhook:', err)
      }
    })()
  }

  return result
}
