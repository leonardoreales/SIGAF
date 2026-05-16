import * as repo from '../../infrastructure/db/pazYSalvoRepository'

export async function getPazYSalvoStats() {
  return repo.getStats()
}
