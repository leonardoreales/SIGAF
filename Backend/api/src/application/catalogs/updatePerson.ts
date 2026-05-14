import type { UpdatePerson } from '@sigaf/shared'
import { patchPerson } from '../../infrastructure/db/catalogRepository'
export const updatePerson = (id: number, data: UpdatePerson) => patchPerson(id, data)
