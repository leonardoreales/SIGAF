import { getAssetStats } from '../../infrastructure/db/statsRepository'

export async function getStats() {
  return getAssetStats()
}
