import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: '80px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(233,199,110,0.12)',
            boxShadow: '0 0 0 1px rgba(233,199,110,0.25), 0 0 24px rgba(233,199,110,0.1)',
          }}>
            <AlertTriangle size={24} style={{ color: '#E9C76E' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--tbl-text)', margin: 0 }}>
            Algo salió mal
          </p>
          <p style={{ fontSize: 13, color: 'var(--tbl-text-sub)', margin: 0 }}>
            Ocurrió un error inesperado. Recarga la página para continuar.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 4, padding: '8px 20px',
              borderRadius: 8, border: '1px solid rgba(233,199,110,0.4)',
              background: 'transparent', color: '#E9C76E',
              fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
