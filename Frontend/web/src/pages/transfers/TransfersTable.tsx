import { Pencil, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { Transfer } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Badges ────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDIENTE:  'bg-amber-50  text-amber-700  border border-amber-200  dark:bg-amber-950/40  dark:text-amber-300  dark:border-amber-800/50',
  EN_PROCESO: 'bg-blue-50   text-blue-700   border border-blue-200   dark:bg-blue-950/40   dark:text-blue-300   dark:border-blue-800/50',
  COMPLETADO: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  CANCELADO:  'bg-gray-100  text-gray-600   border border-gray-200   dark:bg-mi-700/40     dark:text-mi-300     dark:border-mi-600/50',
}

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE:  'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  CANCELADO:  'Cancelado',
}

const REASON_LABELS: Record<string, string> = {
  REUBICACION:               'Reubicación',
  MANTENIMIENTO:             'Mantenimiento',
  DONACION:                  'Donación',
  PRESTAMO:                  'Préstamo',
  ACTUALIZACION_RESPONSABLE: 'Actualiz. responsable',
  OTRO:                      'Otro',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SKEL = [80, 180, 130, 130, 90, 80, 50]

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, row) => (
        <tr key={row}>
          {SKEL.map((w, col) => (
            <td key={col} style={{ padding: '14px 16px' }}>
              <div className="skeleton" style={{ height: 13, width: w, maxWidth: '100%' }} />
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

// ── Headers ───────────────────────────────────────────────────────────────────

const HEADERS = ['N° Traslado', 'Activo', 'Origen', 'Destino', 'Motivo', 'Estado', 'Acción']

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransfersTable({ data, meta, isLoading, onPageChange, onEdit }: Props) {
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
                  textAlign: i === 6 ? 'right' : 'left',
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
            {isLoading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '64px 16px', textAlign: 'center',
                  color: 'var(--tbl-text-sub)', fontSize: 13,
                }}>
                  No se encontraron traslados con los filtros aplicados.
                </td>
              </tr>
            ) : (
              data.map(t => (
                <tr
                  key={t.id}
                  className="row-fade"
                  style={{ borderBottom: '1px solid var(--tbl-border)', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--tbl-row-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}
                >
                  {/* N° Traslado */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11, fontWeight: 600,
                      color: 'var(--tbl-text-sub)',
                      letterSpacing: '0.05em',
                    }}>
                      {t.transferNumber}
                    </span>
                  </td>

                  {/* Activo */}
                  <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                    <div style={{
                      color: 'var(--tbl-text)', fontWeight: 500, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.assetName}
                    </div>
                    {t.assetPlate && (
                      <div style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10, color: 'var(--tbl-text-sub)', marginTop: 2,
                      }}>
                        {t.assetPlate}
                      </div>
                    )}
                  </td>

                  {/* Origen */}
                  <td style={{ padding: '12px 16px' }} className="hidden md:table-cell">
                    <span style={{
                      color: 'var(--tbl-text-sub)',
                      display: 'block', maxWidth: 130,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.originBuildingName ?? '—'}
                    </span>
                  </td>

                  {/* Destino */}
                  <td style={{ padding: '12px 16px' }} className="hidden md:table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tbl-text-sub)' }}>
                      <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                      <span style={{
                        display: 'block', maxWidth: 120,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t.destBuildingName ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Motivo */}
                  <td style={{ padding: '12px 16px', color: 'var(--tbl-text-sub)', whiteSpace: 'nowrap' }} className="hidden lg:table-cell">
                    {t.reason ? (REASON_LABELS[t.reason] ?? t.reason) : '—'}
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-mi-700/40 dark:text-mi-300 dark:border-mi-600/50',
                    )}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>

                  {/* Acción */}
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => onEdit(t.id)}
                      className="
                        inline-flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer
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
            {meta.total.toLocaleString('es-CO')} registros
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
