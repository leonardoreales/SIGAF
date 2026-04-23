import { AssetFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/assetRepository'

export async function listAssets(rawFilter: unknown) {
  const filter = AssetFilterSchema.parse(rawFilter)
  return repo.findMany(filter)
}
