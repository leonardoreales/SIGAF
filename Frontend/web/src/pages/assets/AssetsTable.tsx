import { Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Asset } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Badge de estado ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVO:           'bg-green-100 text-green-800',
  BAJA:             'bg-rose-100 text-rose-700',
  EN_TRASLADO:      'bg-amber-100 text-amber-700',
  EN_MANTENIMIENTO: 'bg-orange-100 text-orange-700',
  DADO_DE_BAJA:     'bg-gray-100 text-gray-500',
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
                className="h-4 bg-gray-200 rounded animate-pulse"
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

export default function AssetsTable({ data, meta, isLoading, onPageChange, onEdit }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Plaqueta</th>
              <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap hidden md:table-cell">Tipo</th>
              <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap hidden lg:table-cell">Edificio</th>
              <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap hidden lg:table-cell">Responsable</th>
              <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right whitespace-nowrap">Editar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No se encontraron activos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              data.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {asset.plate ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-900 max-w-[280px]">
                    <span className="line-clamp-2 leading-snug">{asset.name}</span>
                  </td>

                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden md:table-cell">
                    {asset.assetTypeName ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden lg:table-cell">
                    {asset.buildingName ?? '—'}
                  </td>

                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell max-w-[200px]">
                    <span className="truncate block">{asset.responsableRaw ?? '—'}</span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      STATUS_STYLES[asset.status] ?? 'bg-gray-100 text-gray-600',
                    )}>
                      {STATUS_LABELS[asset.status] ?? asset.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(asset.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">
            Página {meta.page} de {meta.pages}
            {' · '}
            {meta.total.toLocaleString('es-CO')} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
