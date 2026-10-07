import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import Layout from './components/Layout'
import Calendario from './pages/Calendario'
import Equipos from './pages/Equipos'
import Home from './pages/Home'
import Login from './pages/Login'
import Reservas from './pages/Reservas'
import Torneos from './pages/Torneos'
import Usuarios from './pages/Usuarios'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDF7FF] text-[15px] text-black/60">
        Cargando…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Layout withRightPanel />
          </Protected>
        }
      >
        <Route path="/" element={<Home />} />
      </Route>
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/torneos" element={<Torneos />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
