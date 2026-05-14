import { and, eq } from 'drizzle-orm'
import { db } from './client'
import {
  catalogBuildings,
  catalogAssetTypes,
  catalogAreas,
  catalogPeople,
  assets,
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

export function findAreasByBuilding(buildingId: number) {
  return db
    .selectDistinct({ id: catalogAreas.id, name: catalogAreas.name })
    .from(catalogAreas)
    .innerJoin(assets, eq(assets.areaId, catalogAreas.id))
    .where(and(
      eq(assets.buildingId, buildingId),
      eq(catalogAreas.active, true),
    ))
    .orderBy(catalogAreas.name)
}

// ── Admin: listAll (includes inactive) ───────────────────────────────────────

export function findAllBuildings() {
  return db.select().from(catalogBuildings).orderBy(catalogBuildings.name)
}

export function findAllAssetTypes() {
  return db.select().from(catalogAssetTypes).orderBy(catalogAssetTypes.name)
}

export function findAllAreas() {
  return db.select().from(catalogAreas).orderBy(catalogAreas.name)
}

export function findAllPeople() {
  return db.select().from(catalogPeople).orderBy(catalogPeople.fullName)
}

// ── Admin: write operations ───────────────────────────────────────────────────

export async function insertBuilding(data: { cityCode: string; code: string; name: string }) {
  const [row] = await db.insert(catalogBuildings).values(data).returning()
  return row
}

export async function patchBuilding(id: number, data: Partial<{ cityCode: string; code: string; name: string; active: boolean }>) {
  const [row] = await db.update(catalogBuildings).set(data).where(eq(catalogBuildings.id, id)).returning()
  return row
}

export async function insertAssetType(data: { code: string; name: string }) {
  const [row] = await db.insert(catalogAssetTypes).values(data).returning()
  return row
}

export async function patchAssetType(code: string, data: Partial<{ name: string; active: boolean }>) {
  const [row] = await db.update(catalogAssetTypes).set(data).where(eq(catalogAssetTypes.code, code)).returning()
  return row
}

export async function insertArea(data: { name: string }) {
  const [row] = await db.insert(catalogAreas).values(data).returning()
  return row
}

export async function patchArea(id: number, data: Partial<{ name: string; active: boolean }>) {
  const [row] = await db.update(catalogAreas).set(data).where(eq(catalogAreas.id, id)).returning()
  return row
}

export async function insertPerson(data: { fullName: string; email?: string; areaId?: number }) {
  const [row] = await db.insert(catalogPeople).values(data).returning()
  return row
}

export async function patchPerson(id: number, data: Partial<{ fullName: string; email: string; areaId: number | null; active: boolean }>) {
  const [row] = await db.update(catalogPeople).set(data).where(eq(catalogPeople.id, id)).returning()
  return row
}
