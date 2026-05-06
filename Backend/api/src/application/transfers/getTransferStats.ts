import * as repo from '../../infrastructure/db/transferRepository'

export async function getTransferStats() {
  return repo.getStats()
}
