import { X, RefreshCw } from 'lucide-react'
import type { SyncEvent } from '../lib/api'

interface Props {
  event:     SyncEvent
  onDismiss: () => void
}

export default function SyncBanner({ event, onDismiss }: Props) {
  const time = new Date(event.createdAt).toLocaleString('es-CO', {
    hour:   '2-digit',
    minute: '2-digit',
    day:    '2-digit',
    month:  'short',
  })

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm
        bg-amber-50 border border-amber-200 text-amber-900
        dark:bg-gold/10 dark:border-gold/20 dark:text-gold
      "
    >
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw size={14} className="shrink-0" />
        <span className="font-medium">
          Sincronización completada
        </span>
        <span className="truncate opacity-80">
          · <strong>{event.insertados}</strong> activos añadidos desde <em className="not-italic font-semibold">{event.sourceSheet}</em>
          {event.fallidos > 0 && (
            <span className="ml-1 opacity-70">({event.fallidos} fallidos)</span>
          )}
        </span>
        <span className="shrink-0 text-xs opacity-50">{time}</span>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  )
}
