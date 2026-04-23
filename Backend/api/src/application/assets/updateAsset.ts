import { UpdateAssetSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/assetRepository'

export async function updateAsset(id: number, rawData: unknown) {
  const data = UpdateAssetSchema.parse(rawData)
  return repo.update(id, data)
}
