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
  '/dashboard':   'Dashboard',
}

export default function Layout() {
  const { user }     = useAuth()
  const { pathname } = useLocation()
  const pageTitle    = ROUTE_LABELS[pathname] ?? 'SIGAF'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-mi-900 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Área de contenido ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="
          h-14 shrink-0 flex items-center justify-between px-5
          bg-white dark:bg-mi-900/80
          border-b border-gray-200 dark:border-white/[0.06]
          backdrop-blur-sm
        ">
          {/* Título de la sección activa + escudo */}
          <div className="flex items-center gap-2.5">
            <img
              src="/escudo.webp"
              alt="SIGAF"
              className="escudo-img w-6 h-6 object-contain"
            />
            <span className="font-syne font-semibold text-[15px] text-gray-900 dark:text-mi-100 tracking-tight">
              {pageTitle}
            </span>
          </div>

          {/* Usuario activo — solo visual, acciones en sidebar */}
          {user && (
            <div className="flex items-center gap-2.5">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full ring-1 ring-gray-200 dark:ring-mi-700 object-cover"
                />
              )}
              <span className="text-[13px] text-gray-500 dark:text-mi-400 hidden sm:block max-w-[200px] truncate">
                {user.name}
              </span>
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
