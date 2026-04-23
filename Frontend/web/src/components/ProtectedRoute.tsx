import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  // Esperar rehydratación desde localStorage antes de decidir redirigir
  // Evita el flash de /login en recargas con sesión activa
  if (isLoading) return null

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
