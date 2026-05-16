import { pool, db } from './client'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { pazYSalvoCases, pazYSalvoItems } from './schema'
import { NotFoundError, AppError } from '../../shared/errors'
import type {
  PazYSalvoFilter,
  PazYSalvoPeopleFilter,
  PazYSalvoItemInput,
  PazYSalvoStatus,
} from '@sigaf/shared'

// Estados "abiertos" — bloquean creación de un nuevo caso para la misma persona.
const OPEN_STATUSES: ReadonlyArray<PazYSalvoStatus> = [
  'FIRMA_SOLICITADA',
  'FIRMA_EN_PROCESO',
  'FIRMADA',
  'ERROR_FIRMA',
]

// ── Generación de acta_number (PYS-YYYY-NNN) ─────────────────────────────────

export async function generateActaNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM paz_y_salvo_cases
      WHERE acta_number LIKE $1`,
    [`PYS-${year}-%`],
  )
  const seq = String(Number(rows[0].count) + 1).padStart(3, '0')
  return `PYS-${year}-${seq}`
}

// ── Lista paginada de casos ──────────────────────────────────────────────────

export async function findMany(filter: PazYSalvoFilter) {
  const parts:  string[]  = []
  const params: unknown[] = []

  if (filter.q) {
    params.push(`%${filter.q}%`)
    parts.push(`(c.acta_number ILIKE $${params.length} OR cp.full_name ILIKE $${params.length} OR cp.identificacion ILIKE $${params.length})`)
  }
  if (filter.status) {
    params.push(filter.status)
    parts.push(`c.status = $${params.length}`)
  }
  if (filter.personId) {
    params.push(filter.personId)
    parts.push(`c.person_id = $${params.length}`)
  }

  const clause    = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  const offset    = (filter.page - 1) * filter.limit
  const limitIdx  = params.length + 1
  const offsetIdx = params.length + 2

  const [rowsRes, countRes] = await Promise.all([
    pool.query(
      `SELECT
         c.id, c.acta_number AS "actaNumber", c.status,
         c.motivo_terminacion AS "motivoTerminacion",
         c.contract_end_date  AS "contractEndDate",
         c.area_snapshot      AS "areaSnapshot",
         c.observaciones,
         c.docx_drive_url     AS "docxDriveUrl",
         c.pdf_drive_url      AS "pdfDriveUrl",
         c.signed_at          AS "signedAt",
         c.signed_by          AS "signedBy",
         c.created_at         AS "createdAt",
         c.updated_at         AS "updatedAt",
         c.person_id          AS "personId",
         cp.full_name         AS "personName",
         cp.identificacion    AS "personIdentificacion",
         cp.cargo             AS "personCargo",
         ca.name              AS "personArea",
         (SELECT COUNT(*)::int FROM paz_y_salvo_items WHERE case_id = c.id) AS "itemsCount"
       FROM paz_y_salvo_cases c
       JOIN catalog_people cp ON cp.id = c.person_id
       LEFT JOIN catalog_areas ca ON ca.id = cp.area_id
       ${clause}
       ORDER BY c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, filter.limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
         FROM paz_y_salvo_cases c
         JOIN catalog_people cp ON cp.id = c.person_id
         ${clause}`,
      params,
    ),
  ])

  const total = Number(countRes.rows[0].total)
  return {
    data: rowsRes.rows,
    meta: { total, page: filter.page, limit: filter.limit, pages: Math.ceil(total / filter.limit) },
  }
}

// ── Caso individual (con items + datos persona/área) ─────────────────────────

export async function findById(id: number) {
  const { rows: cases } = await pool.query(
    `SELECT
       c.id, c.acta_number AS "actaNumber", c.status,
       c.motivo_terminacion AS "motivoTerminacion",
       c.contract_end_date  AS "contractEndDate",
       c.area_snapshot      AS "areaSnapshot",
       c.observaciones,
       c.docx_drive_url     AS "docxDriveUrl",
       c.pdf_drive_url      AS "pdfDriveUrl",
       c.n8n_event_id       AS "n8nEventId",
       c.n8n_webhook_sent_at AS "n8nWebhookSentAt",
       c.n8n_notified       AS "n8nNotified",
       c.n8n_error          AS "n8nError",
       c.signed_at          AS "signedAt",
       c.signed_by          AS "signedBy",
       c.created_by         AS "createdBy",
       c.notes,
       c.created_at         AS "createdAt",
       c.updated_at         AS "updatedAt",
       c.person_id          AS "personId",
       cp.full_name         AS "personName",
       cp.identificacion    AS "personIdentificacion",
       cp.cargo             AS "personCargo",
       cp.email             AS "personEmail",
       cp.contract_start_date AS "personContractStart",
       cp.contract_end_date   AS "personContractEnd",
       ca.id                AS "personAreaId",
       ca.name              AS "personArea"
     FROM paz_y_salvo_cases c
     JOIN catalog_people cp ON cp.id = c.person_id
     LEFT JOIN catalog_areas ca ON ca.id = cp.area_id
     WHERE c.id = $1`,
    [id],
  )
  if (!cases[0]) throw new NotFoundError('Caso Paz y Salvo', id)

  const { rows: items } = await pool.query(
    `SELECT
       i.id, i.item_number AS "itemNumber",
       i.asset_id  AS "assetId",
       i.plate_raw AS "plateRaw",
       i.name_raw  AS "nameRaw",
       i.estado_fisico AS "estadoFisico",
       i.notes,
       i.created_at AS "createdAt",
       -- enriquecimiento opcional cuando hay assetId real
       a.plate    AS "assetPlate",
       a.name     AS "assetName"
     FROM paz_y_salvo_items i
     LEFT JOIN assets a ON a.id = i.asset_id
     WHERE i.case_id = $1
     ORDER BY i.item_number`,
    [id],
  )

  return { ...cases[0], items }
}

// ── Verificar caso activo abierto para una persona ───────────────────────────

export async function findActiveCaseByPerson(personId: number) {
  const rows = await db
    .select({ id: pazYSalvoCases.id, status: pazYSalvoCases.status, actaNumber: pazYSalvoCases.actaNumber })
    .from(pazYSalvoCases)
    .where(and(
      eq(pazYSalvoCases.personId, personId),
      inArray(pazYSalvoCases.status, OPEN_STATUSES as unknown as string[]),
    ))
    .limit(1)
  return rows[0] ?? null
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const [summary, byStatus, proximos] = await Promise.all([
    pool.query<{ total: string; firmados: string; pendientes: string }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE status IN ('FIRMADA','COMPLETADA'))::text AS firmados,
         COUNT(*) FILTER (WHERE status IN ('FIRMA_SOLICITADA','FIRMA_EN_PROCESO','ERROR_FIRMA'))::text AS pendientes
       FROM paz_y_salvo_cases`,
    ),
    pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count
         FROM paz_y_salvo_cases
        GROUP BY status`,
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM catalog_people
        WHERE contract_end_date IS NOT NULL
          AND contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          AND active = true
          AND NOT EXISTS (
            SELECT 1 FROM paz_y_salvo_cases c
             WHERE c.person_id = catalog_people.id
               AND c.status IN ('FIRMADA','COMPLETADA')
          )`,
    ),
  ])

  return {
    total:           Number(summary.rows[0].total),
    firmados:        Number(summary.rows[0].firmados),
    pendientes:      Number(summary.rows[0].pendientes),
    proximosAVencer: Number(proximos.rows[0].count),
    byStatus:        byStatus.rows.map((r) => ({ status: r.status, count: Number(r.count) })),
  }
}

