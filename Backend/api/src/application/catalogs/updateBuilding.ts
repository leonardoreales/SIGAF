import type { UpdateBuilding } from '@sigaf/shared'
import { patchBuilding } from '../../infrastructure/db/catalogRepository'
export const updateBuilding = (id: number, data: UpdateBuilding) => patchBuilding(id, data)
