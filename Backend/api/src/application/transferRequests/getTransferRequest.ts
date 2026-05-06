import * as repo from '../../infrastructure/db/transferRequestRepository'

export async function getTransferRequest(id: number) {
  return repo.findById(id)
}
