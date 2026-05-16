import { PazYSalvoFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'

export async function listPazYSalvo(query: unknown) {
  const filter = PazYSalvoFilterSchema.parse(query)
  return repo.findMany(filter)
}
