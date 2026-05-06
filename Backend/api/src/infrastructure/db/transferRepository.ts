import { eq, ilike, or, and, count, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db, pool } from './client'
import { transfers, assets } from './schema'
import { NotFoundError } from '../../shared/errors'
import type { CreateTransfer, UpdateTransfer, TransferFilter } from '@sigaf/shared'

// ── Raw-SQL select (múltiples self-joins requieren SQL plano) ─────────────────

const SELECT_TRANSFER = `
  SELECT
    t.id,
    t.transfer_number                        AS "transferNumber",
    t.asset_id                               AS "assetId",
    a.plate                                  AS "assetPlate",
    a.name                                   AS "assetName",
    cat_type.name                            AS "assetTypeName",
    a.serial                                 AS "assetSerial",
    a.brand                                  AS "assetBrand",
    a.model                                  AS "assetModel",
    a.reference_value::text                  AS "assetReferenceValue",
    a.incorporation_year                     AS "assetIncorporationYear",

    t.origin_building_id                     AS "originBuildingId",
    ob.name                                  AS "originBuildingName",
    t.origin_area_id                         AS "originAreaId",
    oa.name                                  AS "originAreaName",
    t.origin_responsible                     AS "originResponsible",
    t.origin_floor                           AS "originFloor",
    t.origin_block                           AS "originBlock",
    t.origin_location                        AS "originLocation",

    t.dest_building_id                       AS "destBuildingId",
    db_.name                                 AS "destBuildingName",
    t.dest_area_id                           AS "destAreaId",
    da.name                                  AS "destAreaName",
    t.dest_person_id                         AS "destPersonId",
    dp.full_name                             AS "destPersonName",
    t.dest_responsible                       AS "destResponsible",
    t.dest_floor                             AS "destFloor",
    t.dest_block                             AS "destBlock",
    t.dest_location                          AS "destLocation",

    t.status,
    t.reason,
    t.requested_by                           AS "requestedBy",
    t.notes,
    t.scheduled_at                           AS "scheduledAt",
    t.completed_at                           AS "completedAt",

    t.n8n_notified                           AS "n8nNotified",
    t.n8n_webhook_sent_at                    AS "n8nWebhookSentAt",

    t.signature_origin                       AS "signatureOrigin",
    t.signature_dest                         AS "signatureDest",
    t.signed_at                              AS "signedAt",

    t.created_at                             AS "createdAt",
    t.updated_at                             AS "updatedAt"
  FROM transfers t
  JOIN assets            a        ON a.id        = t.asset_id
  LEFT JOIN catalog_asset_types cat_type ON cat_type.code = a.asset_type_code
  LEFT JOIN catalog_buildings   ob       ON ob.id  = t.origin_building_id
  LEFT JOIN catalog_areas       oa       ON oa.id  = t.origin_area_id
  LEFT JOIN catalog_buildings   db_      ON db_.id = t.dest_building_id
  LEFT JOIN catalog_areas       da       ON da.id  = t.dest_area_id
  LEFT JOIN catalog_people      dp       ON dp.id  = t.dest_person_id
`

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateTransferNumber(): Promise<string> {
  const now   = new Date()
  const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { rows } = await pool.query<{ n: string }>(
    `SELECT LPAD((COUNT(*) + 1)::text, 4, '0') AS n
       FROM transfers
      WHERE transfer_number LIKE $1`,
    [`TR-${ym}-%`],
  )
  return `TR-${ym}-${rows[0].n}`
}

