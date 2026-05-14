import type { UpdateArea } from '@sigaf/shared'
import { patchArea } from '../../infrastructure/db/catalogRepository'
export const updateArea = (id: number, data: UpdateArea) => patchArea(id, data)
