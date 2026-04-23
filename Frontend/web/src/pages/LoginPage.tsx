import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, isLoading, error, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) navigate('/assets', { replace: true })
  }, [user, isLoading, navigate])

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return
    try {
      await login(credentialResponse.credential)
      navigate('/assets', { replace: true })
    } catch {
      // El error ya queda expuesto en el estado de AuthContext
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700 tracking-tight">SIGAF</h1>
          <p className="mt-1 text-sm text-gray-500">Sistema de Gestión de Activos Fijos</p>
          <p className="mt-0.5 text-xs text-gray-400">Corporación Universitaria Americana</p>
        </div>

        <div className="w-full h-px bg-gray-100" />

        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm text-gray-600 text-center">
            Ingresa con tu cuenta institucional
          </p>

          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => { /* el botón de Google falló antes del servidor */ }}
            useOneTap
            theme="outline"
            shape="rectangular"
            locale="es"
            width="280"
          />

          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              {error.toLowerCase().includes('dominio') || error.toLowerCase().includes('americana') ? (
                <p className="text-xs text-red-500 mt-1">
                  Solo cuentas <strong>@americana.edu.co</strong> tienen acceso.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Acceso restringido a <strong>@americana.edu.co</strong>
        </p>
      </div>
    </div>
  )
}
