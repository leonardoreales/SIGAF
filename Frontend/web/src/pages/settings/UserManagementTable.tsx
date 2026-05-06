import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Crown, Shield, Package, Eye, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { apiUsers, type SystemUser } from '../../lib/api'
import { UserEditModal } from './UserEditModal'

const ROLE_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ADMIN:         { label: 'Admin',         cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-gold border border-amber-200 dark:border-amber-700/40',         icon: <Crown   size={11} /> },
  ACTIVOS_FIJOS: { label: 'Activos Fijos', cls: 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400  border border-blue-200  dark:border-blue-700/40',  icon: <Shield  size={11} /> },
  COMPRAS:       { label: 'Compras',       cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700/40', icon: <Package size={11} /> },
  VIEWER:        { label: 'Espectador',    cls: 'bg-gray-100  text-gray-600  dark:bg-mi-700/60   dark:text-mi-400   border border-gray-200  dark:border-mi-600/40',    icon: <Eye     size={11} /> },
}

function Avatar({ user }: { user: SystemUser }) {
  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mi-400 to-mi-600 dark:from-mi-600 dark:to-mi-800 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
      {initials}
    </div>
  )
}

export function UserManagementTable() {
  const [editing, setEditing] = useState<SystemUser | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn:  apiUsers.list,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400 dark:text-mi-500 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Cargando usuarios…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-red-500 dark:text-red-400 text-sm">
        <AlertCircle size={16} />
        No se pudo cargar la lista de usuarios.
      </div>
    )
  }

  return (
    <>
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-mi-700/40">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide">
                Usuario
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide hidden md:table-cell">
                Cargo
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide hidden lg:table-cell">
                Dependencia
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide">
                Rol
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 dark:text-mi-500 uppercase tracking-wide">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-mi-700/20">
            {users?.map(u => {
              const meta = ROLE_META[u.role] ?? ROLE_META.VIEWER
              return (
                <tr key={u.email}
                  className={`hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>

                  {/* Usuario */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-mi-100 truncate">
                          {u.name || '—'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-mi-500 font-mono truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 py-3.5 text-gray-600 dark:text-mi-300 hidden md:table-cell">
                    {u.cargo}
                  </td>

                  {/* Dependencia */}
                  <td className="px-4 py-3.5 text-gray-600 dark:text-mi-300 hidden lg:table-cell">
                    {u.dependencia}
                  </td>

                  {/* Rol */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      u.isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-400 dark:text-mi-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-mi-600'}`} />
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acción */}
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setEditing(u)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-mi-300 hover:bg-gray-100 dark:hover:bg-mi-700 border border-gray-200 dark:border-mi-600/60 transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {users?.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400 dark:text-mi-500">
            No hay usuarios registrados en el sistema.
          </p>
        )}
      </div>

      {/* Footer: total */}
      {users && users.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 dark:border-mi-700/30 text-xs text-gray-400 dark:text-mi-500">
          {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} en el sistema
        </div>
      )}

      {/* Modal edición */}
      {editing && (
        <UserEditModal user={editing} onClose={() => setEditing(null)} />
      )}
    </>
  )
}
