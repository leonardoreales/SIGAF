import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute    from './components/ProtectedRoute'
import Layout            from './components/Layout'
import LoginPage         from './pages/LoginPage'
import AssetsPage        from './pages/assets/AssetsPage'
import DashboardPage     from './pages/dashboard/DashboardPage'
import TransfersPage     from './pages/transfers/TransfersPage'
import ComingSoonPage    from './pages/ComingSoonPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/assets"      element={<AssetsPage />} />
          {/* Operaciones */}
          <Route path="/transfers"   element={<TransfersPage />} />
          <Route path="/history"     element={<ComingSoonPage title="Historial" />} />
          <Route path="/writeoffs"   element={<ComingSoonPage title="Bajas" />} />
          {/* Gestión */}
          <Route path="/assignments" element={<ComingSoonPage title="Asignaciones" />} />
          <Route path="/actas"       element={<ComingSoonPage title="Actas" />} />
          {/* Análisis */}
          <Route path="/reports"     element={<ComingSoonPage title="Reportes" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
