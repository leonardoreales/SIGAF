import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Download } from 'lucide-react'
import { apiAssets, ApiError } from '../../lib/api'
import type { SyncEvent }  from '../../lib/api'
import { useSyncEvents }   from '../../hooks/useSyncEvents'
import { activityBus }     from '../../lib/activityBus'
import SyncBanner          from '../../components/SyncBanner'
import AssetsFilters       from './AssetsFilters'
import AssetsTable         from './AssetsTable'
import AssetFormModal      from './AssetFormModal'
import AssetDrawer         from './AssetDrawer'
import ExportModal         from './ExportModal'
import ImportsDrawer       from './ImportsDrawer'
import { FileDown }        from 'lucide-react'

export interface FiltersState {
  q:        string
  building: string
  type:     string
  status:   string
  year:     string
  month:    string   // '1'–'12', only active when year is set
  area:     string
  page:     number
  limit:    number
}

const DEFAULT_FILTERS: FiltersState = {
  q: '', building: '', type: '', status: '', year: '', month: '', area: '', page: 1, limit: 50,
}

export default function AssetsPage() {
  const queryClient = useQueryClient()
  const [filters,      setFilters]      = useState<FiltersState>(DEFAULT_FILTERS)
  const [viewingId,    setViewingId]    = useState<number | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [showExport,   setShowExport]   = useState(false)
  const [showImports,  setShowImports]  = useState(false)
  const [syncEvent,    setSyncEvent]    = useState<SyncEvent | null>(null)

  const handleSync = useCallback((event: SyncEvent) => {
    setSyncEvent(event)
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    activityBus.emit({
      type:    'sync',
      message: `Sincronización — ${event.insertados} activos añadidos`,
      detail:  event.sourceSheet,
    })
  }, [queryClient])

  useSyncEvents(handleSync)

  const monthRange = (() => {
    if (!filters.year || !filters.month) return {}
    const m    = Number(filters.month)
    const y    = Number(filters.year)
    const last = new Date(y, m, 0).getDate()
    const mm   = String(m).padStart(2, '0')
    return {
      acquisitionFrom: `${filters.year}-${mm}-01`,
      acquisitionTo:   `${filters.year}-${mm}-${String(last).padStart(2, '0')}`,
    }
  })()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['assets', filters],
    queryFn:  () =>
      apiAssets.list({
        q:        filters.q        || undefined,
        building: filters.building || undefined,
        type:     filters.type     || undefined,
        status:   filters.status   || undefined,
        year:     filters.year   ? Number(filters.year) : undefined,
        areaId:   filters.area   ? Number(filters.area) : undefined,
        page:     filters.page,
        limit:    filters.limit,
        ...monthRange,
      }),
    placeholderData: (prev) => prev,
  })

  const unauthorizedError = error instanceof ApiError && error.status === 401
  const errorMessage = unauthorizedError
    ? 'Tu sesión ha expirado. Inicia sesión de nuevo para continuar.'
    : 'Error al cargar los activos. Verifica la conexión e intenta recargar.'

  function handleReload() {
    if (unauthorizedError) {
      localStorage.removeItem('sigaf_token')
      localStorage.removeItem('sigaf_user')
      window.location.replace('/login')
    } else {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  }

  function applyFilter(partial: Partial<Omit<FiltersState, 'page' | 'limit'>>) {
    setFilters(f => ({ ...f, ...partial, page: 1 }))
  }

  function handleDrawerSaved() {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    activityBus.emit({ type: 'asset_updated', message: 'Activo actualizado', detail: `ID ${viewingId}` })
    setViewingId(null)
  }

  function handleCreateSaved() {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    activityBus.emit({ type: 'asset_created', message: 'Activo registrado en el sistema' })
    setShowCreate(false)
  }

  return (
    <div className="space-y-5">

      {/* ── Header institucional ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p
            className="text-[#9C6E22] dark:text-gold"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10, letterSpacing: '0.28em',
              textTransform: 'uppercase',
              marginBottom: 6, margin: '0 0 6px',
            }}
          >
            ◇ Universidad Americana · Inventario General
          </p>
          <h1 className="font-syne font-bold text-[28px] tracking-tight text-gray-900 dark:text-mi-50 leading-none m-0">
            Activos Fijos
          </h1>
          <div style={{ width: 100, height: 2, marginTop: 6, background: 'linear-gradient(90deg, #D9AB44, transparent)', borderRadius: 1 }} />
          {data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <p style={{ color: 'var(--tbl-text-sub)', fontSize: 13.5, margin: 0 }}>
                <strong style={{ color: 'var(--tbl-text)', fontWeight: 600 }}>
                  {data.meta.total.toLocaleString('es-CO')}
                </strong>{' '}
                activos en el sistema
              </p>
              
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--tbl-border)' }} />
              
              <button
                onClick={() => setShowImports(true)}
                className="
                  relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-md
                  bg-gradient-to-r from-[#FBF1D6] to-[#EADDAC] text-[#5A3E15] border border-[#D9AB44]
                  dark:from-[rgba(217,171,68,0.15)] dark:to-[rgba(217,171,68,0.05)] dark:text-[#E9C76E] dark:border-[rgba(217,171,68,0.3)]
                  transition-colors hover:border-gold/60
                "
              >
                <FileDown size={13} className="relative z-10" />
                <span className="relative z-10 tracking-[0.05em] uppercase font-mono text-[10px] mt-px">
                  Registro Activos Nuevos
                </span>
                <span className="relative z-10 ml-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#15803D] dark:bg-gold"></span>
                </span>
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setShowExport(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--tbl-bg)', color: 'var(--tbl-text)',
              border: '1px solid var(--tbl-border)',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#D9AB44')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--tbl-border)')}
          >
            <Download size={15} /> Exportar
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#0D1B4A', color: 'white',
              border: '1px solid transparent',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#142663')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0D1B4A')}
          >
            <Plus size={15} /> Nuevo activo
          </button>
        </div>
      </div>

      {/* Banner sincronización n8n */}
      {syncEvent && (
        <SyncBanner event={syncEvent} onDismiss={() => setSyncEvent(null)} />
      )}

      {/* Filtros */}
      <AssetsFilters value={filters} onChange={applyFilter} />

      {/* Error */}
      {isError && (
        <div className="
          bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700
          dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400
          flex items-center justify-between gap-4
        ">
          <span>{errorMessage}</span>
          <button onClick={handleReload} className="shrink-0 underline underline-offset-2 hover:no-underline">
            {unauthorizedError ? 'Ir al login' : 'Recargar'}
          </button>
        </div>
      )}

      {/* Tabla */}
      <AssetsTable
        data={data?.data ?? []}
        meta={data?.meta ?? { total: 0, page: 1, limit: 50, pages: 0 }}
        isLoading={isLoading}
        searchQuery={filters.q || undefined}
        viewingId={viewingId}
        onPageChange={page => setFilters(f => ({ ...f, page }))}
        onView={setViewingId}
      />

      {/* Drawer — ver y editar activo existente */}
      {viewingId !== null && (
        <AssetDrawer
          assetId={viewingId}
          onClose={() => setViewingId(null)}
          onSaved={handleDrawerSaved}
        />
      )}

      {/* Modal — crear nuevo activo */}
      {showCreate && (
        <AssetFormModal
          assetId={null}
          onClose={() => setShowCreate(false)}
          onSaved={handleCreateSaved}
        />
      )}

      {/* Modal exportar */}
      {showExport && (
        <ExportModal
          filters={filters}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Drawer importaciones n8n */}
      {showImports && (
        <ImportsDrawer 
          onClose={() => setShowImports(false)} 
          onApplyFilter={(q) => applyFilter({ q })}
        />
      )}
    </div>
  )
}
