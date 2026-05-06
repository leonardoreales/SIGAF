import { useAuth } from '../context/AuthContext'

export type Role = 'ADMIN' | 'ACTIVOS_FIJOS' | 'COMPRAS' | 'VIEWER'

export function useRole() {
  const { user } = useAuth()
  
  const role = (user?.role as Role) || 'VIEWER'

  const isAdmin = role === 'ADMIN'
  const isActivosFijos = role === 'ACTIVOS_FIJOS' || isAdmin
  const isCompras = role === 'COMPRAS'

  const hasRole = (allowedRoles: Role[]) => {
    if (!user) return false
    return allowedRoles.includes(role)
  }

  return {
    role,
    isAdmin,
    isActivosFijos,
    isCompras,
    hasRole,
    cargo: user?.cargo,
    dependencia: user?.dependencia,
  }
}
