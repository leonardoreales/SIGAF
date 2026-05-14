import type { CreateBuilding } from '@sigaf/shared'
import { insertBuilding } from '../../infrastructure/db/catalogRepository'
export const createBuilding = (data: CreateBuilding) => insertBuilding(data)
