'use client'

import { useEffect, useState } from 'react'
import { Building2, BedDouble, BookOpen, CalendarCheck, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../services/api'
import { DashboardData } from '../types'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard.get()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando dashboard...</div>
  if (!data) return <div className="empty-state"><p>Error al cargar el dashboard</p></div>

  const reservationsByStatus = [
    { name: 'Pendientes', value: data.pendingReservations, color: '#d97706' },
    { name: 'Confirmadas', value: data.confirmedReservations, color: '#059669' },
    { name: 'Completadas', value: data.completedReservations, color: '#1a56db' },
    { name: 'Canceladas', value: data.cancelledReservations, color: '#dc2626' },
  ].filter(item => item.value > 0)

  const operativeData = [
    { name: 'Hoteles activos', value: data.activeHotels },
    { name: 'Tipos hab.', value: data.totalRoomTypes },
    { name: 'Hab. disponibles hoy', value: data.todayAvailableRooms },
    { name: 'Reservas activas hoy', value: data.todayActiveReservations },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Vista general de la operativa de Viajes Altairis</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Building2 size={24} /></div>
          <div className="stat-info">
            <h4>{data.totalHotels}</h4>
            <p>Hoteles totales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><BedDouble size={24} /></div>
          <div className="stat-info">
            <h4>{data.totalRoomTypes}</h4>
            <p>Tipos de habitacion</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><BookOpen size={24} /></div>
          <div className="stat-info">
            <h4>{data.totalReservations}</h4>
            <p>Reservas totales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h4>{data.upcomingReservations}</h4>
            <p>Reservas proximos 7 dias</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={24} /></div>
          <div className="stat-info">
            <h4>{data.pendingReservations}</h4>
            <p>Reservas pendientes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h4>{data.confirmedReservations}</h4>
            <p>Reservas confirmadas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CalendarCheck size={24} /></div>
          <div className="stat-info">
            <h4>{data.todayAvailableRooms}</h4>
            <p>Habitaciones disponibles hoy</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={24} /></div>
          <div className="stat-info">
            <h4>{data.cancelledReservations}</h4>
            <p>Reservas canceladas</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3>Reservas por estado</h3>
          </div>
          {reservationsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reservationsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                     outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {reservationsByStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>Sin datos de reservas</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Resumen operativo</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1a56db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
