import { eq, ilike, or, and, count, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db, pool } from './client'
import { assets, catalogBuildings, catalogAssetTypes, catalogAreas } from './schema'
import { NotFoundError } from '../../shared/errors'
import type { AssetFilter, CreateAsset, UpdateAsset } from '@sigaf/shared'

// ── Projections ───────────────────────────────────────────────────────────────

const BASE_FIELDS = {
  id:                assets.id,
  plate:             assets.plate,
  plateStatus:       assets.plateStatus,
  plateOriginal:     assets.plateOriginal,
  name:              assets.name,
  description:       assets.description,
  brand:             assets.brand,
  model:             assets.model,
  serial:            assets.serial,
  quantity:          assets.quantity,
  referenceValue:    assets.referenceValue,
  pucAccount:        assets.pucAccount,
  status:            assets.status,
  incorporationYear: assets.incorporationYear,
  acquisitionDate:   assets.acquisitionDate,
  cityCode:          assets.cityCode,
  floor:             assets.floor,
  block:             assets.block,
  location:          assets.location,
  areaId:            assets.areaId,
  personId:          assets.personId,
  responsableRaw:    assets.responsableRaw,
  maintenanceArea:   assets.maintenanceArea,
  criticality:       assets.criticality,
  sourceSheet:       assets.sourceSheet,
  notes:             assets.notes,
  createdAt:         assets.createdAt,
  updatedAt:         assets.updatedAt,
  // joined
  assetTypeCode:     assets.assetTypeCode,
  assetTypeName:     catalogAssetTypes.name,
  buildingId:        assets.buildingId,
  buildingCode:      catalogBuildings.code,
  buildingName:      catalogBuildings.name,
  areaName:          catalogAreas.name,
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function baseQuery() {
  return db
    .select(BASE_FIELDS)
    .from(assets)
    .leftJoin(catalogAssetTypes, eq(assets.assetTypeCode, catalogAssetTypes.code))
    .leftJoin(catalogBuildings,  eq(assets.buildingId,    catalogBuildings.id))
    .leftJoin(catalogAreas,      eq(assets.areaId,        catalogAreas.id))
}

function buildConditions(filter: Partial<AssetFilter>): SQL[] {
  const conds: SQL[] = []
  if (filter.q) {
    const term = `%${filter.q}%`
    conds.push(
      or(
        ilike(assets.plate,          term),
        ilike(assets.name,           term),
        ilike(assets.serial,         term),
        ilike(assets.brand,          term),
        ilike(assets.model,          term),
        ilike(assets.responsableRaw, term),
        ilike(assets.location,       term),
        ilike(assets.sourceSheet,    term),
      )!
    )
  }
  if (filter.type)     conds.push(eq(assets.assetTypeCode, filter.type))
  if (filter.status)   conds.push(eq(assets.status, filter.status))
  if (filter.year)     conds.push(eq(assets.incorporationYear, filter.year))
  if (filter.building) conds.push(eq(catalogBuildings.code, filter.building))
  return conds
}

function toUpdateValues(data: UpdateAsset): Partial<typeof assets.$inferInsert> {
  const v: Partial<typeof assets.$inferInsert> = {}
  if (data.name              !== undefined) v.name              = data.name
  if (data.description       !== undefined) v.description       = data.description
  if (data.pucAccount        !== undefined) v.pucAccount        = data.pucAccount
  if (data.brand             !== undefined) v.brand             = data.brand
  if (data.model             !== undefined) v.model             = data.model
  if (data.serial            !== undefined) v.serial            = data.serial
  if (data.quantity          !== undefined) v.quantity          = data.quantity
  if (data.referenceValue    !== undefined) v.referenceValue    = data.referenceValue.toString()
  if (data.floor             !== undefined) v.floor             = data.floor
  if (data.block             !== undefined) v.block             = data.block
  if (data.location          !== undefined) v.location          = data.location
  if (data.areaId            !== undefined) v.areaId            = data.areaId
  if (data.personId          !== undefined) v.personId          = data.personId
  if (data.responsableRaw    !== undefined) v.responsableRaw    = data.responsableRaw
  if (data.status            !== undefined) v.status            = data.status
  if (data.incorporationYear !== undefined) v.incorporationYear = data.incorporationYear
  if (data.maintenanceArea   !== undefined) v.maintenanceArea   = data.maintenanceArea ?? null
  if (data.criticality       !== undefined) v.criticality       = data.criticality
  if (data.notes             !== undefined) v.notes             = data.notes
  return v
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function findMany(filter: AssetFilter) {
  const offset = (filter.page - 1) * filter.limit
  const conds  = buildConditions(filter)
  const where  = conds.length ? and(...conds) : undefined

  const orderExpr = filter.q
    ? sql`CASE
        WHEN ${assets.plate} = ${filter.q} THEN 1
        WHEN ${assets.plate} ILIKE ${filter.q + '%'} THEN 2
        WHEN ${assets.serial} = ${filter.q} THEN 3
        WHEN ${assets.serial} ILIKE ${filter.q + '%'} THEN 4
        WHEN ${assets.name} ILIKE ${'%' + filter.q + '%'} THEN 5
        ELSE 9
      END`
    : assets.id

  const [rows, [{ total }]] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(orderExpr)
      .limit(filter.limit)
      .offset(offset),
    db.select({ total: count() })
      .from(assets)
      .leftJoin(catalogBuildings, eq(assets.buildingId, catalogBuildings.id))
      .where(where),
  ])

  return {
    data: rows,
    meta: {
      total: Number(total),
      page:  filter.page,
      limit: filter.limit,
      pages: Math.ceil(Number(total) / filter.limit),
    },
  }
}

