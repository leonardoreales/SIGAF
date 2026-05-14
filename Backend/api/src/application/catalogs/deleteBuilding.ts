import { patchBuilding } from '../../infrastructure/db/catalogRepository'
export const deleteBuilding = (id: number) => patchBuilding(id, { active: false })
