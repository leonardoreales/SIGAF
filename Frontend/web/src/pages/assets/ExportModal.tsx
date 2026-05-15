import { useState } from 'react'
import { Download, X, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { apiAssets } from '../../lib/api'
import type { Asset } from '../../lib/api'
import type { FiltersState } from './AssetsPage'

const YEAR_OPTIONS = [
  { value: '', label: 'Todos los años' },
  ...(['2022', '2023', '2024', '2025', '2026'] as const).map(y => ({ value: y, label: y })),
]

const MONTHS = [
  { value: '1',  short: 'Ene', label: 'Enero' },
  { value: '2',  short: 'Feb', label: 'Febrero' },
  { value: '3',  short: 'Mar', label: 'Marzo' },
  { value: '4',  short: 'Abr', label: 'Abril' },
  { value: '5',  short: 'May', label: 'Mayo' },
  { value: '6',  short: 'Jun', label: 'Junio' },
  { value: '7',  short: 'Jul', label: 'Julio' },
  { value: '8',  short: 'Ago', label: 'Agosto' },
  { value: '9',  short: 'Sep', label: 'Septiembre' },
  { value: '10', short: 'Oct', label: 'Octubre' },
  { value: '11', short: 'Nov', label: 'Noviembre' },
  { value: '12', short: 'Dic', label: 'Diciembre' },
]

function monthRange(year: string, month: string) {
  const m    = Number(month)
  const last = new Date(Number(year), m, 0).getDate()
  const mm   = String(m).padStart(2, '0')
  return {
    acquisitionFrom: `${year}-${mm}-01`,
    acquisitionTo:   `${year}-${mm}-${String(last).padStart(2, '0')}`,
  }
}

interface Props {
  filters: FiltersState
  onClose: () => void
}

export default function ExportModal({ filters, onClose }: Props) {
  const [year,           setYear]           = useState('')
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set())
  const [applyFilters,   setApplyFilters]   = useState(false)
  const [isExporting,    setIsExporting]    = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  function toggleMonth(v: string) {
    setSelectedMonths(prev => {
      const next = new Set(prev)
      next.has(v) ? next.delete(v) : next.add(v)
      return next
    })
  }

  function toggleAll() {
    setSelectedMonths(prev =>
      prev.size === 12 ? new Set() : new Set(MONTHS.map(m => m.value))
    )
  }

  async function fetchAllPages(
    params: Record<string, string | number | undefined>
  ): Promise<Asset[]> {
    const first = await apiAssets.list({ ...params, page: 1 })
    const all   = [...first.data]
    for (let page = 2; page <= first.meta.pages; page++) {
      const { data } = await apiAssets.list({ ...params, page })
      all.push(...data)
    }
    return all
  }

  async function handleExport() {
    setIsExporting(true)
    setError(null)
    try {
      const baseParams: Record<string, string | number | undefined> = {
        limit: 200,
        ...(year ? { year: Number(year) } : {}),
        ...(applyFilters ? {
          q:        filters.q        || undefined,
          building: filters.building || undefined,
          type:     filters.type     || undefined,
          status:   filters.status   || undefined,
          year:     year ? Number(year) : (filters.year ? Number(filters.year) : undefined),
        } : {}),
      }

      let data: Asset[]

      if (year && selectedMonths.size > 0) {
        const seen   = new Set<number>()
        data         = []
        const sorted = Array.from(selectedMonths).sort((a, b) => Number(a) - Number(b))
        for (const m of sorted) {
          const assets = await fetchAllPages({ ...baseParams, ...monthRange(year, m) })
          for (const a of assets) {
            if (!seen.has(a.id)) { seen.add(a.id); data.push(a) }
          }
        }
      } else {
        data = await fetchAllPages(baseParams)
      }

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
        { wch: 14 }, { wch: 32 }, { wch: 42 }, { wch: 32 }, { wch: 16 },
        { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 8  },
        { wch: 38 }, { wch: 22 }, { wch: 10 }, { wch: 20 }, { wch: 14 },
      ]
      const sheetRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let r = 1; r <= sheetRange.e.r; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c: 13 })]
        if (cell && cell.t === 'n') cell.z = '"$"\ #,##0'
      }

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activos')

      // Filename suffix
      let suffix = year ? `_${year}` : ''
      if (year && selectedMonths.size > 0) {
        const sorted = Array.from(selectedMonths).sort((a, b) => Number(a) - Number(b))
        suffix += sorted.length === 1
          ? `_${MONTHS.find(m => m.value === sorted[0])?.label ?? sorted[0]}`
          : `_${sorted.map(v => MONTHS.find(m => m.value === v)?.short ?? v).join('+')}`
      }
      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `activos${suffix}_${date}.xlsx`)
      onClose()
    } catch {
      setError('Error al exportar. Verifica la conexión e intenta de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const allSelected = selectedMonths.size === 12

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

          {/* Año */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-mi-400">
              Año de incorporación
            </label>
            <select
              value={year}
              onChange={e => { setYear(e.target.value); setSelectedMonths(new Set()) }}
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

          {/* Meses — solo cuando hay año seleccionado */}
          {year && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600 dark:text-mi-400">
                  Meses
                  {selectedMonths.size > 0 && (
                    <span className="ml-1.5 text-emerald-600 dark:text-gold font-semibold">
                      ({selectedMonths.size} sel.)
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-gray-500 dark:text-mi-400 hover:text-gray-700 dark:hover:text-mi-200 underline underline-offset-2"
                >
                  {allSelected ? 'Ninguno' : 'Todos'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map(m => {
                  const checked = selectedMonths.has(m.value)
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => toggleMonth(m.value)}
                      title={m.label}
                      className={`
                        py-1.5 text-xs font-medium rounded-md transition-all select-none
                        ${checked
                          ? 'bg-emerald-600 text-white ring-1 ring-emerald-500 dark:bg-gold dark:text-mi-900 dark:ring-gold/60'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-mi-700 dark:text-mi-300 dark:hover:bg-mi-650'
                        }
                      `}
                    >
                      {m.short}
                    </button>
                  )
                })}
              </div>

              {selectedMonths.size === 0 && (
                <p className="text-xs text-gray-400 dark:text-mi-500 mt-1.5">
                  Sin selección = exporta todo el año
                </p>
              )}
            </div>
          )}

          {/* Aplicar filtros */}
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