function buildWhere(filter: TransferFilter): string {
  const parts: string[] = []
  if (filter.q)              parts.push(`(t.transfer_number ILIKE '%${filter.q}%' OR a.name ILIKE '%${filter.q}%' OR a.plate ILIKE '%${filter.q}%')`)
  if (filter.status)         parts.push(`t.status = '${filter.status}'`)
  if (filter.originBuilding) parts.push(`t.origin_building_id = ${filter.originBuilding}`)
  if (filter.destBuilding)   parts.push(`t.dest_building_id   = ${filter.destBuilding}`)
  return parts.length ? `WHERE ${parts.join(' AND ')}` : ''
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function findMany(filter: TransferFilter) {
  const where  = buildWhere(filter)
  const offset = (filter.page - 1) * filter.limit

  const [rowsRes, countRes] = await Promise.all([
    pool.query(`${SELECT_TRANSFER} ${where} ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`, [filter.limit, offset]),
    pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM transfers t JOIN assets a ON a.id = t.asset_id ${where}`),
  ])

  const total = Number(countRes.rows[0].total)
  return {
    data: rowsRes.rows,
    meta: { total, page: filter.page, limit: filter.limit, pages: Math.ceil(total / filter.limit) },
  }
}

export async function findById(id: number) {
  const { rows } = await pool.query(`${SELECT_TRANSFER} WHERE t.id = $1`, [id])
  if (!rows[0]) throw new NotFoundError('Traslado', id)
  return rows[0]
}

export async function create(data: CreateTransfer) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, data.assetId))
  if (!asset) throw new NotFoundError('Activo', data.assetId)

  const transferNumber = await generateTransferNumber()

  const [inserted] = await db
    .insert(transfers)
    .values({
      transferNumber,
      assetId:           data.assetId,
      originBuildingId:  asset.buildingId,
      originAreaId:      asset.areaId,
      originResponsible: asset.responsableRaw,
      originFloor:       asset.floor,
      originBlock:       asset.block,
      originLocation:    asset.location,
      destBuildingId:    data.destBuildingId,
      destAreaId:        data.destAreaId,
      destPersonId:      data.destPersonId,
      destResponsible:   data.destResponsible,
      destFloor:         data.destFloor,
      destBlock:         data.destBlock,
      destLocation:      data.destLocation,
      reason:            data.reason,
      requestedBy:       data.requestedBy,
      notes:             data.notes,
      scheduledAt:       data.scheduledAt,
      status:            'PENDIENTE',
    })
    .returning({ id: transfers.id })

  await db.update(assets).set({ status: 'EN_TRASLADO' }).where(eq(assets.id, data.assetId))

  return findById(inserted.id)
}

export async function update(id: number, data: UpdateTransfer) {
  const current = await findById(id)

  const values: Partial<typeof transfers.$inferInsert> = {}
  if (data.status         !== undefined) values.status         = data.status
  if (data.destBuildingId !== undefined) values.destBuildingId = data.destBuildingId
  if (data.destAreaId     !== undefined) values.destAreaId     = data.destAreaId ?? undefined
  if (data.destPersonId   !== undefined) values.destPersonId   = data.destPersonId ?? undefined
  if (data.destResponsible !== undefined) values.destResponsible = data.destResponsible
  if (data.destFloor      !== undefined) values.destFloor      = data.destFloor
  if (data.destBlock      !== undefined) values.destBlock      = data.destBlock
  if (data.destLocation   !== undefined) values.destLocation   = data.destLocation
  if (data.reason         !== undefined) values.reason         = data.reason
  if (data.requestedBy    !== undefined) values.requestedBy    = data.requestedBy
  if (data.notes          !== undefined) values.notes          = data.notes
  if (data.scheduledAt    !== undefined) values.scheduledAt    = data.scheduledAt ?? undefined

  if (data.status === 'COMPLETADO') {
    values.completedAt = new Date()

    const dest = await findById(id)
    await db.update(assets).set({
      status:         'ACTIVO',
      buildingId:     dest.destBuildingId  ?? current.originBuildingId,
      areaId:         dest.destAreaId      ?? undefined,
      personId:       dest.destPersonId    ?? undefined,
      responsableRaw: dest.destResponsible ?? undefined,
      floor:          dest.destFloor       ?? undefined,
      block:          dest.destBlock       ?? undefined,
      location:       dest.destLocation    ?? undefined,
    }).where(eq(assets.id, current.assetId))
  }

  if (data.status === 'CANCELADO') {
    await db.update(assets).set({ status: 'ACTIVO' }).where(eq(assets.id, current.assetId))
  }

  await db.update(transfers).set(values).where(eq(transfers.id, id))
  return findById(id)
}

export interface TransferStatsResult {
  total:      number
  pendiente:  number
  enProceso:  number
  completado: number
  cancelado:  number
}

export async function getStats(): Promise<TransferStatsResult> {
  const { rows } = await pool.query<{
    total: string; pendiente: string; en_proceso: string; completado: string; cancelado: string
  }>(`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE status = 'PENDIENTE')::int         AS pendiente,
      COUNT(*) FILTER (WHERE status = 'EN_PROCESO')::int        AS en_proceso,
      COUNT(*) FILTER (WHERE status = 'COMPLETADO')::int        AS completado,
      COUNT(*) FILTER (WHERE status = 'CANCELADO')::int         AS cancelado
    FROM transfers
  `)
  const r = rows[0]
  return {
    total:      Number(r.total),
    pendiente:  Number(r.pendiente),
    enProceso:  Number(r.en_proceso),
    completado: Number(r.completado),
    cancelado:  Number(r.cancelado),
  }
}
