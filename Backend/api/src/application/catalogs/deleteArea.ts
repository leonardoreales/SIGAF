import { patchArea } from '../../infrastructure/db/catalogRepository'
export const deleteArea = (id: number) => patchArea(id, { active: false })
