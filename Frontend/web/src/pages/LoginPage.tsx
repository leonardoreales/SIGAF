import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, isLoading, error, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) navigate('/dashboard', { replace: true })
  }, [user, isLoading, navigate])

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return
    try {
      await login(credentialResponse.credential)
      navigate('/dashboard', { replace: true })
    } catch {
      // error expuesto en AuthContext
    }
  }

  return (
    <div className="
      min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br from-gray-100 to-gray-200
      dark:bg-none dark:bg-mi-900
      transition-colors duration-300
    ">
      {/* Grid pattern en dark */}
      <div className="
        hidden dark:block fixed inset-0 pointer-events-none z-0
        [background-image:linear-gradient(rgba(110,96,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(110,96,184,0.06)_1px,transparent_1px)]
        [background-size:40px_40px]
      " />

      <div className="
        relative z-10 w-full max-w-sm flex flex-col items-center gap-6
        bg-white dark:bg-mi-800
        rounded-2xl shadow-xl dark:shadow-[0_0_60px_rgba(74,58,140,0.3)]
        border border-gray-100 dark:border-mi-600/40
        p-8
      ">
        {/* Logo institucional completo + título */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-americana-horizontal.png"
            alt="Corporación Universitaria Americana"
            className="w-56 max-w-full object-contain drop-shadow-[0_0_16px_rgba(245,200,66,0.45)]"
            style={{ filter: 'brightness(1.1) sepia(1) hue-rotate(40deg) saturate(2)' }}
          />
          <div className="text-center mt-2">
            <h1 className="text-3xl font-syne font-bold tracking-tight text-gray-900 dark:text-mi-50">
              SIGAF
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-mi-300">
              Sistema de Gestión de Activos Fijos
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-mi-400">
              Corporación Universitaria Americana
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100 dark:bg-mi-700/60" />

        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm text-gray-600 dark:text-mi-300 text-center">
            Ingresa con tu cuenta institucional
          </p>

          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {}}
            useOneTap
            theme="outline"
            shape="rectangular"
            locale="es"
            width="280"
          />

          {error && (
            <div className="w-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              {(error.toLowerCase().includes('dominio') || error.toLowerCase().includes('americana')) && (
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                  Solo cuentas <strong>@americana.edu.co</strong> tienen acceso.
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-mi-500 text-center">
          Acceso restringido a <strong className="dark:text-mi-300">@americana.edu.co</strong>
        </p>
      </div>
    </div>
  )
}
