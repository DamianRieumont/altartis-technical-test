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

type WeekColumn = {
  key: string
  start: string
  end: string
}

type WeeklyStats = {
  totalRooms: number
  days: number
  minRooms: number
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStartIso(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  const weekDay = date.getUTCDay()
  const diffToMonday = weekDay === 0 ? -6 : 1 - weekDay
  date.setUTCDate(date.getUTCDate() + diffToMonday)
  return toIsoDate(date)
}

function getWeekEndIso(weekStartIso: string): string {
  const date = parseIsoDate(weekStartIso)
  date.setUTCDate(date.getUTCDate() + 6)
  return toIsoDate(date)
}

function addDaysIso(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return toIsoDate(date)
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

  const shiftRangeByWeeks = useCallback((weeks: number) => {
    const shiftDays = weeks * 7
    setFrom(prev => addDaysIso(prev, shiftDays))
    setTo(prev => addDaysIso(prev, shiftDays))
  }, [])

  const setCurrentWeekRange = useCallback(() => {
    const todayIso = new Date().toISOString().split('T')[0]
    const weekStart = getWeekStartIso(todayIso)
    setFrom(weekStart)
    setTo(getWeekEndIso(weekStart))
  }, [])

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

  useEffect(() => {
    if (selectedHotel === 0 && hotels.length > 0) {
      setSelectedHotel(hotels[0].id)
    }
  }, [selectedHotel, hotels])

  const handleBulkSave = async (roomTypeId: number, fromDate: string, toDate: string, rooms: number) => {
    try {
      await api.availability.createBulk(selectedHotel, roomTypeId, fromDate, toDate, rooms)
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

  const weekColumns = useMemo<WeekColumn[]>(() => {
    const map = new Map<string, WeekColumn>()
    for (const item of availability) {
      const start = getWeekStartIso(item.date)
      if (!map.has(start)) {
        map.set(start, {
          key: start,
          start,
          end: getWeekEndIso(start),
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start))
  }, [availability])

  const roomTypeWeekMap = useMemo(() => {
    const map = new Map<number, Map<string, WeeklyStats>>()
    for (const item of availability) {
      const weekKey = getWeekStartIso(item.date)
      if (!map.has(item.roomTypeId)) {
        map.set(item.roomTypeId, new Map())
      }
      const weeklyStats = map.get(item.roomTypeId)!
      const current = weeklyStats.get(weekKey)
      if (current) {
        current.totalRooms += item.availableRooms
        current.days += 1
        current.minRooms = Math.min(current.minRooms, item.availableRooms)
      } else {
        weeklyStats.set(weekKey, {
          totalRooms: item.availableRooms,
          days: 1,
          minRooms: item.availableRooms,
        })
      }
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

  const totalByWeek = useMemo(() => {
    const map = new Map<string, WeeklyStats>()
    for (const item of availability) {
      const weekKey = getWeekStartIso(item.date)
      const current = map.get(weekKey)
      if (current) {
        current.totalRooms += item.availableRooms
        current.days += 1
        current.minRooms = Math.min(current.minRooms, item.availableRooms)
      } else {
        map.set(weekKey, {
          totalRooms: item.availableRooms,
          days: 1,
          minRooms: item.availableRooms,
        })
      }
    }
    return map
  }, [availability])

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
            <div className="form-group inventory-filter-item" style={{ minWidth: 'auto' }}>
              <label>Navegacion</label>
              <div className="inventory-quick-nav">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftRangeByWeeks(-1)}>
                  Semana anterior
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={setCurrentWeekRange}>
                  Esta semana
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftRangeByWeeks(1)}>
                  Semana siguiente
                </button>
              </div>
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
      ) : hotels.length === 0 ? (
        <div className="card"><div className="empty-state"><p>No hay hoteles cargados</p></div></div>
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
              <h3>Matriz de inventario por tipo y semana</h3>
              <div className="inventory-legend">
                <span className="badge confirmed">Alto (min 4+)</span>
                <span className="badge pending">Bajo (min 1-3)</span>
                <span className="badge cancelled">Agotado (min 0)</span>
              </div>
            </div>
            <p className="inventory-subtle" style={{ marginBottom: 12 }}>
              Cada celda muestra el promedio diario semanal y debajo el minimo semanal.
            </p>

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
                      {weekColumns.map(week => <th key={week.key}>{`${formatDateShort(week.start)} a ${formatDateShort(week.end)}`}</th>)}
                      <th>Total periodo</th>
                      <th>Prom./dia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map(rt => {
                      const values = roomTypeWeekMap.get(rt.id) || new Map<string, WeeklyStats>()
                      const total = weekColumns.reduce((sum, week) => sum + (values.get(week.key)?.totalRooms || 0), 0)
                      const totalDays = weekColumns.reduce((sum, week) => sum + (values.get(week.key)?.days || 0), 0)
                      const average = totalDays > 0 ? total / totalDays : 0

                      return (
                        <tr key={rt.id}>
                          <td>
                            <strong>{rt.name}</strong>
                            <div className="inventory-subtle">Capacidad: {rt.capacity}</div>
                          </td>
                          {weekColumns.map(week => {
                            const weekStats = values.get(week.key)
                            if (!weekStats) {
                              return <td key={week.key}><span className="inventory-subtle">-</span></td>
                            }

                            const averageRooms = weekStats.totalRooms / weekStats.days
                            const level = weekStats.minRooms === 0 ? 'cancelled' : weekStats.minRooms <= 3 ? 'pending' : 'confirmed'
                            return (
                              <td key={week.key}>
                                <span className={`badge ${level}`}>{averageRooms.toFixed(1)}</span>
                                <div className="inventory-subtle">min {weekStats.minRooms}</div>
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
                      {weekColumns.map(week => {
                        const weekStats = totalByWeek.get(week.key)
                        const weekAverage = weekStats ? weekStats.totalRooms / weekStats.days : 0
                        return <td key={week.key}><strong>{weekAverage.toFixed(1)}</strong></td>
                      })}
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
