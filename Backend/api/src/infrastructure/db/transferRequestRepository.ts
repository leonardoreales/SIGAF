import { eq } from 'drizzle-orm'
import { db, pool } from './client'
import { transferRequests, transferRequestItems } from './schema'
import { NotFoundError } from '../../shared/errors'
import type {
  CreateTransferRequest,
  UpdateTransferRequest,
  TransferRequestFilter,
} from '@sigaf/shared'

// ── Raw-SQL select ─────────────────────────────────────────────────────────────

const SELECT_REQUEST = `
  SELECT
    r.id,
    r.request_number          AS "requestNumber",
    r.subject,
    r.sender_email            AS "senderEmail",
    r.received_at             AS "receivedAt",
    r.raw_text                AS "rawText",
    r.docx_drive_url          AS "docxDriveUrl",
    r.form_data               AS "formData",
    r.status,
    r.auto_signed             AS "autoSigned",
    r.signature_entrega       AS "signatureEntrega",
    r.signature_recibe        AS "signatureRecibe",
    r.signature_autoriza      AS "signatureAutoriza",
    r.signed_at               AS "signedAt",
    r.signed_by               AS "signedBy",
    r.notes,
    r.n8n_webhook_sent_at     AS "n8nWebhookSentAt",
    r.created_at              AS "createdAt",
    r.updated_at              AS "updatedAt",
    COUNT(i.id)::int                                           AS "itemsCount",
    COUNT(i.id) FILTER (WHERE i.matched = true)::int          AS "itemsMatched"
  FROM transfer_requests r
  LEFT JOIN transfer_request_items i ON i.request_id = r.id
`

const SELECT_ITEMS = `
  SELECT
    i.id,
    i.request_id    AS "requestId",
    i.asset_id      AS "assetId",
    a.plate         AS "assetPlate",
    a.name          AS "assetName",
    i.plate_raw     AS "plateRaw",
    i.name_raw      AS "nameRaw",
    i.serial_raw    AS "serialRaw",
    i.quantity,
    i.matched,
    i.transfer_id   AS "transferId",
    i.status,
    i.notes
  FROM transfer_request_items i
  LEFT JOIN assets a ON a.id = i.asset_id
  WHERE i.request_id = $1
  ORDER BY i.id
`

// ── Helpers ────────────────────────────────────────────────────────────────────

async function generateRequestNumber(): Promise<string> {
  const now = new Date()
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { rows } = await pool.query<{ n: string }>(
    `SELECT LPAD((COUNT(*) + 1)::text, 4, '0') AS n
       FROM transfer_requests
      WHERE request_number LIKE $1`,
    [`SOL-${ym}-%`],
  )
  return `SOL-${ym}-${rows[0].n}`
}

