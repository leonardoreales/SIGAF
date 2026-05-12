import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title = 'Confirmar acción', message,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'danger', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', fn)
    confirmRef.current?.focus()
    return () => document.removeEventListener('keydown', fn)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(3,7,20,0.6)', backdropFilter: 'blur(4px)' }}
        className="animate-fade-in"
      />

      {/* Panel */}
      <div
        className="animate-slide-up"
        style={{
          position: 'relative',
          width: 'min(420px, 100vw - 48px)',
          background: 'var(--modal-bg)',
          backgroundImage: 'var(--modal-bg-grad)',
          border: '1px solid var(--modal-border)',
          borderRadius: 16,
          boxShadow: 'var(--modal-shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDanger
              ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
            color: isDanger ? '#EF4444' : '#F59E0B',
            border: `1px solid ${isDanger ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
          }}>
            <AlertTriangle size={20} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontFamily: "'Syne', system-ui, sans-serif",
              fontSize: 16, fontWeight: 700,
              color: 'var(--modal-text)',
            }}>
              {title}
            </h3>
            <p style={{
              margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.5,
              color: 'var(--modal-text-sub)',
            }}>
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 28, height: 28, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--modal-close-color)',
              background: 'var(--modal-close-bg)',
              border: '1px solid var(--modal-close-border)',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              background: 'var(--modal-cancel-bg)',
              color: 'var(--modal-cancel-color)',
              border: '1px solid var(--modal-cancel-border)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: isDanger
                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                : 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              boxShadow: isDanger
                ? '0 4px 14px rgba(239,68,68,0.35)'
                : '0 4px 14px rgba(245,158,11,0.35)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
