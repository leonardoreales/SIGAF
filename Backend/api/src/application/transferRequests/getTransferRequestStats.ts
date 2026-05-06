import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function getTransferRequestStats() {
  return repo.getStats()
}
