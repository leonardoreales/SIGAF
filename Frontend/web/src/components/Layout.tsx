import { Outlet, NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-blue-700 tracking-tight select-none">
              SIGAF
            </span>
            <nav className="flex items-center gap-4">
              <NavLink
                to="/assets"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Activos
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full ring-2 ring-blue-100 object-cover"
              />
            )}
            <span className="text-sm text-gray-700 hidden sm:block max-w-[200px] truncate">
              {user?.name}
            </span>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors ml-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
