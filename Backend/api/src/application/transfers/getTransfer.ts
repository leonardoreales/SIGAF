import * as repo from '../../infrastructure/db/transferRepository'

export async function getTransfer(id: number) {
  return repo.findById(id)
}
