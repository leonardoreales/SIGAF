import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function deleteTransferRequest(id: number) {
  await repo.remove(id)
  return { success: true }
}
