import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { apiCatalogs } from '../../lib/api'
import type { FiltersState } from './AssetsPage'

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'BAJA',             label: 'Baja' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DADO_DE_BAJA',     label: 'Dado de baja' },
]

const YEAR_OPTIONS = ['2022', '2023', '2024', '2025', '2026']

type FilterFields = Omit<FiltersState, 'page' | 'limit'>

interface Props {
  value:    FiltersState
  onChange: (partial: Partial<FilterFields>) => void
}

const INPUT_CLS =
  'w-full py-2 px-3 text-sm rounded-lg transition-colors ' +
  'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100 dark:placeholder-mi-500 ' +
  'dark:focus:ring-mi-400 dark:focus:border-transparent'

const SELECT_CLS =
  'w-full py-2 px-3 text-sm rounded-lg transition-colors ' +
  'bg-white border border-gray-300 text-gray-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100 ' +
  'dark:focus:ring-mi-400 dark:focus:border-transparent'

const LBL = 'block text-xs font-medium text-gray-500 dark:text-mi-400 mb-1'

export default function AssetsFilters({ value, onChange }: Props) {
  const [localQ, setLocalQ] = useState(value.q)
  const mounted = useRef(false)

  // Sync when filters are reset externally (e.g. clearAll)
  useEffect(() => { setLocalQ(value.q) }, [value.q])

  // Debounce: dispara búsqueda 300ms después del último keystroke
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const t = setTimeout(() => onChange({ q: localQ.trim() }), 300)
    return () => clearTimeout(t)
  }, [localQ]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function clearAll() {
    setLocalQ('')
    onChange({ q: '', building: '', type: '', status: '', year: '' })
  }

  const hasActive = value.q || value.building || value.type || value.status || value.year

  return (
    <div className="
      rounded-xl border p-4
      bg-white border-gray-200
      dark:bg-mi-800 dark:border-mi-700/50
    ">
      <div className="flex flex-wrap gap-3 items-end">

        {/* Búsqueda */}
        <div className="flex-1 min-w-[200px]">
          <label className={LBL}>Buscar</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 pointer-events-none" />
            <input
              type="text"
              value={localQ}
              onChange={e => setLocalQ(e.target.value)}
              placeholder="Placa, nombre, serial, marca, modelo…"
              className={INPUT_CLS + ' pl-9' + (localQ ? ' pr-8' : '')}
            />
            {localQ && (
              <button
                type="button"
                onClick={() => setLocalQ('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-mi-500 dark:hover:text-mi-300 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Edificio */}
        <div className="min-w-[160px]">
          <label className={LBL}>Edificio</label>
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
          <label className={LBL}>Tipo</label>
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
          <label className={LBL}>Estado</label>
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

        {/* Año */}
        <div className="w-[110px]">
          <label className={LBL}>Año</label>
          <select
            value={value.year}
            onChange={e => onChange({ year: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="">Todos</option>
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        {hasActive && (
          <button
            onClick={clearAll}
            className="
              flex items-center gap-1.5 text-sm py-2 whitespace-nowrap transition-colors
              text-gray-500 hover:text-red-600
              dark:text-mi-400 dark:hover:text-red-400
            "
          >
            <X size={14} />
            Limpiar
          </button>
        )}

      </div>
    </div>
  )
}
