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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Download size={16} />
            Exportar a Excel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Año de incorporación
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Aplicar filtros activos de la tabla</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
