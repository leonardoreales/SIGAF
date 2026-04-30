import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, FileDown } from 'lucide-react'
import { apiAssets, ApiError } from '../../lib/api'
import type { SyncEvent }  from '../../lib/api'
import { useSyncEvents }   from '../../hooks/useSyncEvents'
import { activityBus }     from '../../lib/activityBus'
import SyncBanner          from '../../components/SyncBanner'
import AssetsFilters       from './AssetsFilters'
import AssetsTable         from './AssetsTable'
import AssetFormModal      from './AssetFormModal'
import ExportModal         from './ExportModal'

export interface FiltersState {
  q:        string
  building: string
  type:     string
  status:   string
  year:     string
  page:     number
  limit:    number
}

const DEFAULT_FILTERS: FiltersState = {
  q: '', building: '', type: '', status: '', year: '', page: 1, limit: 50,
}

export default function AssetsPage() {
  const queryClient = useQueryClient()
  const [filters,    setFilters]    = useState<FiltersState>(DEFAULT_FILTERS)
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [syncEvent,  setSyncEvent]  = useState<SyncEvent | null>(null)

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['assets', filters],
    queryFn:  () =>
      apiAssets.list({
        q:        filters.q        || undefined,
        building: filters.building || undefined,
        type:     filters.type     || undefined,
        status:   filters.status   || undefined,
        year:     filters.year ? Number(filters.year) : undefined,
        page:     filters.page,
        limit:    filters.limit,
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

  function openCreate()         { setEditingId(null); setShowModal(true) }
  function openEdit(id: number) { setEditingId(id);   setShowModal(true) }
  function handleClose()        { setShowModal(false); setEditingId(null) }
  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    activityBus.emit(
      editingId !== null
        ? { type: 'asset_updated', message: 'Activo actualizado', detail: `ID ${editingId}` }
        : { type: 'asset_created', message: 'Activo registrado en el sistema' }
    )
    handleClose()
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50">
            Activos Fijos
          </h1>
          {data && (
            <p className="text-sm text-gray-500 dark:text-mi-400 mt-0.5">
              {data.meta.total.toLocaleString('es-CO')} activos registrados
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExport(true)}
            className="
              flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors
              bg-emerald-600 hover:bg-emerald-700 text-white
              dark:bg-emerald-700/80 dark:hover:bg-emerald-600
            "
          >
            <FileDown size={16} />
            Exportar
          </button>
          <button
            onClick={openCreate}
            className="
              flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-mi-600 dark:hover:bg-mi-500 dark:text-mi-50 dark:border dark:border-mi-500/50
            "
          >
            <Plus size={16} />
            Nuevo activo
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
          <button
            onClick={handleReload}
            className="shrink-0 underline underline-offset-2 hover:no-underline"
          >
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
        onPageChange={(page) => setFilters(f => ({ ...f, page }))}
        onEdit={openEdit}
      />

      {showModal && (
        <AssetFormModal
          assetId={editingId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {showExport && (
        <ExportModal
          filters={filters}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
