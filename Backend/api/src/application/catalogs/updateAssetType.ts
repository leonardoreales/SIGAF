import type { UpdateAssetType } from '@sigaf/shared'
import { patchAssetType } from '../../infrastructure/db/catalogRepository'
export const updateAssetType = (code: string, data: UpdateAssetType) => patchAssetType(code, data)
