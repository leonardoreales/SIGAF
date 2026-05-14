import { patchPerson } from '../../infrastructure/db/catalogRepository'
export const deletePerson = (id: number) => patchPerson(id, { active: false })
