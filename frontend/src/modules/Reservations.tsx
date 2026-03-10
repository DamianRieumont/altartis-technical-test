'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../services/api'
import { Reservation, Hotel, RoomType, Page, HotelRoomTypePrice } from '../types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Error inesperado'
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
}

function ReservationModal({ reservation, hotels, onClose, onSave }: {
  reservation: Reservation | null; hotels: Hotel[]; onClose: () => void;
  onSave: (r: any, hotelId: number, roomTypeId: number) => void
}) {
  const [form, setForm] = useState({
    guestName: '', guestEmail: '', guestPhone: '',
    checkIn: '', checkOut: '', numGuests: 1,
    totalPrice: 0, status: 'PENDING' as string, notes: '',
  })
  const [hotelId, setHotelId] = useState(hotels[0]?.id || 0)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [hotelPriceByRoomType, setHotelPriceByRoomType] = useState<Record<number, number>>({})
  const [roomTypeId, setRoomTypeId] = useState(0)

  useEffect(() => {
    if (reservation) {
      setForm({
        guestName: reservation.guestName, guestEmail: reservation.guestEmail || '',
        guestPhone: reservation.guestPhone || '', checkIn: reservation.checkIn,
        checkOut: reservation.checkOut, numGuests: reservation.numGuests,
        totalPrice: reservation.totalPrice, status: reservation.status,
        notes: reservation.notes || '',
      })
      setHotelId(reservation.hotelId)
      setRoomTypeId(reservation.roomTypeId)
    }
  }, [reservation])

  useEffect(() => {
    if (hotelId > 0) {
      Promise.all([
        api.roomTypes.getByHotel(hotelId),
        api.roomTypes.getHotelPrices(hotelId),
      ]).then(([rts, prices]) => {
        const typedRoomTypes = rts as RoomType[]
        const typedPrices = prices as HotelRoomTypePrice[]
        setRoomTypes(typedRoomTypes)
        const priceMap = typedPrices.reduce((acc, item) => {
          acc[item.roomTypeId] = item.price
          return acc
        }, {} as Record<number, number>)
        setHotelPriceByRoomType(priceMap)
        if (!reservation && typedRoomTypes.length > 0) setRoomTypeId(typedRoomTypes[0].id)
      })
    }
  }, [hotelId, reservation])

  useEffect(() => {
    if (!reservation && hotelId === 0 && hotels.length > 0) {
      setHotelId(hotels[0].id)
    }
  }, [reservation, hotelId, hotels])

  const selectedRoomType = roomTypes.find(rt => rt.id === roomTypeId)
  const selectedRoomTypePrice = selectedRoomType ? (hotelPriceByRoomType[selectedRoomType.id] ?? selectedRoomType.basePrice) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      alert('La fecha de check-out debe ser posterior a la de check-in')
      return
    }
    onSave(form, hotelId, roomTypeId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{reservation ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Hotel *</label>
                <select className="form-control" required value={hotelId}
                        onChange={e => setHotelId(parseInt(e.target.value))}>
                  <option value={0}>Seleccionar...</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo habitacion *</label>
                <select className="form-control" required value={roomTypeId}
                        onChange={e => setRoomTypeId(parseInt(e.target.value))}>
                  <option value={0}>Seleccionar...</option>
                  {roomTypes.map(rt => {
                    const effectivePrice = hotelPriceByRoomType[rt.id] ?? rt.basePrice
                    return <option key={rt.id} value={rt.id}>{rt.name} - {effectivePrice.toFixed(2)} EUR</option>
                  })}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Nombre del huesped *</label>
              <input className="form-control" required value={form.guestName}
                     onChange={e => setForm({ ...form, guestName: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.guestEmail}
                       onChange={e => setForm({ ...form, guestEmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Telefono</label>
                <input className="form-control" value={form.guestPhone}
                       onChange={e => setForm({ ...form, guestPhone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Check-in *</label>
                <input className="form-control" type="date" required value={form.checkIn}
                       onChange={e => setForm({ ...form, checkIn: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Check-out *</label>
                <input className="form-control" type="date" required value={form.checkOut}
                       onChange={e => setForm({ ...form, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Huespedes *</label>
                <input className="form-control" type="number" min="1" required value={form.numGuests}
                       onChange={e => setForm({ ...form, numGuests: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Precio total (EUR) *</label>
                <input className="form-control" type="number" min="0" step="0.01" required value={form.totalPrice}
                       onChange={e => setForm({ ...form, totalPrice: parseFloat(e.target.value) })} />
                {selectedRoomTypePrice !== null && (
                  <div className="inventory-subtle" style={{ marginTop: 4 }}>
                    Tarifa de referencia para el tipo seleccionado: {selectedRoomTypePrice.toFixed(2)} EUR por noche
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select className="form-control" value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="COMPLETED">Completada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notas</label>
              <textarea className="form-control" value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })} />
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

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resData, hotelsData] = await Promise.all([
        api.reservations.getAll(page, 10, search),
        api.hotels.getAll(0, 100),
      ])
      setReservations(resData.content)
      setTotalPages(resData.totalPages)
      setTotalElements(resData.totalElements)
      setHotels(hotelsData.content)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (form: any, hotelId: number, roomTypeId: number) => {
    try {
      if (editing) {
        await api.reservations.update(editing.id, { ...form, hotel: { id: hotelId }, roomType: { id: roomTypeId } })
      } else {
        await api.reservations.create(form, hotelId, roomTypeId)
      }
      setShowModal(false)
      setEditing(null)
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.reservations.updateStatus(id, status)
      fetchData()
    } catch (error) {
      alert(getErrorMessage(error))
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Estas seguro de eliminar esta reserva?')) {
      try {
        await api.reservations.delete(id)
        fetchData()
      } catch (error) {
        alert(getErrorMessage(error))
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Reservas</h2>
        <p>Gestion de reservas y estado de la operativa diaria</p>
      </div>

      <div className="card">
        <div className="toolbar">
          <form onSubmit={e => { e.preventDefault(); setPage(0); fetchData() }} className="search-bar">
            <Search size={18} />
            <input className="form-control" placeholder="Buscar por huesped o localizador..."
                   value={search} onChange={e => setSearch(e.target.value)} />
          </form>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
            <Plus size={18} /> Nueva Reserva
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando reservas...</div>
        ) : reservations.length === 0 ? (
          <div className="empty-state"><p>No se encontraron reservas</p></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Localizador</th>
                    <th>Huesped</th>
                    <th>Hotel</th>
                    <th>Habitacion</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(res => (
                    <tr key={res.id}>
                      <td><strong>{res.locator}</strong></td>
                      <td>{res.guestName}</td>
                      <td>{res.hotel?.name || '-'}</td>
                      <td>{res.roomType?.name || '-'}</td>
                      <td>{res.checkIn}</td>
                      <td>{res.checkOut}</td>
                      <td>{res.totalPrice?.toFixed(2)} EUR</td>
                      <td>
                        <select className="form-control" value={res.status} style={{ padding: '2px 24px 2px 8px', fontSize: 12, width: 'auto' }}
                                onChange={e => handleStatusChange(res.id, e.target.value)}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-icon" onClick={() => { setEditing(res); setShowModal(true) }}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(res.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Mostrando {reservations.length} de {totalElements} reservas</span>
              <div className="pagination-buttons">
                <button className="btn btn-secondary btn-sm" disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}>Anterior</button>
                <span style={{ padding: '4px 12px', fontSize: '14px' }}>
                  Pagina {page + 1} de {totalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && <ReservationModal reservation={editing} hotels={hotels}
        onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} />}
    </div>
  )
}
