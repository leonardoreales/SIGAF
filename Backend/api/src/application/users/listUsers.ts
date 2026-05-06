import { findAll } from '../../infrastructure/db/userRepository'

export async function listUsers() {
  return findAll()
}
