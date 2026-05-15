import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es }     from 'date-fns/locale'
import type { TransferRequest } from '../../lib/api'
import { cn } from '../../lib/utils'
import { TransferRequestBadge } from '../../components/ui/StatusBadge'
import SkeletonTable from '../../components/ui/SkeletonTable'

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  data:         TransferRequest[]
  meta:         { total: number; page: number; limit: number; pages: number }
  isLoading:    boolean
  onPageChange: (page: number) => void
  onView:       (id: number) => void
  onDelete?:    (id: number) => void
}

// ── Headers ───────────────────────────────────────────────────────────────────

const HEADERS = ['N° Solicitud', 'Remitente', 'Asunto', 'Activos', 'Estado', 'Recibida', '']

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestsTable({ data, meta, isLoading, onPageChange, onView, onDelete }: Props) {
  return (
    <div style={{
      background: 'var(--tbl-bg)',
      border: '1px solid var(--tbl-border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 24px rgba(13,27,74,0.05)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>

          <thead>
            <tr style={{ background: 'var(--tbl-head-bg)', borderBottom: '1px solid var(--tbl-border)' }}>
              {HEADERS.map((h, i) => (
                <th key={i} style={{
                  textAlign: i === 3 ? 'center' : 'left',
                  padding: '11px 16px',
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--tbl-text-sub)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontFamily: '"JetBrains Mono", monospace',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? <SkeletonTable cols={[90, 160, 200, 40, 110, 80, 0]} rows={5} />
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '64px 16px', textAlign: 'center',
                      color: 'var(--tbl-text-sub)', fontSize: 13,
                    }}>
                      No se encontraron solicitudes
                    </td>
                  </tr>
                )
                : data.map(row => (
                  <tr
                    key={row.id}
                    className="row-fade group"
                    onClick={() => onView(row.id)}
                    style={{ borderBottom: '1px solid var(--tbl-border)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--tbl-row-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}
                  >
                    {/* N° Solicitud */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span className="plaqueta">{row.requestNumber}</span>
                    </td>

                    {/* Remitente */}
                    <td style={{ padding: '12px 16px', maxWidth: 180 }}>
                      <div style={{
                        color: 'var(--tbl-text)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {row.senderEmail ?? '—'}
                      </div>
                    </td>

                    {/* Asunto */}
                    <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                      <div style={{
                        color: 'var(--tbl-text-sub)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {row.subject ?? '—'}
                      </div>
                    </td>

                    {/* Activos */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
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

                    {/* Estado */}
                    <td style={{ padding: '12px 16px' }}>
                      <TransferRequestBadge status={row.status} />
                    </td>

                    {/* Recibida */}
                    <td style={{ padding: '12px 16px', color: 'var(--tbl-text-sub)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {row.receivedAt
                        ? format(new Date(row.receivedAt), "d MMM yyyy HH:mm", { locale: es })
                        : '—'}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.id)}
                            title="Eliminar solicitud"
                            className="
                              p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100
                              text-gray-400 hover:text-red-600 hover:bg-red-50
                              dark:hover:text-red-400 dark:hover:bg-red-900/30
                            "
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <ChevronRight size={14} style={{ color: 'var(--tbl-text-sub)', flexShrink: 0 }} />
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
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 16px',
          borderTop: '1px solid var(--tbl-border)',
          background: 'var(--tbl-foot-bg)',
          fontSize: 12, color: 'var(--tbl-text-sub)',
        }}>
          <span>
            Página {meta.page} de {meta.pages}
            {' · '}
            {meta.total.toLocaleString('es-CO')} solicitudes
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--tbl-bg)', border: '1px solid var(--tbl-border)',
                color: 'var(--tbl-text-sub)',
                cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: meta.page <= 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--tbl-bg)', border: '1px solid var(--tbl-border)',
                color: 'var(--tbl-text-sub)',
                cursor: meta.page >= meta.pages ? 'not-allowed' : 'pointer',
                opacity: meta.page >= meta.pages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
