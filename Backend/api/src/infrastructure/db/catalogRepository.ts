import { eq } from 'drizzle-orm'
import { db } from './client'
import {
  catalogBuildings,
  catalogAssetTypes,
  catalogAreas,
  catalogPeople,
} from './schema'

export function findBuildings() {
  return db
    .select()
    .from(catalogBuildings)
    .where(eq(catalogBuildings.active, true))
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
