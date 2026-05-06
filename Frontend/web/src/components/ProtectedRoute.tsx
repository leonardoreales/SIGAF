import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole, type Role } from '../hooks/useRole'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const { hasRole } = useRole()

  // Esperar rehydratación desde localStorage antes de decidir redirigir
  // Evita el flash de /login en recargas con sesión activa
  if (isLoading) return null

  if (!user) return <Navigate to="/login" replace />

  // Si hay roles permitidos y el usuario no tiene ninguno, redirigir al dashboard o "acceso denegado"
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Por simplicidad redirigimos al inicio. Podría ser a una página de 403.
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