// ── Lista funcionarios + estado P&S (entry view del frontend) ────────────────

export async function findPeopleWithStatus(filter: PazYSalvoPeopleFilter) {
  const parts:  string[]  = ['cp.identificacion IS NOT NULL']
  const params: unknown[] = []

  if (filter.q) {
    params.push(`%${filter.q}%`)
    parts.push(`(cp.full_name ILIKE $${params.length} OR cp.identificacion ILIKE $${params.length} OR cp.cargo ILIKE $${params.length})`)
  }
  if (filter.soloActivos) {
    parts.push(`cp.active = true`)
  }
  if (filter.proxVencimiento) {
    parts.push(`cp.contract_end_date IS NOT NULL`)
    parts.push(`cp.contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`)
  }

  const clause    = `WHERE ${parts.join(' AND ')}`
  const offset    = (filter.page - 1) * filter.limit
  const limitIdx  = params.length + 1
  const offsetIdx = params.length + 2

  const [rowsRes, countRes] = await Promise.all([
    pool.query(
      `SELECT
         cp.id, cp.full_name AS "fullName", cp.identificacion, cp.cargo,
         cp.email, cp.active,
         cp.contract_start_date AS "contractStartDate",
         cp.contract_end_date   AS "contractEndDate",
         ca.id   AS "areaId",
         ca.name AS "areaName",
         latest.id           AS "latestCaseId",
         latest.acta_number  AS "latestActaNumber",
         latest.status       AS "latestStatus",
         latest.created_at   AS "latestCreatedAt",
         latest.signed_at    AS "latestSignedAt"
       FROM catalog_people cp
       LEFT JOIN catalog_areas ca ON ca.id = cp.area_id
       LEFT JOIN LATERAL (
         SELECT id, acta_number, status, created_at, signed_at
           FROM paz_y_salvo_cases
          WHERE person_id = cp.id
          ORDER BY created_at DESC
          LIMIT 1
       ) latest ON true
       ${clause}
       ORDER BY
         -- Próximos a vencer primero, luego por nombre
         CASE WHEN cp.contract_end_date IS NOT NULL
              AND cp.contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
              THEN 0 ELSE 1 END,
         cp.contract_end_date NULLS LAST,
         cp.full_name
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, filter.limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM catalog_people cp ${clause}`,
      params,
    ),
  ])

  const total = Number(countRes.rows[0].total)
  return {
    data: rowsRes.rows,
    meta: { total, page: filter.page, limit: filter.limit, pages: Math.ceil(total / filter.limit) },
  }
}

