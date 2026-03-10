'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, BedDouble, CalendarDays, BookOpen } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hotels', label: 'Hoteles', icon: Building2 },
  { href: '/room-types', label: 'Tipos de Habitacion', icon: BedDouble },
  { href: '/availability', label: 'Disponibilidad', icon: CalendarDays },
  { href: '/reservations', label: 'Reservas', icon: BookOpen },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentPath = pathname ?? ''

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Viajes Altairis</h1>
          <span>Backoffice Operativo</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href)
            return (
              <Link key={href} href={href} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} /> {label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
