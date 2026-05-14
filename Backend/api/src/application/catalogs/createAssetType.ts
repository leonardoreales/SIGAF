import type { CreateAssetType } from '@sigaf/shared'
import { insertAssetType } from '../../infrastructure/db/catalogRepository'
export const createAssetType = (data: CreateAssetType) => insertAssetType(data)
