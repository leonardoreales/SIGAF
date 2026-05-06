import { CreateWriteoffActSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/writeoffRepository'

export async function createWriteoff(body: unknown) {
  const data = CreateWriteoffActSchema.parse(body)
  return repo.create(data)
}
