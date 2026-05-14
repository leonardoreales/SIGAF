import { patchAssetType } from '../../infrastructure/db/catalogRepository'
export const deleteAssetType = (code: string) => patchAssetType(code, { active: false })