function buildWhere(filter: TransferRequestFilter): string {
  const parts: string[] = []
  if (filter.q) {
    parts.push(
      `(r.request_number ILIKE '%${filter.q}%' OR r.sender_email ILIKE '%${filter.q}%' OR r.subject ILIKE '%${filter.q}%')`
    )
  }
  if (filter.status) parts.push(`r.status = '${filter.status}'`)
  return parts.length ? `WHERE ${parts.join(' AND ')}` : ''
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function findMany(filter: TransferRequestFilter) {
  const where  = buildWhere(filter)
  const offset = (filter.page - 1) * filter.limit

  const [rowsRes, countRes] = await Promise.all([
    pool.query(
      `${SELECT_REQUEST} ${where} GROUP BY r.id ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [filter.limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(DISTINCT r.id) AS total FROM transfer_requests r ${where}`,
    ),
  ])

  const total = Number(countRes.rows[0].total)
  return {
    data: rowsRes.rows,
    meta: { total, page: filter.page, limit: filter.limit, pages: Math.ceil(total / filter.limit) },
  }
}

export async function findById(id: number) {
  const { rows: reqRows } = await pool.query(
    `${SELECT_REQUEST} WHERE r.id = $1 GROUP BY r.id`,
    [id],
  )
  if (!reqRows[0]) throw new NotFoundError('Solicitud de traslado', id)

  const { rows: items } = await pool.query(SELECT_ITEMS, [id])

  return { ...reqRows[0], items }
}

export async function create(data: CreateTransferRequest) {
  const requestNumber = await generateRequestNumber()

  // Lógica de auto-firma: todos los items presentes + campos requeridos + 3 firmas
  const hasItems         = data.items && data.items.length > 0
  const hasRequiredFields = !!(data.formData?.solicitante && data.formData?.dependencia)
  const hasAllSignatures  = !!(
    data.signatures?.entrega &&
    data.signatures?.recibe  &&
    data.signatures?.autoriza
  )
  const autoSign = hasItems && hasRequiredFields && hasAllSignatures
  const status   = autoSign ? 'FIRMADA' : 'RECIBIDA'

  const [inserted] = await db
    .insert(transferRequests)
    .values({
      requestNumber,
      subject:           data.subject,
      senderEmail:       data.senderEmail,
      receivedAt:        data.receivedAt ? new Date(data.receivedAt) : new Date(),
      rawText:           data.rawText,
      docxDriveUrl:      data.docxDriveUrl,
      formData:          data.formData ?? {},
      status,
      autoSigned:        autoSign,
      signatureEntrega:  data.signatures?.entrega  ?? undefined,
      signatureRecibe:   data.signatures?.recibe   ?? undefined,
      signatureAutoriza: data.signatures?.autoriza ?? undefined,
      signedAt:          autoSign ? new Date() : undefined,
      signedBy:          autoSign ? 'n8n-auto' : undefined,
    })
    .returning({ id: transferRequests.id })

  // Insertar ítems y resolver matching por placa
  for (const item of data.items ?? []) {
    let assetId:    number | null = null
    let matched                   = false
    let itemStatus                = 'PENDIENTE'

    if (item.plateRaw?.trim()) {
      const { rows } = await pool.query<{ id: number }>(
        `SELECT id FROM assets WHERE plate = $1 LIMIT 1`,
        [item.plateRaw.trim()],
      )
      if (rows[0]) {
        assetId    = rows[0].id
        matched    = true
        itemStatus = 'EMPAREJADO'
      }
    }

    await db.insert(transferRequestItems).values({
      requestId: inserted.id,
      assetId:   assetId ?? undefined,
      plateRaw:  item.plateRaw,
      nameRaw:   item.nameRaw,
      serialRaw: item.serialRaw,
      quantity:  item.quantity ?? 1,
      matched,
      status:    itemStatus,
    })
  }

  return findById(inserted.id)
}

export async function update(id: number, data: UpdateTransferRequest) {
  await findById(id)

  const now = new Date()
  const values: Partial<typeof transferRequests.$inferInsert> = {}

  if (data.status            !== undefined) values.status           = data.status
  if (data.notes             !== undefined) values.notes            = data.notes
  if (data.signatureEntrega  !== undefined) values.signatureEntrega = data.signatureEntrega
  if (data.signatureRecibe   !== undefined) values.signatureRecibe  = data.signatureRecibe
  if (data.signatureAutoriza !== undefined) values.signatureAutoriza = data.signatureAutoriza
  if (data.signedBy          !== undefined) values.signedBy         = data.signedBy

  // Al firmar, registrar la fecha si no estaba ya
  if (data.status === 'FIRMADA' && data.signatureEntrega && data.signatureRecibe && data.signatureAutoriza) {
    values.signedAt = now
  }

  await db.update(transferRequests).set(values).where(eq(transferRequests.id, id))
  return findById(id)
}

export interface TransferRequestStatsResult {
  total:     number
  recibida:  number
  revision:  number
  aprobada:  number
  firmada:   number
  rechazada: number
}

export async function getStats(): Promise<TransferRequestStatsResult> {
  const { rows } = await pool.query<{
    total: string; recibida: string; revision: string;
    aprobada: string; firmada: string; rechazada: string
  }>(`
    SELECT
      COUNT(*)::int                                                AS total,
      COUNT(*) FILTER (WHERE status = 'RECIBIDA')::int            AS recibida,
      COUNT(*) FILTER (WHERE status = 'REVISION')::int            AS revision,
      COUNT(*) FILTER (WHERE status = 'APROBADA')::int            AS aprobada,
      COUNT(*) FILTER (WHERE status = 'FIRMADA')::int             AS firmada,
      COUNT(*) FILTER (WHERE status = 'RECHAZADA')::int           AS rechazada
    FROM transfer_requests
  `)
  const r = rows[0]
  return {
    total:     Number(r.total),
    recibida:  Number(r.recibida),
    revision:  Number(r.revision),
    aprobada:  Number(r.aprobada),
    firmada:   Number(r.firmada),
    rechazada: Number(r.rechazada),
  }
}
