import * as repo from '../../infrastructure/db/pazYSalvoRepository'

export async function getPazYSalvo(id: number) {
  return repo.findById(id)
}
