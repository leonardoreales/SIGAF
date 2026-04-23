import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { apiCatalogs } from '../../../lib/api'
import { useAssetForm } from './useAssetForm'
import FieldsIdentificacion from './FieldsIdentificacion'
import FieldsUbicacion      from './FieldsUbicacion'
import FieldsAsignacion     from './FieldsAsignacion'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  assetId: number | null   // null = crear, number = editar
  onClose: () => void
  onSaved: () => void
}

// ── Orquestador ───────────────────────────────────────────────────────────────

export default function AssetFormModal({ assetId, onClose, onSaved }: Props) {
  // Lógica del formulario (fetch en editar, estado, submit, error)
  const { values, onChange, onSubmit, isLoading, isSaving, error } =
    useAssetForm({ assetId, onSaved })

  // Catálogos: staleTime Infinity → se cargan una vez y se reutilizan desde caché
  const { data: buildings  = [] } = useQuery({ queryKey: ['catalog', 'buildings'],  queryFn: apiCatalogs.buildings,  staleTime: Infinity })
  const { data: assetTypes = [] } = useQuery({ queryKey: ['catalog', 'assetTypes'], queryFn: apiCatalogs.assetTypes, staleTime: Infinity })
  const { data: areas      = [] } = useQuery({ queryKey: ['catalog', 'areas'],      queryFn: apiCatalogs.areas,      staleTime: Infinity })
  const { data: people     = [] } = useQuery({ queryKey: ['catalog', 'people'],     queryFn: apiCatalogs.people,     staleTime: Infinity })

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isEdit = assetId !== null

  return (
    // Overlay — click fuera cierra
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:py-10"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar activo' : 'Nuevo activo'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-0.5">ID #{assetId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            Cargando datos del activo…
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="px-6 py-5 space-y-8 max-h-[65vh] overflow-y-auto">

              <FieldsIdentificacion
                values={values}
                onChange={onChange}
                assetTypes={assetTypes}
                isEdit={isEdit}
              />

              <hr className="border-gray-100" />

              <FieldsUbicacion
                values={values}
                onChange={onChange}
                buildings={buildings}
                areas={areas}
                isEdit={isEdit}
              />

              <hr className="border-gray-100" />

              <FieldsAsignacion
                values={values}
                onChange={onChange}
                people={people}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors min-w-[130px] text-center"
              >
                {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear activo'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
