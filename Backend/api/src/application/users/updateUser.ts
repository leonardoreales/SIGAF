import { UpdateUserSchema } from '@sigaf/shared'
import { updateUser as repoUpdate } from '../../infrastructure/db/userRepository'
import { NotFoundError } from '../../shared/errors'

export async function updateUser(email: string, rawBody: unknown) {
  const data = UpdateUserSchema.parse(rawBody)
  const updated = await repoUpdate(email, data)
  if (!updated) throw new NotFoundError('Usuario', email)
  return updated
}