export async function findById(id: number) {
  const [row] = await baseQuery().where(eq(assets.id, id))
  if (!row) throw new NotFoundError('Activo', id)
  return row
}

export async function create(data: CreateAsset) {
  const [building] = await db
    .select({ code: catalogBuildings.code })
    .from(catalogBuildings)
    .where(eq(catalogBuildings.id, data.buildingId))

  if (!building) throw new NotFoundError('Edificio', data.buildingId)

  // generate_plate() es atómica en PG — garantiza unicidad bajo carga concurrente
  const { rows } = await pool.query<{ generate_plate: string }>(
    'SELECT generate_plate($1, $2, $3)',
    [data.cityCode, building.code, data.assetTypeCode],
  )
  const plate = rows[0].generate_plate

  const [inserted] = await db
    .insert(assets)
    .values({
      plate,
      plateStatus:       'GENERADA',
      name:              data.name,
      description:       data.description,
      assetTypeCode:     data.assetTypeCode,
      pucAccount:        data.pucAccount,
      brand:             data.brand,
      model:             data.model,
      serial:            data.serial,
      quantity:          data.quantity,
      referenceValue:    data.referenceValue?.toString(),
      cityCode:          data.cityCode,
      buildingId:        data.buildingId,
      floor:             data.floor,
      block:             data.block,
      location:          data.location,
      areaId:            data.areaId,
      personId:          data.personId,
      responsableRaw:    data.responsableRaw,
      status:            data.status,
      incorporationYear: data.incorporationYear,
      maintenanceArea:   data.maintenanceArea,
      criticality:       data.criticality ?? 'BAJO',
      notes:             data.notes,
    })
    .returning({ id: assets.id })

  return findById(inserted.id)
}

export async function update(id: number, data: UpdateAsset) {
  await findById(id)

  const values = toUpdateValues(data)
  if (Object.keys(values).length === 0) return findById(id)

  await db.update(assets).set(values).where(eq(assets.id, id))
  return findById(id)
}

export async function softDelete(id: number): Promise<void> {
  await findById(id)
  await db.update(assets).set({ status: 'DADO_DE_BAJA' }).where(eq(assets.id, id))
}
