import { useState } from 'react'
import { X, AlertTriangle, Copy, List, Tag } from 'lucide-react'
import { cn } from '../../../lib/utils'

export type ExpansionMode = 'na' | 'sequential' | 'manual'

interface Props {
  itemName:   string
  quantity:   number
  onConfirm:  (mode: ExpansionMode, prefix?: string) => void
  onCancel:   () => void
  /** true = serial requerido (cómputo/maquinaria), false = opcional */
  serialRequired: boolean
}

export default function QuantityModal({ itemName, quantity, onConfirm, onCancel, serialRequired }: Props) {
  const [mode,   setMode]   = useState<ExpansionMode>(serialRequired ? 'manual' : 'na')
  const [prefix, setPrefix] = useState('')

  const previewRows = Math.min(quantity, 3)

  function handleConfirm() {
    if (mode === 'sequential' && !prefix.trim()) return
    onConfirm(mode, mode === 'sequential' ? prefix.trim() : undefined)
  }

  const modeOptions: { value: ExpansionMode; icon: React.ElementType; label: string; desc: string; disabled?: boolean }[] = [
    {
      value:    'na',
      icon:     Copy,
      label:    'Sin serial — todos N/A',
      desc:     'Más rápido. Ideal para activos que no tienen número de serie.',
      disabled: serialRequired,
    },
    {
      value: 'sequential',
      icon:  Tag,
      label: 'Prefijo secuencial',
      desc:  `Sistema genera: ${prefix || 'PREF'}-001 hasta ${prefix || 'PREF'}-${String(quantity).padStart(3, '0')}`,
    },
    {
      value: 'manual',
      icon:  List,
      label: 'Entrada manual fila a fila',
      desc:  'Expande las filas en la grilla para que ingreses cada serial individualmente.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl bg-white dark:bg-[#0E0818] border border-gray-200 dark:border-white/[0.08] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="min-w-0">
            <h2 className="font-syne font-bold text-base text-gray-900 dark:text-mi-50">
              Expansión de activos
            </h2>
            <p className="text-xs text-gray-500 dark:text-mi-400 mt-0.5 truncate">
              Crearás <span className="font-semibold text-gray-700 dark:text-mi-200">{quantity} registros</span> de "{itemName}"
            </p>
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-mi-500 dark:hover:text-mi-200 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Warning for high qty */}
        {quantity > 100 && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2.5">
            <AlertTriangle size={14} className="shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Cantidad alta ({quantity}). Verifica que sea correcta antes de continuar.
            </p>
          </div>
        )}

        {/* Editable quantity */}
        <div className="px-6 pt-4 pb-2">
          <label className="text-xs font-medium text-gray-500 dark:text-mi-400 uppercase tracking-wide">
            Confirmar cantidad
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50">{quantity}</span>
            <span className="text-sm text-gray-400 dark:text-mi-500">unidades</span>
          </div>
        </div>

        {/* Mode selection */}
        <div className="px-6 pb-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-mi-400 uppercase tracking-wide mb-2.5">
            ¿Cómo asignar el serial?
          </p>

          {modeOptions.map(({ value, icon: Icon, label, desc, disabled }) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setMode(value)}
              className={cn(
                'w-full flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                mode === value && !disabled
                  ? 'border-blue-400 bg-blue-50/60 dark:border-gold/50 dark:bg-gold/[0.06]'
                  : disabled
                  ? 'border-gray-100 dark:border-mi-700/40 opacity-40 cursor-not-allowed'
                  : 'border-gray-200 dark:border-mi-700/50 hover:border-gray-300 dark:hover:border-mi-500/60 cursor-pointer',
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                mode === value && !disabled
                  ? 'border-blue-500 dark:border-gold'
                  : 'border-gray-300 dark:border-mi-500',
              )}>
                {mode === value && !disabled && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-gold" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={cn(
                    mode === value && !disabled
                      ? 'text-blue-600 dark:text-gold'
                      : 'text-gray-400 dark:text-mi-500',
                  )} />
                  <span className={cn(
                    'text-sm font-medium',
                    mode === value && !disabled
                      ? 'text-blue-700 dark:text-gold'
                      : 'text-gray-700 dark:text-mi-200',
                  )}>
                    {label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-mi-400 mt-0.5">{desc}</p>

                {/* Prefix input for sequential mode */}
                {value === 'sequential' && mode === 'sequential' && (
                  <input
                    autoFocus
                    type="text"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value)}
                    placeholder="Ej: SILLA, BAT, 0052…"
                    onClick={e => e.stopPropagation()}
                    className="mt-2 w-full rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors bg-white border border-blue-300 dark:bg-mi-700 dark:border-gold/40 dark:text-mi-100 dark:placeholder:text-mi-500 focus:border-blue-400 dark:focus:border-gold/60"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="mx-6 mb-4 rounded-lg bg-gray-50 dark:bg-mi-900/50 border border-gray-100 dark:border-mi-700/40 p-3">
          <p className="text-xs font-medium text-gray-400 dark:text-mi-500 mb-2">Vista previa</p>
          <div className="space-y-1">
            {Array.from({ length: previewRows }).map((_, i) => {
              const serialLabel =
                mode === 'na'         ? 'N/A' :
                mode === 'sequential' ? `${prefix || 'PREF'}-${String(i + 1).padStart(3, '0')}` :
                                        <span className="text-amber-500 dark:text-amber-400 italic">— por llenar</span>
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-mi-300 font-mono">
                  <span className="text-gray-400 dark:text-mi-400 w-4 text-right">{i + 1}</span>
                  <span className="truncate">{itemName.slice(0, 28)}{itemName.length > 28 ? '…' : ''}</span>
                  <span className="ml-auto shrink-0">{serialLabel}</span>
                </div>
              )
            })}
            {quantity > previewRows && (
              <p className="text-xs text-gray-400 dark:text-mi-400 text-center pt-0.5">
                … y {quantity - previewRows} más
              </p>
            )}
          </div>
        </div>

        {/* After-expand hint */}
        <p className="px-6 pb-4 text-xs text-gray-400 dark:text-mi-500 text-center">
          Puedes editar cada fila en la grilla antes de enviar.
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 dark:text-mi-300 dark:hover:bg-white/[0.05] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={mode === 'sequential' && !prefix.trim()}
            className="
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-mi-600 dark:hover:bg-mi-500 dark:text-mi-50
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Confirmar y expandir →
          </button>
        </div>

      </div>
    </div>
  )
}
