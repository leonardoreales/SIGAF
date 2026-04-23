import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout        from './components/Layout'
import LoginPage     from './pages/LoginPage'
import AssetsPage    from './pages/assets/AssetsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/assets" element={<AssetsPage />} />
        </Route>
      </Route>

      {/* Cualquier ruta no mapeada → assets */}
      <Route path="*" element={<Navigate to="/assets" replace />} />
    </Routes>
  )
}
