import { UpdateWriteoffActSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/writeoffRepository'

export async function updateWriteoff(id: number, body: unknown) {
  const data = UpdateWriteoffActSchema.parse(body)
  return repo.update(id, data)
}
