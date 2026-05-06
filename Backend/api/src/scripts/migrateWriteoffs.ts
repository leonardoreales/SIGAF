import 'dotenv/config'
import path from 'path'
import * as XLSX from 'xlsx'
import { pool } from '../infrastructure/db/client'

const EXCEL_PATH = process.argv[2]
  ?? path.join(__dirname, '../../../../', 'ACTA BAJA DE ACTIVOS (1).xlsx')

const REASON_MAP: Record<string, string> = {
  'OBSOLESCENCIA':           'OBSOLESCENCIA',
  'DAÑO':                    'DAÑO',
  'DETERIORO DEL MOBILIARIO':'DETERIORO_MOBILIARIO',
  'CAMBIO DE MOBILIARIO':    'CAMBIO_MOBILIARIO',
  'REEMPLAZO DE MOBILIARIO': 'REEMPLAZO_MOBILIARIO',
  'VENTA DE VEHÍCULOS':      'VENTA_VEHICULOS',
  'DESUSO':                  'DESUSO',
  'BAJA':                    'BAJA',
}

function clean(val: unknown): string {
  return val == null ? '' : String(val).trim()
}

function normalizeReason(raw: string): string {
  return REASON_MAP[raw.toUpperCase()] ?? raw.toUpperCase()
}

function parseDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().split('T')[0]
  const d = new Date(String(val).trim())
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

interface ExcelRow {
  actaId: string; itemNum: number; date: unknown
  authorizedBy: string; authorizedByRole: string
  building: string; reason: string
  responsible: string; responsibleRole: string
  description: string; assetType: string
  plateSerial: string; brandModel: string
}

async function run() {
  console.log('=== MIGRACIÓN BAJAS DE ACTIVOS ===\n')

  const wb = XLSX.readFile(EXCEL_PATH, { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][]

  // Fila 0: título, Fila 1: headers, Fila 2+: datos
  const dataRows = raw.slice(2).filter(r => r[0] != null) as unknown[][]
  console.log(`Filas Excel:   ${dataRows.length}`)

  const rows: ExcelRow[] = dataRows.map(r => ({
    actaId:          clean(r[0]),
    itemNum:         Number(r[1]) || 0,
    date:            r[2],
    authorizedBy:    clean(r[3]),
    authorizedByRole:clean(r[4]),
    building:        clean(r[5]),
    reason:          normalizeReason(clean(r[6])),
    responsible:     clean(r[7]),
    responsibleRole: clean(r[8]),
    description:     clean(r[9]),
    assetType:       clean(r[10]).toUpperCase().replace(/\s+/g, ' ').replace(/\s+$/, ''),
    plateSerial:     clean(r[11]),
    brandModel:      clean(r[12]),
  }))

  // Agrupar por acta
  const actaMap = new Map<string, ExcelRow[]>()
  for (const row of rows) {
    if (!actaMap.has(row.actaId)) actaMap.set(row.actaId, [])
    actaMap.get(row.actaId)!.push(row)
  }
  console.log(`Actas únicas:  ${actaMap.size}\n`)

  // Guardia: abortar si ya hay datos
  const { rows: existing } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM writeoff_acts')
  if (Number(existing[0].count) > 0) {
    console.log('⚠️  writeoff_acts ya tiene datos. Abortando para no duplicar.')
    console.log('   Para re-migrar: TRUNCATE writeoff_acts CASCADE;')
    await pool.end(); return
  }

  // Cargar inventario de assets para conciliación
  const { rows: assetRows } = await pool.query<{
    id: number; plate: string | null; serial: string | null; brand: string | null; model: string | null
  }>('SELECT id, plate, serial, brand, model FROM assets')

  const plateMap  = new Map<string, number>()
  const serialMap = new Map<string, number>()
  const bMMap     = new Map<number, string>()

  for (const a of assetRows) {
    if (a.plate?.trim())  plateMap.set(a.plate.trim().toUpperCase(), a.id)
    if (a.serial?.trim()) serialMap.set(a.serial.trim().toUpperCase(), a.id)
    const bm = [a.brand, a.model].filter(Boolean).join(' ').trim()
    if (bm) bMMap.set(a.id, bm)
  }
  console.log(`Assets cargados: ${assetRows.length} (${plateMap.size} con placa, ${serialMap.size} con serial)\n`)

  const stats = { matched: 0, notFound: 0, noRegistra: 0, empty: 0 }
  const matchedIds = new Set<number>()

  for (const [actaId, items] of actaMap) {
    const first = items[0]

    const { rows: actRes } = await pool.query<{ id: number }>(
      `INSERT INTO writeoff_acts
         (acta_number, date, building, reason, status,
          authorized_by, authorized_by_role, responsible, responsible_role, total_items)
       VALUES ($1,$2,$3,$4,'COMPLETADA',$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        actaId,
        parseDate(first.date),
        first.building || null,
        first.reason || 'BAJA',
        first.authorizedBy || null,
        first.authorizedByRole || null,
        first.responsible || null,
        first.responsibleRole || null,
        items.length,
      ],
    )
    const actDbId = actRes[0].id

    for (const item of items) {
      const ps         = item.plateSerial.toUpperCase()
      const isEmpty    = !item.plateSerial
      const isNoReg    = ps === 'NO REGISTRA'

      let assetId: number | null       = null
      let reconciled                   = 'NOT_FOUND'
      let brandModel                   = item.brandModel

      if (isEmpty) {
        reconciled = 'EMPTY'; stats.empty++
      } else if (isNoReg) {
        reconciled = 'NO_REGISTRA'; stats.noRegistra++
      } else {
        assetId = plateMap.get(ps) ?? serialMap.get(ps) ?? null
        if (assetId) {
          reconciled = 'MATCHED'; stats.matched++; matchedIds.add(assetId)
          // Enriquecer marca/modelo desde inventario si Excel trae N/A
          const naValues = ['N/A', 'NA', 'NO REGISTRA', '']
          if (naValues.includes(brandModel.toUpperCase())) {
            brandModel = bMMap.get(assetId) ?? brandModel
          }
        } else {
          reconciled = 'NOT_FOUND'; stats.notFound++
        }
      }

      await pool.query(
        `INSERT INTO writeoff_items
           (writeoff_act_id, item_number, plate_serial, no_registra, asset_id,
            description, asset_type, brand_model, reconciled_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          actDbId, item.itemNum,
          isEmpty ? null : item.plateSerial,
          isNoReg || isEmpty,
          assetId,
          item.description || null,
          item.assetType   || null,
          brandModel       || null,
          reconciled,
        ],
      )
    }

    console.log(`  ✓ ${actaId.padEnd(10)} → ${String(items.length).padStart(3)} ítems`)
  }

  // Actualizar assets conciliados a BAJA
  if (matchedIds.size > 0) {
    await pool.query(
      `UPDATE assets SET status = 'BAJA', updated_at = NOW() WHERE id = ANY($1::int[])`,
      [Array.from(matchedIds)],
    )
  }

  console.log('\n════════════ RESUMEN ════════════')
  console.log(`Total ítems:   ${rows.length}`)
  console.log(`  MATCHED:     ${stats.matched}  → assets actualizados a BAJA`)
  console.log(`  NOT_FOUND:   ${stats.notFound} → placa no existe en inventario`)
  console.log(`  NO_REGISTRA: ${stats.noRegistra} → sin placa, registrado como histórico`)
  console.log(`  EMPTY:       ${stats.empty}  → fila sin placa ni "NO REGISTRA"`)
  console.log('═════════════════════════════════\n')

  await pool.end()
  console.log('✅ Migración completada.\n')
}

run().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
