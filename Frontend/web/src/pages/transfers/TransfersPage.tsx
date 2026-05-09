import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2, Plus,
  Search, Inbox, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { apiTransfers, apiTransferRequests } from '../../lib/api'
import type { TransferRequestStatus } from '../../lib/api'
import { cn } from '../../lib/utils'
import TransfersTable    from './TransfersTable'
import TransferFormModal from './TransferFormModal'
import RequestsTable     from './RequestsTable'

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
    <div className="
      flex items-center gap-3 px-4 py-3 rounded-xl
      bg-white border border-gray-100
      dark:bg-white/[0.02] dark:border-white/[0.06]
    ">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-mi-500 truncate">{label}</p>
        {loading ? (
          <div className="h-5 w-10 mt-0.5 rounded bg-gray-100 dark:bg-mi-700/50 animate-pulse" />
        ) : (
          <p className="text-lg font-syne font-bold text-gray-900 dark:text-mi-50 leading-tight">
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
  const [rFilters,    setRFilters]    = useState<RequestFilters>(DEFAULT_REQUEST_FILTERS)
  const [rSearch,     setRSearch]     = useState('')

  // ── SSE: auto-recarga cuando n8n ingesta una nueva solicitud ──
  useEffect(() => {
    const token = localStorage.getItem('sigaf_token')
    if (!token) return
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
    const es   = new EventSource(`${base}/sync/events?token=${encodeURIComponent(token)}`)
    es.addEventListener('transfer_request:created', () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
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
  function openCreate()         { setEditingId(null); setShowModal(true) }
  function openEdit(id: number) { setEditingId(id);   setShowModal(true) }
  function handleClose()        { setShowModal(false); setEditingId(null) }
  function handleSaved()        { queryClient.invalidateQueries({ queryKey: ['transfers'] }); handleClose() }

  // ── Handlers: solicitudes ──
  function applyRSearch() { setRFilters(f => ({ ...f, q: rSearch, page: 1 })) }
  function handleViewRequest(_id: number) {
    // TODO: abrir modal de detalle / firma en próxima sesión
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50">
            Traslados
          </h1>
          <p className="text-sm text-gray-500 dark:text-mi-400 mt-0.5">
            {tab === 'solicitudes'
              ? `${(rData?.meta.total ?? 0).toLocaleString('es-CO')} solicitudes registradas`
              : `${(tData?.meta.total ?? 0).toLocaleString('es-CO')} traslados registrados`}
          </p>
        </div>

        {tab === 'traslados' && (
          <button
            onClick={openCreate}
            className="
              flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0
              bg-gray-900 hover:bg-gray-800 text-white
              dark:bg-gold dark:hover:bg-gold-300 dark:text-mi-950 dark:font-semibold
            "
          >
            <Plus size={16} />
            Nuevo traslado
          </button>
        )}
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
            <MiniKpi icon={Clock}        label="Revisión"  value={rStats?.revision   ?? 0} color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"               loading={rStatsLoading} />
            <MiniKpi icon={ShieldCheck}  label="Aprobadas" value={rStats?.aprobada   ?? 0} color="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"               loading={rStatsLoading} />
            <MiniKpi icon={CheckCircle2} label="Firmadas"  value={rStats?.firmada    ?? 0} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"       loading={rStatsLoading} />
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
              <option value="REVISION">Revisión</option>
              <option value="APROBADA">Aprobada</option>
              <option value="FIRMADA">Firmada</option>
              <option value="RECHAZADA">Rechazada</option>
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
            onPageChange={page => setRFilters(f => ({ ...f, page }))}
            onView={handleViewRequest}
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

    </div>
  )
}
