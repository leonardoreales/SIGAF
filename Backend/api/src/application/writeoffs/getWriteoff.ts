import * as repo from '../../infrastructure/db/writeoffRepository'

export async function getWriteoff(id: number) {
  return repo.findById(id)
}
