import * as repo from '../../infrastructure/db/assetRepository'

export async function getAsset(id: number) {
  return repo.findById(id)
}
