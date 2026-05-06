import * as repo from '../../infrastructure/db/writeoffRepository'

export async function getWriteoffStats() {
  return repo.getStats()
}
