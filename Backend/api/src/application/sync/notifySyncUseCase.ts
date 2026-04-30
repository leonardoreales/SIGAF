import { createSyncEvent, getLastSyncEvent } from '../../infrastructure/db/syncRepository'
import { sseManager }                        from '../../infrastructure/sse/SseManager'
import type { SyncNotifyPayload }            from '../../domain/sync/SyncEvent'

export async function notifySync(payload: SyncNotifyPayload) {
  const event = await createSyncEvent(payload)
  sseManager.broadcast('assets:synced', event)
  return event
}

export async function getLastSync() {
  return getLastSyncEvent()
}
