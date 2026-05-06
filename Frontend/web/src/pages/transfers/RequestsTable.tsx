import { format } from 'date-fns'
import { es }     from 'date-fns/locale'
import {
  Inbox, CheckCircle2, Clock, XCircle, PenLine, Eye,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TransferRequest, TransferRequestStatus } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Badge de estado ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferRequestStatus, { label: string; icon: LucideIcon; className: string }> = {
  RECIBIDA:  { label: 'Recibida',  icon: Inbox,         className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50' },
  REVISION:  { label: 'Revisión',  icon: Clock,         className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50' },
  APROBADA:  { label: 'Aprobada',  icon: CheckCircle2,  className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/50' },
  FIRMADA:   { label: 'Firmada',   icon: CheckCircle2,  className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' },
  RECHAZADA: { label: 'Rechazada', icon: XCircle,       className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50' },
}

function StatusBadge({ status }: { status: TransferRequestStatus }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.REVISION
  const Icon = cfg.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
      cfg.className,
    )}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ── Skeleton row ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 dark:bg-mi-700/50 animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  data:         TransferRequest[]
  meta:         { total: number; page: number; limit: number; pages: number }
  isLoading:    boolean
  onPageChange: (page: number) => void
  onView:       (id: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestsTable({ data, meta, isLoading, onPageChange, onView }: Props) {
  return (
    <div className="
      rounded-xl overflow-hidden border
      border-gray-100 dark:border-white/[0.06]
      bg-white dark:bg-white/[0.02]
    ">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-mi-400 whitespace-nowrap">N° Solicitud</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-mi-400">Remitente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-mi-400">Asunto</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-mi-400 whitespace-nowrap">Activos</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-mi-400">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-mi-400 whitespace-nowrap">Recibida</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-mi-500">
                      No se encontraron solicitudes
                    </td>
                  </tr>
                )
                : data.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 dark:border-white/[0.05] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-mi-200">
                        {row.requestNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="truncate block text-gray-700 dark:text-mi-200">
                        {row.senderEmail ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-[220px]">
                      <span className="truncate block text-gray-600 dark:text-mi-300">
                        {row.subject ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        row.itemsMatched > 0 && row.itemsMatched === row.itemsCount
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : row.itemsMatched > 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-mi-700/50 dark:text-mi-300',
                      )}>
                        {row.itemsCount}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="px-4 py-3 text-gray-500 dark:text-mi-400 whitespace-nowrap text-xs">
                      {row.receivedAt
                        ? format(new Date(row.receivedAt), "d MMM yyyy HH:mm", { locale: es })
                        : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(row.id)}
                          title="Ver detalle"
                          className="
                            p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100
                            dark:text-mi-500 dark:hover:text-mi-200 dark:hover:bg-white/[0.06]
                            transition-colors
                          "
                        >
                          <Eye size={15} />
                        </button>
                        {(row.status === 'REVISION' || row.status === 'APROBADA') && (
                          <button
                            onClick={() => onView(row.id)}
                            title="Firmar acta"
                            className="
                              p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50
                              dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/40
                              transition-colors
                            "
                          >
                            <PenLine size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p className="text-xs text-gray-400 dark:text-mi-500">
            {meta.total.toLocaleString('es-CO')} solicitudes · página {meta.page} de {meta.pages}
          </p>
          <div className="flex gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-mi-700/60 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors dark:text-mi-300"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-mi-700/60 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors dark:text-mi-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
