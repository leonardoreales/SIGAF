import { useState } from 'react'
import { Download, X, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { apiAssets } from '../../lib/api'
import type { FiltersState } from './AssetsPage'

const YEAR_OPTIONS = [
  { value: '', label: 'Todos los años' },
  ...(['2022', '2023', '2024', '2025', '2026'] as const).map(y => ({ value: y, label: y })),
]

interface Props {
  filters: FiltersState
  onClose: () => void
}

export default function ExportModal({ filters, onClose }: Props) {
  const [year,         setYear]         = useState('')
  const [applyFilters, setApplyFilters] = useState(false)
  const [isExporting,  setIsExporting]  = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleExport() {
    setIsExporting(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = {
        limit: 9999,
        page:  1,
        ...(year ? { year: Number(year) } : {}),
        ...(applyFilters ? {
          q:        filters.q        || undefined,
          building: filters.building || undefined,
          type:     filters.type     || undefined,
          status:   filters.status   || undefined,
          year:     year ? Number(year) : (filters.year ? Number(filters.year) : undefined),
        } : {}),
      }

      const { data } = await apiAssets.list(params)

      const rows = data.map(a => ({
        'Plaqueta':           a.plate              ?? '',
        'Nombre':             a.name,
        'Tipo':               a.assetTypeName       ?? '',
        'Cuenta PUC':         a.pucAccount          ?? '',
        'Marca':              a.brand               ?? '',
        'Modelo':             a.model               ?? '',
        'Serial':             a.serial              ?? '',
        'Cantidad':           a.quantity,
        'Valor ($)':          a.referenceValue      ?? '',
        'Edificio':           a.buildingName        ?? '',
        'Piso':               a.floor               ?? '',
        'Bloque':             a.block               ?? '',
        'Ubicación':          a.location            ?? '',
        'Área':               a.areaName            ?? '',
        'Responsable':        a.responsableRaw      ?? '',
        'Estado':             a.status,
        'Año Incorporación':  a.incorporationYear != null ? a.incorporationYear : 'Inicial',
        'Notas':              a.notes               ?? '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activos')

      const suffix = year ? `_${year}` : ''
      const date   = new Date().toISOString().slice(0, 10)
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
