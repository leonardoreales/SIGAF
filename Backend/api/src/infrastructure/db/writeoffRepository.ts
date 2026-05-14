import { pool, db } from './client'
import { eq } from 'drizzle-orm'
import { writeoffActs } from './schema'
import { NotFoundError } from '../../shared/errors'
import type { WriteoffFilter, CreateWriteoffAct, UpdateWriteoffAct } from '@sigaf/shared'

// ── List (paginado) ───────────────────────────────────────────────────────────

export async function findMany(filter: WriteoffFilter) {
  const parts:  string[]  = []
  const params: unknown[] = []

  if (filter.q) {
    params.push(`%${filter.q}%`)
    parts.push(`w.acta_number ILIKE $${params.length}`)
  }
  if (filter.building) {
    params.push(`%${filter.building}%`)
    parts.push(`w.building ILIKE $${params.length}`)
  }
  if (filter.reason) {
    params.push(filter.reason)
    parts.push(`w.reason = $${params.length}`)
  }
  if (filter.status) {
    params.push(filter.status)
    parts.push(`w.status = $${params.length}`)
  }

  const clause    = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  const offset    = (filter.page - 1) * filter.limit
  const limitIdx  = params.length + 1
  const offsetIdx = params.length + 2

  const [rowsRes, countRes] = await Promise.all([
    pool.query(
      `SELECT
         w.id, w.acta_number AS "actaNumber", w.date, w.building, w.reason,
         w.status, w.total_items AS "totalItems",
         w.authorized_by AS "authorizedBy", w.authorized_by_role AS "authorizedByRole",
         w.responsible, w.responsible_role AS "responsibleRole",
         w.notes, w.created_at AS "createdAt",
         COUNT(wi.id) FILTER (WHERE wi.reconciled_status = 'MATCHED')     AS "matchedCount",
         COUNT(wi.id) FILTER (WHERE wi.reconciled_status = 'NOT_FOUND')   AS "notFoundCount",
         COUNT(wi.id) FILTER (WHERE wi.reconciled_status = 'NO_REGISTRA') AS "noRegistraCount",
         SUM(a.reference_value) FILTER (WHERE wi.asset_id IS NOT NULL)    AS "referenceValue"
       FROM writeoff_acts w
       LEFT JOIN writeoff_items wi ON wi.writeoff_act_id = w.id
       LEFT JOIN assets a ON a.id = wi.asset_id
       ${clause}
       GROUP BY w.id
       ORDER BY w.acta_number
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, filter.limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM writeoff_acts w ${clause}`,
      params,
    ),
  ])

  const total = Number(countRes.rows[0].total)
  return {
    data: rowsRes.rows,
    meta: { total, page: filter.page, limit: filter.limit, pages: Math.ceil(total / filter.limit) },
  }
}

// ── Single act with items ─────────────────────────────────────────────────────

export async function findById(id: number) {
  const { rows: acts } = await pool.query(
    `SELECT
       w.id, w.acta_number AS "actaNumber", w.date, w.building, w.reason,
       w.status, w.total_items AS "totalItems",
       w.authorized_by AS "authorizedBy", w.authorized_by_role AS "authorizedByRole",
       w.responsible, w.responsible_role AS "responsibleRole",
       w.notes, w.created_at AS "createdAt", w.updated_at AS "updatedAt"
     FROM writeoff_acts w
     WHERE w.id = $1`,
    [id],
  )
  if (!acts[0]) throw new NotFoundError('Acta de baja', id)

  const { rows: items } = await pool.query(
    `SELECT
       wi.id, wi.item_number AS "itemNumber",
       wi.plate_serial AS "plateSerial", wi.no_registra AS "noRegistra",
       wi.asset_id AS "assetId", wi.description, wi.asset_type AS "assetType",
       wi.brand_model AS "brandModel", wi.reconciled_status AS "reconciledStatus",
       -- Datos del activo conciliado (enriquecido)
       a.plate AS "assetPlate", a.name AS "assetName",
       a.brand AS "assetBrand", a.model AS "assetModel",
       a.reference_value::text AS "assetReferenceValue",
       a.status AS "assetCurrentStatus"
     FROM writeoff_items wi
     LEFT JOIN assets a ON a.id = wi.asset_id
     WHERE wi.writeoff_act_id = $1
     ORDER BY wi.item_number`,
    [id],
  )

  return { ...acts[0], items }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const [summary, byReason, byBuilding, reconciliation] = await Promise.all([
    pool.query<{ totalActs: string; totalItems: string; matchedItems: string; totalValue: string }>(
      `SELECT
         COUNT(DISTINCT w.id)::text                                              AS "totalActs",
         COUNT(wi.id)::text                                                      AS "totalItems",
         COUNT(wi.id) FILTER (WHERE wi.reconciled_status = 'MATCHED' OR a.id IS NOT NULL)::text AS "matchedItems",
         COALESCE(SUM(a.reference_value), 0)::text                              AS "totalValue"
       FROM writeoff_acts w
       LEFT JOIN writeoff_items wi ON wi.writeoff_act_id = w.id
       LEFT JOIN assets a ON (
         wi.asset_id = a.id OR 
         (wi.plate_serial IS NOT NULL AND (a.plate = wi.plate_serial OR a.serial = wi.plate_serial))
       )`,
    ),
    pool.query(
      `SELECT reason, COUNT(*) AS count
       FROM writeoff_acts
       GROUP BY reason ORDER BY count DESC`,
    ),
    pool.query(
      `SELECT building, COUNT(*) AS count
       FROM writeoff_acts
       WHERE building IS NOT NULL
       GROUP BY building ORDER BY count DESC`,
    ),
    pool.query(
      `SELECT reconciled_status AS status, COUNT(*)::int AS count
       FROM writeoff_items
       GROUP BY reconciled_status`,
    ),
  ])

  return {
    totalActs:     Number(summary.rows[0].totalActs),
    totalItems:    Number(summary.rows[0].totalItems),
    matchedItems:  Number(summary.rows[0].matchedItems),
    totalValue:    Number(summary.rows[0].totalValue),
    byReason:      byReason.rows,
    byBuilding:    byBuilding.rows,
    reconciliation: reconciliation.rows,
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function create(data: CreateWriteoffAct) {
  const [inserted] = await db
    .insert(writeoffActs)
    .values({
      actaNumber:       data.actaNumber,
      date:             data.date ?? null,
      building:         data.building ?? null,
      reason:           data.reason,
      status:           data.status ?? 'COMPLETADA',
      authorizedBy:     data.authorizedBy ?? null,
      authorizedByRole: data.authorizedByRole ?? null,
      responsible:      data.responsible ?? null,
      responsibleRole:  data.responsibleRole ?? null,
      notes:            data.notes ?? null,
    })
    .returning({ id: writeoffActs.id })

  return findById(inserted.id)
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function update(id: number, data: UpdateWriteoffAct) {
  await findById(id)

  await db
    .update(writeoffActs)
    .set({
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes  !== undefined && { notes:  data.notes }),
      updatedAt: new Date(),
    })
    .where(eq(writeoffActs.id, id))

  return findById(id)
}
