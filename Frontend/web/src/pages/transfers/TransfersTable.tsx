import { Pencil, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { Transfer } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Badges ────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDIENTE:  'bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-400',
  EN_PROCESO: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
  COMPLETADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELADO:  'bg-gray-100   text-gray-600   dark:bg-mi-700/50     dark:text-mi-400',
}

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE:  'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  CANCELADO:  'Cancelado',
}

const REASON_LABELS: Record<string, string> = {
  REUBICACION:              'Reubicación',
  MANTENIMIENTO:            'Mantenimiento',
  DONACION:                 'Donación',
  PRESTAMO:                 'Préstamo',
  ACTUALIZACION_RESPONSABLE:'Actualiz. responsable',
  OTRO:                     'Otro',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const COL_WIDTHS = [80, 180, 130, 130, 90, 80, 50]

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, row) => (
        <tr key={row}>
          {COL_WIDTHS.map((w, col) => (
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface Meta { total: number; page: number; limit: number; pages: number }

interface Props {
  data:         Transfer[]
  meta:         Meta
  isLoading:    boolean
  onPageChange: (page: number) => void
  onEdit:       (id: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransfersTable({ data, meta, isLoading, onPageChange, onEdit }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden bg-white border-gray-200 dark:bg-mi-900 dark:border-white/[0.05]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="
              border-b text-left
              bg-gray-50/80 border-gray-200 text-gray-600
              dark:bg-mi-850 dark:border-white/[0.05] dark:text-mi-400
            ">
              <th className="px-4 py-3 font-medium whitespace-nowrap">N° Traslado</th>
              <th className="px-4 py-3 font-medium">Activo</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Origen</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Destino</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell">Motivo</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-mi-700/30">
            {isLoading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400 dark:text-mi-500">
                  No se encontraron traslados con los filtros aplicados.
                </td>
              </tr>
            ) : (
              data.map(t => (
                <tr
                  key={t.id}
                  className="row-fade transition-colors hover:bg-gray-50 dark:hover:bg-mi-750/50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-500 dark:text-gold/80 tracking-wide">
                      {t.transferNumber}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-gray-900 dark:text-mi-100 line-clamp-1 leading-snug">
                      {t.assetName}
                    </p>
                    {t.assetPlate && (
                      <p className="font-mono text-[10px] text-gray-400 dark:text-mi-400 mt-0.5">
                        {t.assetPlate}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-600 dark:text-mi-300">
                    <span className="truncate block max-w-[130px]">
                      {t.originBuildingName ?? '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-mi-300">
                      <ArrowRight size={12} className="shrink-0 text-gray-400 dark:text-mi-400" />
                      <span className="truncate block max-w-[120px]">
                        {t.destBuildingName ?? '—'}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-gray-600 dark:text-mi-300">
                    {t.reason ? (REASON_LABELS[t.reason] ?? t.reason) : '—'}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-600 dark:bg-mi-700/50 dark:text-mi-400',
                    )}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(t.id)}
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
          bg-gray-50/60 border-gray-100 text-gray-500
          dark:bg-mi-900/40 dark:border-white/[0.04] dark:text-mi-500
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
