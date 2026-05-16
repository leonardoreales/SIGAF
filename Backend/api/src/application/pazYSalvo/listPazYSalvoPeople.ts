import { PazYSalvoPeopleFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'

/**
 * Entry view del frontend: lista de funcionarios + estado de paz y salvo.
 * Ordena por próximos a vencer primero.
 */
export async function listPazYSalvoPeople(query: unknown) {
  const filter = PazYSalvoPeopleFilterSchema.parse(query)
  return repo.findPeopleWithStatus(filter)
}
