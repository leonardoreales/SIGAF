import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Search, Loader2 } from 'lucide-react'
import { apiAssets, apiCatalogs, apiTransfers } from '../../lib/api'
import type { Transfer, TransferReason } from '../../lib/api'
import { cn } from '../../lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

const REASONS = [
  { value: 'REUBICACION',               label: 'Reubicación' },
  { value: 'MANTENIMIENTO',             label: 'Mantenimiento' },
  { value: 'DONACION',                  label: 'Donación' },
  { value: 'PRESTAMO',                  label: 'Préstamo' },
  { value: 'ACTUALIZACION_RESPONSABLE', label: 'Actualización de responsable' },
  { value: 'OTRO',                      label: 'Otro' },
]

const STATUSES = [
  { value: 'PENDIENTE',  label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO',  label: 'Cancelado' },
]

interface Props {
  transferId: number | null
  onClose:    () => void
  onSaved:    () => void
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-mi-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = `
  w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors
  bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400
  focus:border-gold/60 focus:ring-2 focus:ring-gold/30
  dark:bg-mi-800 dark:border-mi-700/60 dark:text-mi-100 dark:placeholder:text-mi-500
  dark:focus:border-gold/50 dark:focus:ring-gold/20
  disabled:opacity-50 disabled:cursor-not-allowed
`

const selectCls = inputCls + ' cursor-pointer'

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransferFormModal({ transferId, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const isEdit      = transferId !== null

  // ── Catalogs ──────────────────────────────────────────────────────────────
  const { data: buildings = [] } = useQuery({ queryKey: ['catalog', 'buildings'], queryFn: apiCatalogs.buildings, staleTime: Infinity })
  const { data: areas     = [] } = useQuery({ queryKey: ['catalog', 'areas'],     queryFn: apiCatalogs.areas,     staleTime: Infinity })
  const { data: people    = [] } = useQuery({ queryKey: ['catalog', 'people'],    queryFn: apiCatalogs.people,    staleTime: Infinity })

  // ── Load existing transfer (edit mode) ────────────────────────────────────
  const { data: existing, isLoading: loadingTransfer } = useQuery({
    queryKey: ['transfers', transferId],
    queryFn:  () => apiTransfers.get(transferId!),
    enabled:  isEdit,
  })

  // ── Asset search (create mode) ────────────────────────────────────────────
  const [plateQuery, setPlateQuery]     = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [selectedAssetName, setSelectedAssetName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: assetResults, isFetching: searchingAssets } = useQuery({
    queryKey: ['asset-search', plateQuery],
    queryFn:  () => apiAssets.list({ q: plateQuery, limit: 8 }),
    enabled:  plateQuery.trim().length >= 2,
    staleTime: 0,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    status:          'PENDIENTE',
    destBuildingId:  '',
    destAreaId:      '',
    destPersonId:    '',
    destResponsible: '',
    destFloor:       '',
    destBlock:       '',
    destLocation:    '',
    reason:          '',
    requestedBy:     '',
    notes:           '',
    scheduledAt:     '',
  })

  useEffect(() => {
    if (existing) {
      setForm({
        status:          existing.status,
        destBuildingId:  existing.destBuildingId?.toString()  ?? '',
        destAreaId:      existing.destAreaId?.toString()       ?? '',
        destPersonId:    existing.destPersonId?.toString()     ?? '',
        destResponsible: existing.destResponsible              ?? '',
        destFloor:       existing.destFloor                    ?? '',
        destBlock:       existing.destBlock                    ?? '',
        destLocation:    existing.destLocation                 ?? '',
        reason:          existing.reason                       ?? '',
        requestedBy:     existing.requestedBy                  ?? '',
        notes:           existing.notes                        ?? '',
        scheduledAt:     existing.scheduledAt                  ?? '',
      })
    }
  }, [existing])

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }))

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [error, setError] = useState('')

  const createMut = useMutation({
    mutationFn: () => apiTransfers.create({
      assetId:         selectedAssetId!,
      destBuildingId:  Number(form.destBuildingId),
      destAreaId:      form.destAreaId      ? Number(form.destAreaId)     : undefined,
      destPersonId:    form.destPersonId    ? Number(form.destPersonId)   : undefined,
      destResponsible: form.destResponsible || undefined,
      destFloor:       form.destFloor       || undefined,
      destBlock:       form.destBlock       || undefined,
      destLocation:    form.destLocation    || undefined,
      reason:          (form.reason || undefined) as TransferReason | undefined,
      requestedBy:     form.requestedBy     || undefined,
      notes:           form.notes           || undefined,
      scheduledAt:     form.scheduledAt     || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      onSaved()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => apiTransfers.update(transferId!, {
      status:          (form.status || undefined) as Transfer['status'] | undefined,
      destBuildingId:  form.destBuildingId  ? Number(form.destBuildingId)  : undefined,
      destAreaId:      form.destAreaId      ? Number(form.destAreaId)      : null,
      destPersonId:    form.destPersonId    ? Number(form.destPersonId)    : null,
      destResponsible: form.destResponsible || undefined,
      destFloor:       form.destFloor       || undefined,
      destBlock:       form.destBlock       || undefined,
      destLocation:    form.destLocation    || undefined,
      reason:          (form.reason || undefined) as TransferReason | undefined,
      requestedBy:     form.requestedBy     || undefined,
      notes:           form.notes           || undefined,
      scheduledAt:     form.scheduledAt     || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      onSaved()
    },
    onError: (err: Error) => setError(err.message),
  })

  const isSaving = createMut.isPending || updateMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isEdit && !selectedAssetId) { setError('Selecciona un activo para el traslado.'); return }
    if (!form.destBuildingId)         { setError('El edificio destino es obligatorio.'); return }
    isEdit ? updateMut.mutate() : createMut.mutate()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:py-10"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="
        w-full max-w-xl rounded-2xl shadow-2xl
        bg-white dark:bg-mi-850
        dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_80px_rgba(0,0,0,0.7)]
        dark:border dark:border-mi-700/30
      ">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-mi-700/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-mi-50">
              {isEdit ? 'Editar traslado' : 'Nuevo traslado'}
            </h2>
            {isEdit && existing && (
              <p className="text-xs text-gray-400 dark:text-mi-500 mt-0.5 font-mono">
                {existing.transferNumber}
              </p>
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
        {isEdit && loadingTransfer ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400 dark:text-mi-500">
            Cargando traslado…
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* ── Activo (solo en create) ──────────────────────────── */}
              {!isEdit && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-mi-500 mb-4">
                    Activo a trasladar
                  </p>
                  <Field label="Buscar por placa o nombre *">
                    <div ref={searchRef} className="relative">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Escribe la placa o nombre del activo…"
                          value={selectedAssetId ? `${selectedAssetName}` : plateQuery}
                          onChange={e => {
                            setPlateQuery(e.target.value)
                            setSelectedAssetId(null)
                            setSelectedAssetName('')
                            setShowDropdown(true)
                          }}
                          onFocus={() => { if (plateQuery.length >= 2) setShowDropdown(true) }}
                          className={cn(inputCls, 'pl-9')}
                        />
                        {searchingAssets && (
                          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 animate-spin" />
                        )}
                      </div>

                      {showDropdown && assetResults && assetResults.data.length > 0 && !selectedAssetId && (
                        <div className="
                          absolute z-10 top-full left-0 right-0 mt-1 rounded-lg overflow-hidden
                          border border-gray-200 bg-white shadow-lg
                          dark:border-mi-600 dark:bg-mi-800 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                        ">
                          {assetResults.data.map(asset => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                setSelectedAssetId(asset.id)
                                setSelectedAssetName(asset.name)
                                setPlateQuery(asset.plate ?? asset.name)
                                setShowDropdown(false)
                              }}
                              className="
                                w-full text-left px-4 py-2.5 text-sm transition-colors
                                hover:bg-gray-50 dark:hover:bg-mi-750
                                border-b border-gray-100 dark:border-mi-700/30 last:border-0
                              "
                            >
                              <span className="font-mono text-xs text-gray-500 dark:text-gold/70 mr-2">
                                {asset.plate ?? '—'}
                              </span>
                              <span className="text-gray-900 dark:text-mi-100 truncate">
                                {asset.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>

                  {selectedAssetId && (
                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      Activo seleccionado · ID #{selectedAssetId}
                    </p>
                  )}
                </div>
              )}

              {/* ── Estado (solo en edit) ────────────────────────────── */}
              {isEdit && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-mi-500 mb-1">
                    Estado del traslado
                  </p>
                  <Field label="Estado *">
                    <select value={form.status} onChange={set('status')} className={selectCls}>
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              <hr className="border-gray-100 dark:border-mi-700/40" />

              {/* ── Destino ──────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-mi-500 mb-4">
                  Ubicación destino
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Edificio destino *">
                      <select value={form.destBuildingId} onChange={set('destBuildingId')} className={selectCls}>
                        <option value="">Seleccionar edificio…</option>
                        {buildings.filter(b => b.active).map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Área destino">
                    <select value={form.destAreaId} onChange={set('destAreaId')} className={selectCls}>
                      <option value="">Sin área específica</option>
                      {areas.filter(a => a.active).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Responsable destino">
                    <select value={form.destPersonId} onChange={set('destPersonId')} className={selectCls}>
                      <option value="">Sin asignar</option>
                      {people.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.fullName}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Piso">
                    <input type="text" value={form.destFloor} onChange={set('destFloor')} placeholder="Ej. 2" className={inputCls} />
                  </Field>

                  <Field label="Bloque / Sala">
                    <input type="text" value={form.destBlock} onChange={set('destBlock')} placeholder="Ej. B-201" className={inputCls} />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Ubicación específica">
                      <input type="text" value={form.destLocation} onChange={set('destLocation')} placeholder="Descripción detallada…" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-mi-700/40" />

              {/* ── Datos del traslado ───────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-mi-500 mb-4">
                  Información del traslado
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Motivo">
                    <select value={form.reason} onChange={set('reason')} className={selectCls}>
                      <option value="">Sin especificar</option>
                      {REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Fecha programada">
                    <input type="date" value={form.scheduledAt} onChange={set('scheduledAt')} className={inputCls} />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Solicitado por">
                      <input type="text" value={form.requestedBy} onChange={set('requestedBy')} placeholder="Nombre de quien solicita…" className={inputCls} />
                    </Field>
                  </div>

                  <div className="col-span-2">
                    <Field label="Observaciones">
                      <textarea
                        value={form.notes}
                        onChange={set('notes')}
                        rows={3}
                        placeholder="Notas adicionales…"
                        className={cn(inputCls, 'resize-none')}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Error */}
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
              bg-gray-50/60 border-gray-100
              dark:bg-mi-900/40 dark:border-white/[0.04]
            ">
              <button
                type="button"
                onClick={onClose}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  bg-white border border-gray-200 text-gray-700 hover:bg-gray-50
                  dark:bg-mi-800 dark:border-mi-700/50 dark:text-mi-300 dark:hover:bg-mi-750
                "
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors min-w-[140px] text-center
                  disabled:opacity-60 disabled:cursor-not-allowed
                  bg-gray-900 hover:bg-gray-800 text-white
                  dark:bg-gold dark:hover:bg-gold-300 dark:text-mi-950 dark:font-semibold
                "
              >
                {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear traslado'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
