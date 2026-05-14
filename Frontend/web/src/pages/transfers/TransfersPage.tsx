import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2,
  Search, Inbox, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { apiTransfers, apiTransferRequests } from '../../lib/api'
import type { TransferRequestStatus } from '../../lib/api'
import { cn } from '../../lib/utils'
import TransfersTable    from './TransfersTable'
import TransferFormModal from './TransferFormModal'
import RequestsTable     from './RequestsTable'
import RequestDetailDrawer from './RequestDetailDrawer'
import ConfirmDialog from '../../components/ConfirmDialog'

// ── Mini KPI ──────────────────────────────────────────────────────────────────

interface KpiProps {
  icon:     LucideIcon
  label:    string
  value:    number | string
  color:    string
  loading?: boolean
}

function MiniKpi({ icon: Icon, label, value, color, loading }: KpiProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: 'var(--tbl-bg)', border: '1px solid var(--tbl-border)',
    }}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--tbl-text-sub)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 20, width: 40, marginTop: 3 }} />
        ) : (
          <p className="font-syne font-bold leading-tight" style={{ fontSize: 20, color: 'var(--tbl-text)', margin: 0 }}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'solicitudes' | 'traslados'

// ── Filters ───────────────────────────────────────────────────────────────────

interface TransferFilters {
  q:      string
  status: string
  page:   number
  limit:  number
}

interface RequestFilters {
  q:      string
  status: TransferRequestStatus | ''
  page:   number
  limit:  number
}

const DEFAULT_TRANSFER_FILTERS: TransferFilters = { q: '', status: '', page: 1, limit: 50 }
const DEFAULT_REQUEST_FILTERS:  RequestFilters  = { q: '', status: '', page: 1, limit: 50 }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('solicitudes')

  // ── Traslados state ──
  const [tFilters,    setTFilters]    = useState<TransferFilters>(DEFAULT_TRANSFER_FILTERS)
  const [editingId,   setEditingId]   = useState<number | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [tSearch,     setTSearch]     = useState('')

  // ── Solicitudes state ──
  const [rFilters,         setRFilters]         = useState<RequestFilters>(DEFAULT_REQUEST_FILTERS)
  const [rSearch,          setRSearch]          = useState('')
  const [viewingRequestId, setViewingRequestId] = useState<number | null>(null)
  const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null)

  // ── SSE: auto-recarga cuando n8n ingesta una nueva solicitud ──
  useEffect(() => {
    const token = localStorage.getItem('sigaf_token')
    if (!token) return
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const es   = new EventSource(`${base}/sync/events?token=${encodeURIComponent(token)}`)
    es.addEventListener('transfer_request:created', () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
      queryClient.invalidateQueries({ queryKey: ['transferRequests', 'stats'] })
    })
    es.addEventListener('transfer_request:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
      queryClient.invalidateQueries({ queryKey: ['transferRequests', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['transferRequest'] })
    })
    return () => es.close()
  }, [queryClient])

  // ── Queries: traslados ──
  const { data: tStats, isLoading: tStatsLoading } = useQuery({
    queryKey: ['transfers', 'stats'],
    queryFn:  apiTransfers.stats,
    staleTime: 30_000,
    enabled:   tab === 'traslados',
  })

  const { data: tData, isLoading: tLoading, isError: tError } = useQuery({
    queryKey: ['transfers', tFilters],
    queryFn:  () => apiTransfers.list({
      q:      tFilters.q      || undefined,
      status: tFilters.status || undefined,
      page:   tFilters.page,
      limit:  tFilters.limit,
    }),
    placeholderData: (prev) => prev,
    enabled: tab === 'traslados',
  })

  // ── Queries: solicitudes ──
  const { data: rStats, isLoading: rStatsLoading } = useQuery({
    queryKey: ['transferRequests', 'stats'],
    queryFn:  apiTransferRequests.stats,
    staleTime: 30_000,
    enabled:   tab === 'solicitudes',
  })

  const { data: rData, isLoading: rLoading, isError: rError } = useQuery({
    queryKey: ['transferRequests', rFilters],
    queryFn:  () => apiTransferRequests.list({
      q:      rFilters.q      || undefined,
      status: rFilters.status || undefined,
      page:   rFilters.page,
      limit:  rFilters.limit,
    }),
    placeholderData: (prev) => prev,
    enabled: tab === 'solicitudes',
  })

  // ── Handlers: traslados ──
  function applyTSearch() { setTFilters(f => ({ ...f, q: tSearch, page: 1 })) }
  function openEdit(id: number) { setEditingId(id); setShowModal(true) }
  function handleClose()        { setShowModal(false); setEditingId(null) }
  function handleSaved()        { queryClient.invalidateQueries({ queryKey: ['transfers'] }); handleClose() }

  const { mutateAsync: deleteRequestMutation, isPending: isDeleting } = useMutation({
    mutationFn: apiTransferRequests.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
    }
  })

  // ── Handlers: solicitudes ──
  function applyRSearch() { setRFilters(f => ({ ...f, q: rSearch, page: 1 })) }
  function handleViewRequest(id: number) {
    setViewingRequestId(id)
  }
  function handleDeleteRequest(id: number) {
    setDeletingRequestId(id)
  }
  function confirmDelete() {
    if (!deletingRequestId) return
    deleteRequestMutation(deletingRequestId)
      .then(() => setDeletingRequestId(null))
      .catch(() => setDeletingRequestId(null))
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <p
          className="text-[#9C6E22] dark:text-gold"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.28em',
            textTransform: 'uppercase', margin: '0 0 6px',
          }}
        >
          ◇ Universidad Americana · Gestión de Activos
        </p>
        <h1 className="font-syne font-bold text-gray-900 dark:text-mi-50 leading-none m-0" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
          Traslados
        </h1>
        <div style={{ width: 100, height: 2, marginTop: 6, background: 'linear-gradient(90deg, #D9AB44, transparent)', borderRadius: 1 }} />
        <p style={{ color: 'var(--tbl-text-sub)', fontSize: 13.5, margin: '10px 0 0' }}>
          {tab === 'solicitudes'
            ? <><strong style={{ color: 'var(--tbl-text)', fontWeight: 600 }}>{(rData?.meta.total ?? 0).toLocaleString('es-CO')}</strong>{' '}solicitudes registradas</>
            : <><strong style={{ color: 'var(--tbl-text)', fontWeight: 600 }}>{(tData?.meta.total ?? 0).toLocaleString('es-CO')}</strong>{' '}traslados registrados</>
          }
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-mi-800/60 w-fit">
        {([
          { key: 'solicitudes', label: 'Solicitudes', icon: Inbox },
          { key: 'traslados',   label: 'Traslados',   icon: ArrowLeftRight },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key
                ? 'bg-white shadow-sm text-gray-900 dark:bg-mi-900 dark:text-mi-50'
                : 'text-gray-500 hover:text-gray-700 dark:text-mi-400 dark:hover:text-mi-200',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: SOLICITUDES
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'solicitudes' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MiniKpi icon={Inbox}        label="Total"     value={rStats?.total     ?? 0} color="bg-mi-50 text-mi-600 dark:bg-mi-900/60 dark:text-mi-300"                           loading={rStatsLoading} />
            <MiniKpi icon={Inbox}        label="Recibidas" value={rStats?.recibida   ?? 0} color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"                   loading={rStatsLoading} />
            <MiniKpi icon={Clock}        label="Gestión"   value={(rStats?.pendienteGestionActivosFijos ?? 0) + (rStats?.revision ?? 0)} color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" loading={rStatsLoading} />
            <MiniKpi icon={ShieldCheck}  label="Aprobadas" value={rStats?.aprobada   ?? 0} color="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"               loading={rStatsLoading} />
            <MiniKpi icon={CheckCircle2} label="Cerradas"  value={(rStats?.firmada ?? 0) + (rStats?.respuestaEnviada ?? 0)} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" loading={rStatsLoading} />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por N°, remitente o asunto…"
                value={rSearch}
                onChange={e => setRSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyRSearch() }}
                className="
                  w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors
                  bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400
                  focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30
                  dark:bg-mi-800 dark:border-mi-700/50 dark:text-mi-100 dark:placeholder:text-mi-500
                  dark:focus:border-gold/60
                "
              />
            </div>

            <select
              value={rFilters.status}
              onChange={e => setRFilters(f => ({ ...f, status: e.target.value as TransferRequestStatus | '', page: 1 }))}
              className="
                px-3 py-2 text-sm rounded-lg outline-none cursor-pointer transition-colors
                bg-white border border-gray-200 text-gray-700
                focus:border-gold/60 focus:ring-2 focus:ring-gold/30
                dark:bg-mi-800 dark:border-mi-700/60 dark:text-mi-200
              "
            >
              <option value="">Todos los estados</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="PENDIENTE_GESTION_ACTIVOS_FIJOS">Pendiente gestión</option>
              <option value="REVISION">Revisión</option>
              <option value="APROBADA">Aprobada</option>
              <option value="FIRMA_SOLICITADA">Firma solicitada</option>
              <option value="FIRMA_EN_PROCESO">Firma en proceso</option>
              <option value="FIRMADA">Firmada</option>
              <option value="PDF_GENERADO">PDF generado</option>
              <option value="RESPUESTA_ENVIANDO">Enviando respuesta</option>
              <option value="RESPUESTA_ENVIADA">Respuesta enviada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="ERROR_FIRMA">Error firma</option>
              <option value="ERROR_ENVIO_RESPUESTA">Error respuesta</option>
              <option value="REQUIERE_REVISION_MANUAL">Revisión manual</option>
            </select>

            <button
              onClick={applyRSearch}
              className="
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                bg-gray-100 hover:bg-gray-200 text-gray-700
                dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:text-mi-200
              "
            >
              {rLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Buscar
            </button>

            {(rFilters.q || rFilters.status) && (
              <button
                onClick={() => { setRSearch(''); setRFilters(DEFAULT_REQUEST_FILTERS) }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-mi-500 dark:hover:text-mi-300 transition-colors underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {rError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
              Error al cargar las solicitudes. Verifica la conexión con el API.
            </div>
          )}

          <RequestsTable
            data={rData?.data ?? []}
            meta={rData?.meta ?? { total: 0, page: 1, limit: 50, pages: 0 }}
            isLoading={rLoading}
            onPageChange={(p) => setRFilters(f => ({ ...f, page: p }))}
            onView={handleViewRequest}
            onDelete={handleDeleteRequest}
          />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: TRASLADOS
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'traslados' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniKpi icon={ArrowLeftRight} label="Total"      value={tStats?.total      ?? 0} color="bg-mi-50 text-mi-600 dark:bg-mi-900/60 dark:text-mi-300"                     loading={tStatsLoading} />
            <MiniKpi icon={Clock}          label="Pendientes" value={tStats?.pendiente   ?? 0} color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"         loading={tStatsLoading} />
            <MiniKpi icon={CheckCircle2}   label="Completados" value={tStats?.completado ?? 0} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" loading={tStatsLoading} />
            <MiniKpi icon={XCircle}        label="Cancelados" value={tStats?.cancelado   ?? 0} color="bg-gray-100 text-gray-500 dark:bg-mi-700/50 dark:text-mi-400"                loading={tStatsLoading} />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por N°, placa o activo…"
                value={tSearch}
                onChange={e => setTSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyTSearch() }}
                className="
                  w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors
                  bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400
                  focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30
                  dark:bg-mi-800 dark:border-mi-700/50 dark:text-mi-100 dark:placeholder:text-mi-500
                  dark:focus:border-gold/60
                "
              />
            </div>

            <select
              value={tFilters.status}
              onChange={e => setTFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
              className="
                px-3 py-2 text-sm rounded-lg outline-none cursor-pointer transition-colors
                bg-white border border-gray-200 text-gray-700
                focus:border-gold/60 focus:ring-2 focus:ring-gold/30
                dark:bg-mi-800 dark:border-mi-700/60 dark:text-mi-200
              "
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>

            <button
              onClick={applyTSearch}
              className="
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                bg-gray-100 hover:bg-gray-200 text-gray-700
                dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:text-mi-200
              "
            >
              {tLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Buscar
            </button>

            {(tFilters.q || tFilters.status) && (
              <button
                onClick={() => { setTSearch(''); setTFilters(DEFAULT_TRANSFER_FILTERS) }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-mi-500 dark:hover:text-mi-300 transition-colors underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {tError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
              Error al cargar los traslados. Verifica la conexión con el API.
            </div>
          )}

          <TransfersTable
            data={tData?.data ?? []}
            meta={tData?.meta ?? { total: 0, page: 1, limit: 50, pages: 0 }}
            isLoading={tLoading}
            onPageChange={page => setTFilters(f => ({ ...f, page }))}
            onEdit={openEdit}
          />
        </>
      )}

      {/* ── Modal traslados ─────────────────────────────────────────── */}
      {showModal && (
        <TransferFormModal
          transferId={editingId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {/* ── Drawer solicitudes ──────────────────────────────────────── */}
      {viewingRequestId && (
        <RequestDetailDrawer
          requestId={viewingRequestId}
          onClose={() => setViewingRequestId(null)}
        />
      )}

      {/* ── Confirmación de eliminación ────────────────────────────── */}
      <ConfirmDialog
        open={deletingRequestId !== null}
        title="Eliminar Solicitud"
        message="Esta acción eliminará permanentemente la solicitud y todos sus activos asociados. Esta operación no se puede deshacer."
        confirmLabel={isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingRequestId(null)}
      />

    </div>
  )
}
