import { useState } from 'react'
import { Download, X, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { apiAssets } from '../../lib/api'
import type { FiltersState } from './AssetsPage'

const YEAR_OPTIONS = [
  { value: '', label: 'Todos los años' },
  ...(['2022', '2023', '2024', '2025', '2026'] as const).map(y => ({ value: y, label: y })),
]

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todo el año' },
  { value: 'q1',  label: 'Q1 — Enero a Marzo' },
  { value: 'q2',  label: 'Q2 — Abril a Junio' },
  { value: 'q3',  label: 'Q3 — Julio a Septiembre' },
  { value: 'q4',  label: 'Q4 — Octubre a Diciembre' },
]

function periodParams(year: string, period: string): Record<string, string | undefined> {
  if (!year || period === 'all') return {}
  const y = year
  const ranges: Record<string, [string, string]> = {
    q1: [`${y}-01-01`, `${y}-03-31`],
    q2: [`${y}-04-01`, `${y}-06-30`],
    q3: [`${y}-07-01`, `${y}-09-30`],
    q4: [`${y}-10-01`, `${y}-12-31`],
  }
  const [from, to] = ranges[period] ?? []
  return from ? { acquisitionFrom: from, acquisitionTo: to } : {}
}

interface Props {
  filters: FiltersState
  onClose: () => void
}

export default function ExportModal({ filters, onClose }: Props) {
  const [year,         setYear]         = useState('')
  const [period,       setPeriod]       = useState('all')
  const [applyFilters, setApplyFilters] = useState(false)
  const [isExporting,  setIsExporting]  = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleExport() {
    setIsExporting(true)
    setError(null)
    try {
      const baseParams: Record<string, string | number | undefined> = {
        limit: 200,
        ...(year ? { year: Number(year) } : {}),
        ...periodParams(year, period),
        ...(applyFilters ? {
          q:        filters.q        || undefined,
          building: filters.building || undefined,
          type:     filters.type     || undefined,
          status:   filters.status   || undefined,
          year:     year ? Number(year) : (filters.year ? Number(filters.year) : undefined),
        } : {}),
      }

      const first = await apiAssets.list({ ...baseParams, page: 1 })
      const allData = [...first.data]

      for (let page = 2; page <= first.meta.pages; page++) {
        const { data: pageData } = await apiAssets.list({ ...baseParams, page })
        allData.push(...pageData)
      }

      const data = allData

      const rows = data.map(a => ({
        'PLACA':                  a.plate          ?? '',
        'NOMBRE DEL ACTIVO':      a.name,
        'DESCRIPCIÓN DEL ACTIVO': a.description    ?? '',
        'TIPO DE ACTIVO':         a.assetTypeName  ?? '',
        'CUENTA CONTABLE':        a.pucAccount     ?? '',
        'MARCA':                  a.brand          ?? '',
        'MODELO':                 a.model          ?? '',
        'SERIAL':                 a.serial         ?? '',
        'EDIFICIO':               a.buildingName   ?? '',
        'PISO':                   a.floor          ?? '',
        'UBICACIÓN/ÁREA':         a.location       ?? '',
        'ÁREA RESPONSABLE':       a.areaName       ?? '',
        'CANTIDAD':               a.quantity,
        'VALOR DE REFERENCIA':    a.referenceValue != null ? parseFloat(a.referenceValue) : '',
        'FECHA INGRESO':          a.acquisitionDate
                                    ? new Date(a.acquisitionDate).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    : '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)

      ws['!cols'] = [
        { wch: 14 },  // PLACA
        { wch: 32 },  // NOMBRE DEL ACTIVO
        { wch: 42 },  // DESCRIPCIÓN DEL ACTIVO
        { wch: 32 },  // TIPO DE ACTIVO
        { wch: 16 },  // CUENTA CONTABLE
        { wch: 16 },  // MARCA
        { wch: 16 },  // MODELO
        { wch: 22 },  // SERIAL
        { wch: 16 },  // EDIFICIO
        { wch: 8  },  // PISO
        { wch: 38 },  // UBICACIÓN/ÁREA
        { wch: 22 },  // ÁREA RESPONSABLE
        { wch: 10 },  // CANTIDAD
        { wch: 20 },  // VALOR DE REFERENCIA
        { wch: 14 },  // FECHA INGRESO
      ]

      // Formato COP ($  #,##0) en todas las celdas de VALOR DE REFERENCIA (col M, índice 12)
      const sheetRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let r = 1; r <= sheetRange.e.r; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c: 13 })]
        if (cell && cell.t === 'n') cell.z = '"$"\ #,##0'
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activos')

      const periodSuffix = year && period !== 'all' ? `_${period.toUpperCase()}` : ''
      const suffix       = year ? `_${year}${periodSuffix}` : ''
      const date         = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `activos${suffix}_${date}.xlsx`)
      onClose()
    } catch {
      setError('Error al exportar. Verifica la conexión e intenta de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="
        w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5
        bg-white dark:bg-mi-800
        dark:shadow-[0_0_40px_rgba(10,2,44,0.5)]
        dark:border dark:border-mi-700/40
      ">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-mi-50">
            <Download size={16} />
            Exportar a Excel
          </h2>
          <button
            onClick={onClose}
            className="transition-colors text-gray-400 hover:text-gray-600 dark:text-mi-500 dark:hover:text-mi-200"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Controles */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-mi-400">
              Año de incorporación
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="
                w-full px-3 py-2 text-sm border rounded-lg transition-colors
                bg-white border-gray-300 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100
                dark:focus:ring-mi-400
              "
            >
              {YEAR_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {year && (
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-mi-400">
                Período
              </label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="
                  w-full px-3 py-2 text-sm border rounded-lg transition-colors
                  bg-white border-gray-300 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100
                  dark:focus:ring-mi-400
                "
              >
                {PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyFilters}
              onChange={e => setApplyFilters(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 dark:border-mi-600 dark:bg-mi-750 dark:accent-gold"
            />
            <span className="text-sm text-gray-700 dark:text-mi-200">
              Aplicar filtros activos de la tabla
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs rounded-lg px-3 py-2 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="
              flex-1 py-2 text-sm rounded-lg transition-colors
              border border-gray-300 text-gray-600 hover:bg-gray-50
              dark:border-mi-600 dark:text-mi-300 dark:hover:bg-mi-750
            "
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="
              flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              flex items-center justify-center gap-2
              disabled:opacity-60
              bg-emerald-600 hover:bg-emerald-700 text-white
              dark:bg-gold dark:hover:bg-gold-500 dark:text-mi-900 dark:font-semibold
            "
          >
            {isExporting ? (
              <><Loader2 size={14} className="animate-spin" /> Exportando…</>
            ) : (
              <><Download size={14} /> Descargar</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
