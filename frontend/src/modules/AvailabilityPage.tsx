'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, X, Boxes, CalendarDays, AlertTriangle, Ban } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../services/api'
import { Hotel, RoomType, Availability } from '../types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Error inesperado'
}

function formatDateShort(value: string): string {
  return value.slice(5)
}

type ChartPoint = {
  date: string
  rooms: number
}

function BulkModal({ roomTypes, onClose, onSave }: {
  roomTypes: RoomType[]; onClose: () => void; onSave: (roomTypeId: number, from: string, to: string, rooms: number) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id || 0)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [rooms, setRooms] = useState(5)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Disponibilidad</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(roomTypeId, from, to, rooms) }}>
          <div className="modal-body">
            <div className="form-group">
              <label>Tipo de habitacion *</label>
              <select className="form-control" value={roomTypeId} onChange={e => setRoomTypeId(parseInt(e.target.value))}>
                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Desde *</label>
                <input className="form-control" type="date" value={from} onChange={e => setFrom(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Hasta *</label>
                <input className="form-control" type="date" value={to} onChange={e => setTo(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Habitaciones disponibles *</label>
              <input className="form-control" type="number" min="0" value={rooms} onChange={e => setRooms(parseInt(e.target.value))} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AvailabilityPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [selectedHotel, setSelectedHotel] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [loadError, setLoadError] = useState<string>('')

  const today = new Date()
  const initialFrom = today.toISOString().split('T')[0]
  const initialToDate = new Date(today)
  initialToDate.setDate(initialToDate.getDate() + 30)
  const initialTo = initialToDate.toISOString().split('T')[0]

  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const hotelsData = await api.hotels.getAll(0, 100)
      setHotels(hotelsData.content)

      if (selectedHotel > 0) {
        const [rts, avail] = await Promise.all([
          api.roomTypes.getByHotel(selectedHotel),
          api.availability.getByHotel(selectedHotel, from, to),
        ])
        setRoomTypes(rts)
        setAvailability(avail)
      } else {
        setRoomTypes([])
        setAvailability([])
      }
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [selectedHotel, from, to])

  useEffect(() => { fetchData() }, [fetchData])

  const handleBulkSave = async (roomTypeId: number, fromDate: string, toDate: string, rooms: number) => {
    try {
      await api.availability.createBulk(roomTypeId, fromDate, toDate, rooms)
      setShowModal(false)
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const chartData = useMemo<ChartPoint[]>(() => {
    const totals = new Map<string, number>()

    for (const item of availability) {
      totals.set(item.date, (totals.get(item.date) || 0) + item.availableRooms)
    }

    return Array.from(totals.entries())
      .map(([date, rooms]) => ({ date, rooms }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [availability])

  const dateColumns = useMemo(() => {
    return Array.from(new Set(availability.map(a => a.date))).sort((a, b) => a.localeCompare(b))
  }, [availability])

  const roomTypeDateMap = useMemo(() => {
    const map = new Map<number, Map<string, number>>()
    for (const item of availability) {
      if (!map.has(item.roomTypeId)) {
        map.set(item.roomTypeId, new Map())
      }
      map.get(item.roomTypeId)!.set(item.date, item.availableRooms)
    }
    return map
  }, [availability])

  const totalByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const point of chartData) {
      map.set(point.date, point.rooms)
    }
    return map
  }, [chartData])

  const todayIso = new Date().toISOString().split('T')[0]
  const totalToday = totalByDate.get(todayIso) || 0
  const totalSlots = availability.length
  const soldOutSlots = availability.filter(a => a.availableRooms === 0).length
  const lowSlots = availability.filter(a => a.availableRooms > 0 && a.availableRooms <= 3).length
  const averagePerDay = chartData.length > 0 ? chartData.reduce((acc, cur) => acc + cur.rooms, 0) / chartData.length : 0
  const maxDailyInventory = chartData.length > 0 ? Math.max(...chartData.map(point => point.rooms)) : 0
  const todayAvailabilityPct = maxDailyInventory > 0 ? (totalToday / maxDailyInventory) * 100 : 0

  const chartPercentData = useMemo(() => {
    return chartData.map(point => ({
      ...point,
      availabilityPct: maxDailyInventory > 0 ? Number(((point.rooms / maxDailyInventory) * 100).toFixed(1)) : 0,
    }))
  }, [chartData, maxDailyInventory])

  return (
    <div>
      <div className="page-header">
        <h2>Disponibilidad e Inventario</h2>
        <p>Inventario = habitaciones disponibles por tipo y por fecha para la operativa diaria</p>
      </div>

      <div className="inventory-help" style={{ marginBottom: 16 }}>
        <h4>Como leer esta vista</h4>
        <p>
          El inventario operativo muestra cuantas habitaciones quedan para vender en cada fecha y tipo de habitacion.
          Verde indica disponibilidad saludable, amarillo disponibilidad baja y rojo sin stock.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="inventory-toolbar">
          <div className="inventory-filters">
            <div className="form-group inventory-filter-item">
              <label>Hotel</label>
              <select className="form-control" value={selectedHotel}
                      onChange={e => setSelectedHotel(parseInt(e.target.value))}>
                <option value={0}>Seleccionar hotel...</option>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="form-group inventory-filter-item">
              <label>Desde</label>
              <input className="form-control" type="date" value={from}
                     max={to} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="form-group inventory-filter-item">
              <label>Hasta</label>
              <input className="form-control" type="date" value={to}
                     min={from} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          {selectedHotel > 0 && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Registrar Disponibilidad
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : selectedHotel === 0 ? (
        <div className="card"><div className="empty-state"><p>Selecciona un hotel para ver el inventario</p></div></div>
      ) : loadError ? (
        <div className="card"><div className="empty-state"><p>{loadError}</p></div></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green"><Boxes size={24} /></div>
              <div className="stat-info">
                <h4>{totalToday}</h4>
                <p>Inventario disponible hoy</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><CalendarDays size={24} /></div>
              <div className="stat-info">
                <h4>{todayAvailabilityPct.toFixed(1)}%</h4>
                <p>Indice de disponibilidad hoy</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><AlertTriangle size={24} /></div>
              <div className="stat-info">
                <h4>{lowSlots}</h4>
                <p>Slots en nivel bajo (1-3)</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><Ban size={24} /></div>
              <div className="stat-info">
                <h4>{soldOutSlots}</h4>
                <p>Slots agotados (0)</p>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3>Indice de inventario disponible (%)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartPercentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={formatDateShort} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    labelFormatter={value => `Fecha: ${value}`}
                    formatter={(value, name, payload) => {
                      if (name === 'availabilityPct') {
                        return [`${value}%`, 'Disponibilidad relativa']
                      }
                      return [String(value), 'Habitaciones disponibles']
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="availabilityPct"
                    name="availabilityPct"
                    stroke="#1a56db"
                    fill="#e8eefb"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="inventory-subtle" style={{ marginTop: 10 }}>
                Porcentaje calculado contra el maximo inventario diario observado en el rango seleccionado ({maxDailyInventory} habitaciones).
              </p>
            </div>
          )}

          <div className="card">
            <div className="inventory-matrix-header">
              <h3>Matriz de inventario por tipo y fecha</h3>
              <div className="inventory-legend">
                <span className="badge confirmed">Alto (4+)</span>
                <span className="badge pending">Bajo (1-3)</span>
                <span className="badge cancelled">Agotado (0)</span>
              </div>
            </div>

            {roomTypes.length === 0 ? (
              <div className="empty-state"><p>Este hotel no tiene tipos de habitacion</p></div>
            ) : totalSlots === 0 ? (
              <div className="empty-state"><p>Sin datos de inventario para el rango seleccionado</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      {dateColumns.map(date => <th key={date}>{formatDateShort(date)}</th>)}
                      <th>Total periodo</th>
                      <th>Prom./dia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map(rt => {
                      const values = roomTypeDateMap.get(rt.id) || new Map<string, number>()
                      const total = dateColumns.reduce((sum, date) => sum + (values.get(date) || 0), 0)
                      const average = dateColumns.length > 0 ? total / dateColumns.length : 0

                      return (
                        <tr key={rt.id}>
                          <td>
                            <strong>{rt.name}</strong>
                            <div className="inventory-subtle">Capacidad: {rt.capacity}</div>
                          </td>
                          {dateColumns.map(date => {
                            const rooms = values.get(date)
                            if (rooms === undefined) {
                              return <td key={date}><span className="inventory-subtle">-</span></td>
                            }

                            const level = rooms === 0 ? 'cancelled' : rooms <= 3 ? 'pending' : 'confirmed'
                            return (
                              <td key={date}>
                                <span className={`badge ${level}`}>{rooms}</span>
                              </td>
                            )
                          })}
                          <td><strong>{total}</strong></td>
                          <td>{average.toFixed(1)}</td>
                        </tr>
                      )
                    })}
                    <tr>
                      <td><strong>Total hotel</strong></td>
                      {dateColumns.map(date => <td key={date}><strong>{totalByDate.get(date) || 0}</strong></td>)}
                      <td><strong>{chartData.reduce((sum, item) => sum + item.rooms, 0)}</strong></td>
                      <td><strong>{averagePerDay.toFixed(1)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && <BulkModal roomTypes={roomTypes} onClose={() => setShowModal(false)} onSave={handleBulkSave} />}
    </div>
  )
}
