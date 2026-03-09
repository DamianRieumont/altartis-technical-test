import { useEffect, useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../services/api'
import { Hotel, RoomType, Availability } from '../types'

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

  const today = new Date()
  const [from] = useState(today.toISOString().split('T')[0])
  const toDate = new Date(today)
  toDate.setDate(toDate.getDate() + 30)
  const [to] = useState(toDate.toISOString().split('T')[0])

  const fetchData = useCallback(async () => {
    setLoading(true)
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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedHotel, from, to])

  useEffect(() => { fetchData() }, [fetchData])

  const handleBulkSave = async (roomTypeId: number, fromDate: string, toDate: string, rooms: number) => {
    await api.availability.createBulk(roomTypeId, fromDate, toDate, rooms)
    setShowModal(false)
    fetchData()
  }

  const chartData = availability.reduce((acc: any[], a) => {
    const existing = acc.find(d => d.date === a.date)
    if (existing) {
      existing.rooms += a.availableRooms
    } else {
      acc.push({ date: a.date, rooms: a.availableRooms })
    }
    return acc
  }, []).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <div className="page-header">
        <h2>Disponibilidad e Inventario</h2>
        <p>Consulta y registra la disponibilidad de habitaciones por hotel</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="toolbar">
          <div className="form-group" style={{ margin: 0, minWidth: 250 }}>
            <select className="form-control" value={selectedHotel}
                    onChange={e => setSelectedHotel(parseInt(e.target.value))}>
              <option value={0}>Seleccionar hotel...</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
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
        <div className="card"><div className="empty-state"><p>Selecciona un hotel para ver la disponibilidad</p></div></div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3>Vista de inventario - Proximos 30 dias</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={v => v.substring(5)} />
                  <YAxis />
                  <Tooltip labelFormatter={v => `Fecha: ${v}`} />
                  <Bar dataKey="rooms" name="Habitaciones disponibles" fill="#059669" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3>Detalle por tipo de habitacion</h3>
            </div>
            {roomTypes.length === 0 ? (
              <div className="empty-state"><p>Este hotel no tiene tipos de habitacion</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Hab. Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availability.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sin datos de disponibilidad registrados</td></tr>
                    ) : (
                      availability.map(a => {
                        const rt = roomTypes.find(r => r.id === a.roomTypeId)
                        return (
                          <tr key={a.id}>
                            <td><strong>{rt?.name || '-'}</strong></td>
                            <td>{a.date}</td>
                            <td>
                              <span className={`badge ${a.availableRooms > 3 ? 'confirmed' : a.availableRooms > 0 ? 'pending' : 'cancelled'}`}>
                                {a.availableRooms}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
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
