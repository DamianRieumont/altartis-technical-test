import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react'
import { api } from '../services/api'
import { Hotel, Page } from '../types'

function HotelModal({ hotel, onClose, onSave }: { hotel: Hotel | null; onClose: () => void; onSave: (h: any) => void }) {
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: '', starRating: 4,
    phone: '', email: '', description: '', active: true,
  })

  useEffect(() => {
    if (hotel) {
      setForm({
        name: hotel.name, address: hotel.address, city: hotel.city,
        country: hotel.country, starRating: hotel.starRating || 4,
        phone: hotel.phone || '', email: hotel.email || '',
        description: hotel.description || '', active: hotel.active,
      })
    }
  }, [hotel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{hotel ? 'Editar Hotel' : 'Nuevo Hotel'}</h3>
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
                <label>Direccion *</label>
                <input className="form-control" required value={form.address}
                       onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ciudad *</label>
                <input className="form-control" required value={form.city}
                       onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Pais *</label>
                <input className="form-control" required value={form.country}
                       onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Estrellas</label>
                <select className="form-control" value={form.starRating}
                        onChange={e => setForm({ ...form, starRating: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} estrella{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Telefono</label>
                <input className="form-control" value={form.phone}
                       onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.email}
                       onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Descripcion</label>
              <textarea className="form-control" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" checked={form.active}
                       onChange={e => setForm({ ...form, active: e.target.checked })} />
                {' '}Activo
              </label>
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

export default function Hotels() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)

  const fetchHotels = useCallback(() => {
    setLoading(true)
    api.hotels.getAll(page, 10, search)
      .then((data: Page<Hotel>) => {
        setHotels(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchHotels() }, [fetchHotels])

  const handleSave = async (form: any) => {
    if (editingHotel) {
      await api.hotels.update(editingHotel.id, form)
    } else {
      await api.hotels.create(form)
    }
    setShowModal(false)
    setEditingHotel(null)
    fetchHotels()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Estas seguro de eliminar este hotel?')) {
      await api.hotels.delete(id)
      fetchHotels()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchHotels()
  }

  return (
    <div>
      <div className="page-header">
        <h2>Hoteles</h2>
        <p>Gestion del catalogo de hoteles de la cadena</p>
      </div>

      <div className="card">
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-bar">
            <Search size={18} />
            <input className="form-control" placeholder="Buscar por nombre, ciudad o pais..."
                   value={search} onChange={e => setSearch(e.target.value)} />
          </form>
          <button className="btn btn-primary" onClick={() => { setEditingHotel(null); setShowModal(true) }}>
            <Plus size={18} /> Nuevo Hotel
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando hoteles...</div>
        ) : hotels.length === 0 ? (
          <div className="empty-state"><p>No se encontraron hoteles</p></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Pais</th>
                    <th>Estrellas</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map(hotel => (
                    <tr key={hotel.id}>
                      <td><strong>{hotel.name}</strong></td>
                      <td>{hotel.city}</td>
                      <td>{hotel.country}</td>
                      <td><span className="stars">{'★'.repeat(hotel.starRating || 0)}</span></td>
                      <td>{hotel.email || hotel.phone || '-'}</td>
                      <td>
                        <span className={`badge ${hotel.active ? 'active' : 'cancelled'}`}>
                          {hotel.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-icon" onClick={() => { setEditingHotel(hotel); setShowModal(true) }}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(hotel.id)}>
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
              <span>Mostrando {hotels.length} de {totalElements} hoteles</span>
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

      {showModal && <HotelModal hotel={editingHotel} onClose={() => { setShowModal(false); setEditingHotel(null) }} onSave={handleSave} />}
    </div>
  )
}
