import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { apiCatalogs } from '../../../lib/api'
import { useAssetForm } from './useAssetForm'
import FieldsIdentificacion from './FieldsIdentificacion'
import FieldsUbicacion      from './FieldsUbicacion'
import FieldsAsignacion     from './FieldsAsignacion'

interface Props {
  assetId: number | null
  onClose: () => void
  onSaved: () => void
}

export default function AssetFormModal({ assetId, onClose, onSaved }: Props) {
  const { values, onChange, onSubmit, isLoading, isSaving, error } =
    useAssetForm({ assetId, onSaved })

  const { data: buildings  = [] } = useQuery({ queryKey: ['catalog', 'buildings'],  queryFn: apiCatalogs.buildings,  staleTime: Infinity })
  const { data: assetTypes = [] } = useQuery({ queryKey: ['catalog', 'assetTypes'], queryFn: apiCatalogs.assetTypes, staleTime: Infinity })
  const { data: areas      = [] } = useQuery({ queryKey: ['catalog', 'areas'],      queryFn: apiCatalogs.areas,      staleTime: Infinity })
  const { data: people     = [] } = useQuery({ queryKey: ['catalog', 'people'],     queryFn: apiCatalogs.people,     staleTime: Infinity })

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isEdit = assetId !== null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:py-10"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="
        w-full max-w-2xl rounded-2xl shadow-2xl
        bg-white dark:bg-mi-800
        dark:shadow-[0_0_60px_rgba(10,2,44,0.6)]
        dark:border dark:border-mi-700/40
      ">

        {/* Header */}
        <div className="
          flex items-center justify-between px-6 py-4 border-b
          border-gray-200 dark:border-mi-700/50
        ">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-mi-50">
              {isEdit ? 'Editar activo' : 'Nuevo activo'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 dark:text-mi-500 mt-0.5">ID #{assetId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="
              p-1.5 rounded-lg transition-colors
              text-gray-400 hover:text-gray-700 hover:bg-gray-100
              dark:text-mi-500 dark:hover:text-mi-200 dark:hover:bg-mi-700/50
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400 dark:text-mi-500">
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

              <hr className="border-gray-100 dark:border-mi-700/40" />

              <FieldsUbicacion
                values={values}
                onChange={onChange}
                buildings={buildings}
                areas={areas}
                isEdit={isEdit}
              />

              <hr className="border-gray-100 dark:border-mi-700/40" />

              <FieldsAsignacion
                values={values}
                onChange={onChange}
                people={people}
              />

              {error && (
                <div className="
                  rounded-lg px-4 py-3 text-sm
                  bg-red-50 border border-red-200 text-red-700
                  dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400
                ">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="
              flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl border-t
              bg-gray-50 border-gray-200
              dark:bg-mi-850 dark:border-mi-700/50
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-white border border-gray-300 text-gray-700 hover:bg-gray-50
                  dark:bg-mi-750 dark:border-mi-600 dark:text-mi-200 dark:hover:bg-mi-700
                "
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors min-w-[130px] text-center
                  disabled:opacity-60 disabled:cursor-not-allowed
                  bg-blue-600 hover:bg-blue-700 text-white
                  dark:bg-gold dark:hover:bg-gold-500 dark:text-mi-900 dark:font-semibold
                "
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
