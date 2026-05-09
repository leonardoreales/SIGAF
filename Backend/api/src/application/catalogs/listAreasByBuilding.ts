import { findAreasByBuilding } from '../../infrastructure/db/catalogRepository'

export const listAreasByBuilding = (buildingId: number) => findAreasByBuilding(buildingId)
