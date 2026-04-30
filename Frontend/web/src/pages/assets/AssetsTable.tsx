import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Asset } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Badges de estado ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVO:           'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  BAJA:             'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  EN_TRASLADO:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EN_MANTENIMIENTO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DADO_DE_BAJA:     'bg-gray-100 text-gray-500 dark:bg-mi-700/50 dark:text-mi-400',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVO:           'Activo',
  BAJA:             'Baja',
  EN_TRASLADO:      'En traslado',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DADO_DE_BAJA:     'Dado de baja',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Meta { total: number; page: number; limit: number; pages: number }

interface Props {
  data:         Asset[]
  meta:         Meta
  isLoading:    boolean
  searchQuery?: string
  onPageChange: (page: number) => void
  onEdit:       (id: number) => void
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const COLS = [45, 280, 120, 140, 160, 90, 60]

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, row) => (
        <tr key={row}>
          {COLS.map((w, col) => (
            <td key={col} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse bg-gray-200 dark:bg-mi-700/60"
                style={{ width: w, maxWidth: '100%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AssetsTable({ data, meta, isLoading, searchQuery, onPageChange, onEdit }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden bg-white border-gray-200 dark:bg-mi-800 dark:border-mi-700/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="
              border-b text-left
              bg-gray-50 border-gray-200 text-gray-600
              dark:bg-mi-850 dark:border-mi-700/50 dark:text-mi-400
            ">
              <th className="px-4 py-3 font-medium whitespace-nowrap">Plaqueta</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Tipo</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell">Edificio</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell">Responsable</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Editar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-mi-700/30">
            {isLoading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400 dark:text-mi-500">
                  {searchQuery
                    ? <>Sin resultados para <span className="font-mono text-gray-600 dark:text-mi-300">"{searchQuery}"</span> — intenta con placa, nombre, serial o marca.</>
                    : 'No se encontraron activos con los filtros aplicados.'
                  }
                </td>
              </tr>
            ) : (
              data.map(asset => (
                <tr
                  key={asset.id}
                  className="
                    row-fade transition-colors
                    hover:bg-gray-50 dark:hover:bg-mi-750/50
                  "
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-500 dark:text-gold/80 tracking-wide">
                      {asset.plate ?? '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-[280px] text-gray-900 dark:text-mi-100">
                    <span className="line-clamp-2 leading-snug">{asset.name}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-600 dark:text-mi-300">
                    {asset.assetTypeName ?? '—'}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-gray-600 dark:text-mi-300">
                    {asset.buildingName ?? '—'}
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell max-w-[200px] text-gray-600 dark:text-mi-300">
                    <span className="truncate block">{asset.responsableRaw ?? '—'}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      STATUS_STYLES[asset.status] ?? 'bg-gray-100 text-gray-600 dark:bg-mi-700/50 dark:text-mi-400',
                    )}>
                      {STATUS_LABELS[asset.status] ?? asset.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(asset.id)}
                      className="
                        inline-flex items-center gap-1 text-xs font-medium transition-colors
                        text-blue-600 hover:text-blue-800
                        dark:text-mi-300 dark:hover:text-gold
                      "
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!isLoading && meta.pages > 1 && (
        <div className="
          flex items-center justify-between px-4 py-3 border-t
          bg-gray-50 border-gray-200 text-gray-500
          dark:bg-mi-850 dark:border-mi-700/50 dark:text-mi-400
        ">
          <span className="text-xs">
            Página {meta.page} de {meta.pages}
            {' · '}
            {meta.total.toLocaleString('es-CO')} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="
                p-1.5 rounded-md transition-colors
                hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed
                dark:hover:bg-mi-700 dark:disabled:opacity-30
              "
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              className="
                p-1.5 rounded-md transition-colors
                hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed
                dark:hover:bg-mi-700 dark:disabled:opacity-30
              "
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
