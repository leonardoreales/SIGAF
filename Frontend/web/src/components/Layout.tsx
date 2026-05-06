import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

const ROUTE_LABELS: Record<string, string> = {
  '/assets':      'Activos Fijos',
  '/transfers':   'Traslados',
  '/history':     'Historial',
  '/writeoffs':   'Bajas',
  '/assignments': 'Asignaciones',
  '/actas':       'Actas',
  '/reports':     'Reportes',
  '/statistics':  'Estadísticas Avanzadas',
  '/dashboard':   'Dashboard',
  '/recepciones': 'Recepciones',
  '/settings':    'Perfil & Configuración',
}

const ROUTE_SECTIONS: Record<string, string> = {
  '/assets':      'Inventario',
  '/transfers':   'Operaciones',
  '/history':     'Operaciones',
  '/writeoffs':   'Operaciones',
  '/assignments': 'Gestión',
  '/actas':       'Gestión',
  '/reports':     'Análisis',
  '/statistics':  'Análisis',
  '/dashboard':   'Análisis',
  '/recepciones': 'Compras',
  '/settings':    'Sistema',
}

export default function Layout() {
  const { user }     = useAuth()
  const { pathname } = useLocation()
  const pageTitle    = ROUTE_LABELS[pathname]  ?? 'SIGAF'
  const pageSection  = ROUTE_SECTIONS[pathname] ?? ''

  return (
    <div className="flex h-screen bg-[#F4F7FA] dark:bg-[#060E28] overflow-hidden transition-colors duration-700">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Área de contenido ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="
          h-16 shrink-0 flex items-center justify-between px-6
          bg-white/90 dark:bg-[#0D1B4A]/95
          border-b border-gold/10 dark:border-gold/5
          backdrop-blur-xl z-20
        ">
          {/* Título de sección activa */}
          <div className="flex items-center gap-4">
            <img
              src="/logo-americana.png"
              alt="SIGAF"
              className="escudo-img w-6 h-6 object-contain shrink-0"
            />
            <div className="flex items-center gap-3">
              {pageSection && (
                <>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-gray-400 dark:text-mi-600 uppercase hidden sm:block">
                    {pageSection}
                  </span>
                  <span className="text-gray-300 dark:text-mi-700 hidden sm:block">/</span>
                </>
              )}
              <span className="font-syne font-semibold text-[14px] text-gray-800 dark:text-mi-100 tracking-tight">
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Usuario activo */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-[11px] text-gray-400 dark:text-mi-500 max-w-[180px] truncate">
                  {user.name}
                </span>
              </div>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full ring-1 ring-gray-200 dark:ring-white/[0.10] object-cover"
                />
              )}
            </div>
          )}
        </header>

        {/* ── Main ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-6 py-7">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
