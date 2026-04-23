import * as repo from '../../infrastructure/db/assetRepository'

export async function deleteAsset(id: number) {
  return repo.softDelete(id)
}
