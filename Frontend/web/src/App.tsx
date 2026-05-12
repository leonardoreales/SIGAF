import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute      from './components/ProtectedRoute'
import Layout              from './components/Layout'
import LoginPage           from './pages/LoginPage'
import AssetsPage          from './pages/assets/AssetsPage'
import DashboardPage       from './pages/dashboard/DashboardPage'
import TransfersPage       from './pages/transfers/TransfersPage'
import ComingSoonPage      from './pages/ComingSoonPage'
import SettingsPage        from './pages/settings/SettingsPage'
import RecepcionesPage     from './pages/recepciones/RecepcionesPage'
import NuevaRecepcionPage  from './pages/recepciones/NuevaRecepcionPage'
import MaintenancePage     from './pages/maintenance/MaintenancePage'
import WriteOffsPage       from './pages/writeoffs/WriteOffsPage'
import StatisticsPage     from './pages/stats/StatisticsPage'
import { useRole }         from './hooks/useRole'
import { useAuth }         from './context/AuthContext'
import { Toaster }        from 'sonner'

// Componente para manejar la ruta raíz y fallback de forma inteligente según el rol
function RootRedirect() {
  const { user, isLoading } = useAuth()
  const { isCompras } = useRole()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  if (isCompras) {
    return <Navigate to="/recepciones" replace />
  }
  
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas compartidas por todos (dentro de Layout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Rutas exclusivas de Activos Fijos y Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ACTIVOS_FIJOS', 'VIEWER']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/assets"      element={<AssetsPage />} />
          {/* Operaciones */}
          <Route path="/transfers"   element={<TransfersPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/history"     element={<ComingSoonPage title="Historial" />} />
          <Route path="/writeoffs"   element={<WriteOffsPage />} />
          {/* Gestión */}
          <Route path="/assignments" element={<ComingSoonPage title="Asignaciones" />} />
          <Route path="/actas"       element={<ComingSoonPage title="Actas" />} />
          {/* Análisis */}
          <Route path="/statistics"  element={<StatisticsPage />} />
          <Route path="/reports"     element={<ComingSoonPage title="Reportes" />} />
        </Route>
      </Route>

      {/* Rutas exclusivas de Compras */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COMPRAS']} />}>
        <Route element={<Layout />}>
          <Route path="/recepciones"        element={<RecepcionesPage />} />
          <Route path="/recepciones/nueva"  element={<NuevaRecepcionPage />} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
      <Toaster position="top-right" richColors />
    </Routes>
  )
}
