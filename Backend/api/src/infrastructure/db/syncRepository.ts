import { pool } from './client'
import type { SyncEvent, SyncNotifyPayload } from '../../domain/sync/SyncEvent'

interface SyncRow {
  id:               number
  source_sheet:     string
  insertados:       number
  fallidos:         number
  placas_generadas: unknown
  created_at:       Date | string
}

function toSyncEvent(row: SyncRow): SyncEvent {
  const placas = row.placas_generadas
  return {
    id:              row.id,
    sourceSheet:     row.source_sheet,
    insertados:      Number(row.insertados),
    fallidos:        Number(row.fallidos),
    placasGeneradas: Array.isArray(placas) ? placas as string[] : JSON.parse(String(placas ?? '[]')),
    createdAt:       row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  }
}

export async function createSyncEvent(payload: SyncNotifyPayload): Promise<SyncEvent> {
  const { rows } = await pool.query<SyncRow>(
    `INSERT INTO sync_log (source_sheet, insertados, fallidos, placas_generadas)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, source_sheet, insertados, fallidos, placas_generadas, created_at`,
    [payload.source_sheet, payload.insertados, payload.fallidos, JSON.stringify(payload.placas_generadas)],
  )
  return toSyncEvent(rows[0])
}

export async function getLastSyncEvent(): Promise<SyncEvent | null> {
  const { rows } = await pool.query<SyncRow>(
    `SELECT id, source_sheet, insertados, fallidos, placas_generadas, created_at
     FROM sync_log
     ORDER BY created_at DESC
     LIMIT 1`,
  )
  return rows[0] ? toSyncEvent(rows[0]) : null
}
