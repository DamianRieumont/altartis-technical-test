import { Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, BedDouble, CalendarDays, BookOpen } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Hotels from './pages/Hotels'
import RoomTypes from './pages/RoomTypes'
import AvailabilityPage from './pages/AvailabilityPage'
import Reservations from './pages/Reservations'

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Viajes Altairis</h1>
          <span>Backoffice Operativo</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Building2 size={20} /> Hoteles
          </NavLink>
          <NavLink to="/room-types" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BedDouble size={20} /> Tipos de Habitacion
          </NavLink>
          <NavLink to="/availability" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CalendarDays size={20} /> Disponibilidad
          </NavLink>
          <NavLink to="/reservations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} /> Reservas
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/room-types" element={<RoomTypes />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/reservations" element={<Reservations />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