// ── Crear caso + items (transacción única) ───────────────────────────────────

export interface CreatePazYSalvoInput {
  personId:          number
  motivoTerminacion: string
  observaciones?:    string
  items:             PazYSalvoItemInput[]
  // Snapshots
  contractEndDate?:  string | null
  areaSnapshot?:     string | null
  // Estado inicial
  initialStatus?:    PazYSalvoStatus
}

export async function createWithItems(input: CreatePazYSalvoInput, createdBy: number | null) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const actaNumber = await generateActaNumber()

    const insertCase = await client.query<{ id: number }>(
      `INSERT INTO paz_y_salvo_cases
         (person_id, acta_number, status, motivo_terminacion,
          contract_end_date, area_snapshot, observaciones, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.personId,
        actaNumber,
        input.initialStatus ?? 'FIRMA_SOLICITADA',
        input.motivoTerminacion,
        input.contractEndDate ?? null,
        input.areaSnapshot ?? null,
        input.observaciones ?? null,
        createdBy,
      ],
    )
    const caseId = insertCase.rows[0].id

    // Insert bulk de items con item_number normalizado (1..n)
    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i]
      await client.query(
        `INSERT INTO paz_y_salvo_items
           (case_id, item_number, plate_raw, name_raw, estado_fisico, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          caseId,
          i + 1,                              // normalizamos, ignoramos itemNumber del payload
          it.plateRaw ?? null,
          it.nameRaw,
          it.estadoFisico ?? 'BUENO',
          it.notes ?? null,
        ],
      )
    }

    await client.query('COMMIT')
    return findById(caseId)
  } catch (err) {
    await client.query('ROLLBACK')
    if (err instanceof AppError) throw err
    throw new AppError(500, `Error al crear paz y salvo: ${(err as Error).message}`, 'DB_ERROR')
  } finally {
    client.release()
  }
}

// ── Actualizar caso (status, observaciones, notes) ───────────────────────────

export async function update(id: number, data: {
  status?:        PazYSalvoStatus
  observaciones?: string
  notes?:         string
}) {
  await findById(id)

  await db
    .update(pazYSalvoCases)
    .set({
      ...(data.status        !== undefined && { status:        data.status }),
      ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
      ...(data.notes         !== undefined && { notes:         data.notes }),
      updatedAt: new Date(),
    })
    .where(eq(pazYSalvoCases.id, id))

  return findById(id)
}

// ── Marcar webhook n8n enviado (transacción de creación + dispatch) ──────────

export async function markN8nDispatched(id: number, eventId: string) {
  await db
    .update(pazYSalvoCases)
    .set({
      n8nEventId:       eventId,
      n8nWebhookSentAt: new Date(),
      n8nNotified:      true,
      updatedAt:        new Date(),
    })
    .where(eq(pazYSalvoCases.id, id))
}

// ── Marcar error de webhook n8n (para retry manual) ──────────────────────────

export async function markN8nError(id: number, errorMessage: string) {
  await db
    .update(pazYSalvoCases)
    .set({
      n8nError:  errorMessage,
      status:    'ERROR_FIRMA',
      updatedAt: new Date(),
    })
    .where(eq(pazYSalvoCases.id, id))
}

// ── Buscar por eventId (idempotencia del callback n8n) ───────────────────────

export async function findByEventId(eventId: string) {
  const rows = await db
    .select()
    .from(pazYSalvoCases)
    .where(eq(pazYSalvoCases.n8nEventId, eventId))
    .limit(1)
  return rows[0] ?? null
}

// ── Aplicar resultado de firma desde n8n ─────────────────────────────────────

export async function applySignatureResult(id: number, data: {
  status:               PazYSalvoStatus
  signedBy?:            string
  signedGoogleDocUrl?:  string
  signedPdfDriveUrl?:   string
  error?:               string | null
}) {
  await db
    .update(pazYSalvoCases)
    .set({
      status:       data.status,
      ...(data.signedBy           && { signedBy:     data.signedBy }),
      ...(data.signedGoogleDocUrl && { docxDriveUrl: data.signedGoogleDocUrl }),
      ...(data.signedPdfDriveUrl  && { pdfDriveUrl:  data.signedPdfDriveUrl }),
      ...(data.error              && { n8nError:     data.error }),
      ...(data.status === 'FIRMADA' || data.status === 'COMPLETADA'
        ? { signedAt: new Date() }
        : {}),
      updatedAt:    new Date(),
    })
    .where(eq(pazYSalvoCases.id, id))
  return findById(id)
}

// Helper para uso en tests / scripts: contar items de un caso.
export async function countItems(caseId: number): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM paz_y_salvo_items WHERE case_id = $1`,
    [caseId],
  )
  return Number(rows[0].count)
}

// Forzar tree-shaking-safe export (silencia unused-import warning de sql)
void sql
