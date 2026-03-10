import type { Metadata } from 'next'
import './globals.css'
import AppShell from '../components/AppShell'

export const metadata: Metadata = {
  title: 'Backoffice Viajes Altairis',
  description: 'MVP operativo de gestion hotelera y reservas para Viajes Altairis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
