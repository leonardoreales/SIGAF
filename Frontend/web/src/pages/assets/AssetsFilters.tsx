import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { apiCatalogs } from '../../lib/api'
import type { FiltersState } from './AssetsPage'

// ── Opciones hardcoded (enum del backend en @sigaf/shared) ────────────────────

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'BAJA',             label: 'Baja' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DADO_DE_BAJA',     label: 'Dado de baja' },
]

// ── Props ─────────────────────────────────────────────────────────────────────

type FilterFields = Omit<FiltersState, 'page' | 'limit'>

interface Props {
  value:    FiltersState
  onChange: (partial: Partial<FilterFields>) => void
}

// ── Estilos reutilizables ─────────────────────────────────────────────────────

const SELECT_CLS =
  'w-full py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

// ── Componente ────────────────────────────────────────────────────────────────

export default function AssetsFilters({ value, onChange }: Props) {
  // Estado local del input texto para aplicar sólo en Enter / blur
  const [localQ, setLocalQ] = useState(value.q)

  // Sincronizar si el padre resetea los filtros
  useEffect(() => { setLocalQ(value.q) }, [value.q])

  const { data: buildings } = useQuery({
    queryKey: ['catalog', 'buildings'],
    queryFn:  apiCatalogs.buildings,
    staleTime: Infinity,
  })

  const { data: assetTypes } = useQuery({
    queryKey: ['catalog', 'assetTypes'],
    queryFn:  apiCatalogs.assetTypes,
    staleTime: Infinity,
  })

  function submitQ() {
    const trimmed = localQ.trim()
    if (trimmed !== value.q) onChange({ q: trimmed })
  }

  function clearAll() {
    setLocalQ('')
    onChange({ q: '', building: '', type: '', status: '', year: '' })
  }

  const hasActive = value.q || value.building || value.type || value.status || value.year

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3 items-end">

        {/* Búsqueda por nombre */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={localQ}
              onChange={e => setLocalQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitQ() }}
              onBlur={submitQ}
              placeholder="Nombre del activo… (Enter para buscar)"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Edificio */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Edificio</label>
          <select
            value={value.building}
            onChange={e => onChange({ building: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="">Todos</option>
            {buildings?.map(b => (
              <option key={b.id} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select
            value={value.type}
            onChange={e => onChange({ type: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="">Todos</option>
            {assetTypes?.map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="min-w-[155px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <select
            value={value.status}
            onChange={e => onChange({ status: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Año de incorporación */}
        <div className="w-[100px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
          <input
            type="number"
            value={value.year}
            onChange={e => onChange({ year: e.target.value })}
            placeholder="2020"
            min={1990}
            max={2100}
            className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Limpiar filtros */}
        {hasActive && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors py-2 whitespace-nowrap"
          >
            <X size={14} />
            Limpiar
          </button>
        )}

      </div>
    </div>
  )
}
