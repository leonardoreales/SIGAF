import type { CreatePerson } from '@sigaf/shared'
import { insertPerson } from '../../infrastructure/db/catalogRepository'
export const createPerson = (data: CreatePerson) => insertPerson(data)
