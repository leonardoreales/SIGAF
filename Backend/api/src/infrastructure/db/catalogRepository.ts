import { and, eq } from 'drizzle-orm'
import { db } from './client'
import {
  catalogBuildings,
  catalogAssetTypes,
  catalogAreas,
  catalogPeople,
} from './schema'

export function findBuildings(cityCode = '1') {
  return db
    .select()
    .from(catalogBuildings)
    .where(and(
      eq(catalogBuildings.active, true),
      eq(catalogBuildings.cityCode, cityCode),
    ))
    .orderBy(catalogBuildings.name)
}

export function findAssetTypes() {
  return db
    .select()
    .from(catalogAssetTypes)
    .where(eq(catalogAssetTypes.active, true))
    .orderBy(catalogAssetTypes.name)
}

export function findAreas() {
  return db
    .select()
    .from(catalogAreas)
    .where(eq(catalogAreas.active, true))
    .orderBy(catalogAreas.name)
}

export function findPeople() {
  return db
    .select()
    .from(catalogPeople)
    .where(eq(catalogPeople.active, true))
    .orderBy(catalogPeople.fullName)
}
