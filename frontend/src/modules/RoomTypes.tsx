'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../services/api'
import { RoomType, Hotel } from '../types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Error inesperado'
}

function RoomTypeModal({ roomType, hotels, onClose, onSave }: {
  roomType: RoomType | null; hotels: Hotel[]; onClose: () => void; onSave: (rt: any, hotelId: number) => void
}) {
  const [form, setForm] = useState({ name: '', description: '', capacity: 2, basePrice: 100 })
  const [hotelId, setHotelId] = useState(hotels[0]?.id || 0)

  useEffect(() => {
    if (roomType) {
      setForm({ name: roomType.name, description: roomType.description || '', capacity: roomType.capacity, basePrice: roomType.basePrice })
      setHotelId(roomType.hotelId)
    }
  }, [roomType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form, hotelId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{roomType ? 'Editar Tipo de Habitacion' : 'Nuevo Tipo de Habitacion'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!roomType && (
              <div className="form-group">
                <label>Hotel *</label>
                <select className="form-control" required value={hotelId}
                        onChange={e => setHotelId(parseInt(e.target.value))}>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Nombre *</label>
              <input className="form-control" required value={form.name}
                     onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Capacidad *</label>
                <input className="form-control" type="number" min="1" required value={form.capacity}
                       onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Precio base (EUR) *</label>
                <input className="form-control" type="number" min="1" step="0.01" required value={form.basePrice}
                       onChange={e => setForm({ ...form, basePrice: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label>Descripcion</label>
              <textarea className="form-control" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RoomType | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const hotelsData = await api.hotels.getAll(0, 100)
      setHotels(hotelsData.content)
      if (selectedHotel > 0) {
        const rts = await api.roomTypes.getByHotel(selectedHotel)
        setRoomTypes(rts)
      } else {
        const rts = await api.roomTypes.getAll()
        setRoomTypes(rts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedHotel])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (form: any, hotelId: number) => {
    try {
      if (editing) {
        await api.roomTypes.update(editing.id, form)
      } else {
        await api.roomTypes.create(form, hotelId)
      }
      setShowModal(false)
      setEditing(null)
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Estas seguro de eliminar este tipo de habitacion?')) {
      try {
        await api.roomTypes.delete(id)
        fetchData()
      } catch (error) {
        alert(getErrorMessage(error))
      }
    }
  }

  const getHotelName = (hotelId: number) => hotels.find(h => h.id === hotelId)?.name || '-'

  return (
    <div>
      <div className="page-header">
        <h2>Tipos de Habitacion</h2>
        <p>Gestiona los tipos de habitacion asociados a cada hotel</p>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="form-group" style={{ margin: 0, minWidth: 250 }}>
            <select className="form-control" value={selectedHotel}
                    onChange={e => setSelectedHotel(parseInt(e.target.value))}>
              <option value={0}>Todos los hoteles</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
            <Plus size={18} /> Nuevo Tipo
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando tipos de habitacion...</div>
        ) : roomTypes.length === 0 ? (
          <div className="empty-state"><p>No se encontraron tipos de habitacion</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Hotel</th>
                  <th>Capacidad</th>
                  <th>Precio base</th>
                  <th>Descripcion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map(rt => (
                  <tr key={rt.id}>
                    <td><strong>{rt.name}</strong></td>
                    <td>{getHotelName(rt.hotelId)}</td>
                    <td>{rt.capacity} persona{rt.capacity > 1 ? 's' : ''}</td>
                    <td>{rt.basePrice.toFixed(2)} EUR</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.description || '-'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" onClick={() => { setEditing(rt); setShowModal(true) }}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(rt.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <RoomTypeModal roomType={editing} hotels={hotels} onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} />}
    </div>
  )
}
