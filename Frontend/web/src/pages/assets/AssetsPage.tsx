import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, FileDown } from 'lucide-react'
import { apiAssets } from '../../lib/api'
import AssetsFilters  from './AssetsFilters'
import AssetsTable    from './AssetsTable'
import AssetFormModal from './AssetFormModal'
import ExportModal    from './ExportModal'

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
  const [filters,   setFilters]   = useState<FiltersState>(DEFAULT_FILTERS)
  const [editingId,   setEditingId]   = useState<number | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [showExport,  setShowExport]  = useState(false)

  const { data, isLoading, isError } = useQuery({
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

  // Aplicar filtro siempre resetea a página 1
  function applyFilter(partial: Partial<Omit<FiltersState, 'page' | 'limit'>>) {
    setFilters(f => ({ ...f, ...partial, page: 1 }))
  }

  function openCreate() {
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(id: number) {
    setEditingId(id)
    setShowModal(true)
  }

  function handleClose() {
    setShowModal(false)
    setEditingId(null)
  }

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
    handleClose()
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activos Fijos</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.meta.total.toLocaleString('es-CO')} activos registrados
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <FileDown size={16} />
            Exportar
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nuevo activo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <AssetsFilters value={filters} onChange={applyFilter} />

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Error al cargar los activos. Verifica la conexión e intenta recargar.
        </div>
      )}

      {/* Tabla */}
      <AssetsTable
        data={data?.data ?? []}
        meta={data?.meta ?? { total: 0, page: 1, limit: 50, pages: 0 }}
        isLoading={isLoading}
        onPageChange={(page) => setFilters(f => ({ ...f, page }))}
        onEdit={openEdit}
      />

      {/* Modal crear / editar */}
      {showModal && (
        <AssetFormModal
          assetId={editingId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {/* Modal exportar Excel */}
      {showExport && (
        <ExportModal
          filters={filters}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
