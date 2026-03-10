'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Link as LinkIcon, Link2Off } from 'lucide-react'
import { api } from '../services/api'
import { RoomType, Hotel } from '../types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Error inesperado'
}

function RoomTypeModal({ roomType, onClose, onSave }: {
  roomType: RoomType | null; onClose: () => void; onSave: (rt: any) => void
}) {
  const [form, setForm] = useState({ name: '', description: '', capacity: 2, basePrice: 100 })

  useEffect(() => {
    if (roomType) {
      setForm({
        name: roomType.name,
        description: roomType.description || '',
        capacity: roomType.capacity,
        basePrice: roomType.basePrice,
      })
    } else {
      setForm({ name: '', description: '', capacity: 2, basePrice: 100 })
    }
  }, [roomType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
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
  const [assignedRoomTypeIds, setAssignedRoomTypeIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RoomType | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [hotelsData, allRoomTypes] = await Promise.all([
        api.hotels.getAll(0, 100),
        api.roomTypes.getAll(),
      ])

      setHotels(hotelsData.content)
      setRoomTypes(allRoomTypes)

      if (selectedHotel > 0) {
        const assigned = await api.roomTypes.getByHotel(selectedHotel)
        setAssignedRoomTypeIds(new Set(assigned.map(rt => rt.id)))
      } else {
        setAssignedRoomTypeIds(new Set())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedHotel])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (form: any) => {
    try {
      if (editing) {
        await api.roomTypes.update(editing.id, form)
      } else {
        const created = await api.roomTypes.create(form)
        if (selectedHotel > 0) {
          await api.roomTypes.assignToHotel(selectedHotel, created.id)
        }
      }
      setShowModal(false)
      setEditing(null)
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleToggleAssignment = async (roomTypeId: number) => {
    if (selectedHotel === 0) {
      alert('Selecciona un hotel para gestionar asignaciones')
      return
    }

    try {
      const assigned = assignedRoomTypeIds.has(roomTypeId)
      if (assigned) {
        await api.roomTypes.unassignFromHotel(selectedHotel, roomTypeId)
      } else {
        await api.roomTypes.assignToHotel(selectedHotel, roomTypeId)
      }
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Estas seguro de eliminar este tipo de habitacion del catalogo?')) {
      try {
        await api.roomTypes.delete(id)
        fetchData()
      } catch (error) {
        alert(getErrorMessage(error))
      }
    }
  }

  const selectedHotelName = hotels.find(h => h.id === selectedHotel)?.name

  return (
    <div>
      <div className="page-header">
        <h2>Tipos de Habitacion</h2>
        <p>Catalogo global de tipos de habitacion y asignacion por hotel</p>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="form-group" style={{ margin: 0, minWidth: 300 }}>
            <select className="form-control" value={selectedHotel}
                    onChange={e => setSelectedHotel(parseInt(e.target.value))}>
              <option value={0}>Seleccionar hotel para gestionar asignaciones...</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
            <Plus size={18} /> Nuevo Tipo
          </button>
        </div>

        {selectedHotel > 0 && (
          <p className="inventory-subtle" style={{ marginBottom: 16 }}>
            Asignaciones activas para: <strong>{selectedHotelName}</strong>
          </p>
        )}

        {loading ? (
          <div className="loading">Cargando tipos de habitacion...</div>
        ) : roomTypes.length === 0 ? (
          <div className="empty-state"><p>No se encontraron tipos de habitacion en el catalogo</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
              <tr>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Precio base</th>
                <th>Descripcion</th>
                <th>Asignacion hotel</th>
                <th>Acciones</th>
              </tr>
              </thead>
              <tbody>
              {roomTypes.map(rt => {
                const assigned = assignedRoomTypeIds.has(rt.id)
                return (
                  <tr key={rt.id}>
                    <td><strong>{rt.name}</strong></td>
                    <td>{rt.capacity} persona{rt.capacity > 1 ? 's' : ''}</td>
                    <td>{rt.basePrice.toFixed(2)} EUR</td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{rt.description || '-'}</td>
                    <td>
                      {selectedHotel === 0 ? (
                        <span className="inventory-subtle">Selecciona hotel</span>
                      ) : (
                        <span className={`badge ${assigned ? 'confirmed' : 'cancelled'}`}>
                          {assigned ? 'Asignado' : 'No asignado'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" onClick={() => { setEditing(rt); setShowModal(true) }} title="Editar tipo">
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(rt.id)} title="Eliminar tipo">
                          <Trash2 size={16} />
                        </button>
                        {selectedHotel > 0 && (
                          <button
                            className="btn-icon"
                            onClick={() => handleToggleAssignment(rt.id)}
                            title={assigned ? 'Quitar del hotel' : 'Asignar al hotel'}
                          >
                            {assigned ? <Link2Off size={16} /> : <LinkIcon size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <RoomTypeModal roomType={editing} onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} />}
    </div>
  )
}
