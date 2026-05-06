import { getAdvancedStats as getStatsRepo } from '../../infrastructure/db/statsRepository'

export async function getAdvancedStats(groupBy: string[], filters: any = {}) {
  return await getStatsRepo(groupBy, filters)
}
