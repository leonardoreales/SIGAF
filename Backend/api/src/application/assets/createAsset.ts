import { CreateAssetSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/assetRepository'

export async function createAsset(rawData: unknown) {
  const data = CreateAssetSchema.parse(rawData)
  return repo.create(data)
}
