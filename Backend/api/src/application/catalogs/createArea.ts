import type { CreateArea } from '@sigaf/shared'
import { insertArea } from '../../infrastructure/db/catalogRepository'
export const createArea = (data: CreateArea) => insertArea(data)
