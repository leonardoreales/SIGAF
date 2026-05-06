import { WriteoffFilterSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/writeoffRepository'

export async function listWriteoffs(rawFilter: unknown) {
  const filter = WriteoffFilterSchema.parse(rawFilter)
  return repo.findMany(filter)
}
