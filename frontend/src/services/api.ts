const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  dashboard: {
    get: () => request<any>('/dashboard'),
  },

  hotels: {
    getAll: (page = 0, size = 10, search = '', sortBy = 'id', sortDir = 'desc') =>
      request<any>(`/hotels?page=${page}&size=${size}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getById: (id: number) => request<any>(`/hotels/${id}`),
    create: (hotel: any) => request<any>('/hotels', { method: 'POST', body: JSON.stringify(hotel) }),
    update: (id: number, hotel: any) => request<any>(`/hotels/${id}`, { method: 'PUT', body: JSON.stringify(hotel) }),
    delete: (id: number) => request<void>(`/hotels/${id}`, { method: 'DELETE' }),
  },

  roomTypes: {
    getAll: () => request<any[]>('/room-types'),
    getByHotel: (hotelId: number) => request<any[]>(`/room-types/hotel/${hotelId}`),
    getById: (id: number) => request<any>(`/room-types/${id}`),
    create: (roomType: any, hotelId: number) =>
      request<any>(`/room-types?hotelId=${hotelId}`, { method: 'POST', body: JSON.stringify(roomType) }),
    update: (id: number, roomType: any) =>
      request<any>(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(roomType) }),
    delete: (id: number) => request<void>(`/room-types/${id}`, { method: 'DELETE' }),
  },

  availability: {
    getByRoomType: (roomTypeId: number, from: string, to: string) =>
      request<any[]>(`/availability/room-type/${roomTypeId}?from=${from}&to=${to}`),
    getByHotel: (hotelId: number, from: string, to: string) =>
      request<any[]>(`/availability/hotel/${hotelId}?from=${from}&to=${to}`),
    create: (availability: any, roomTypeId: number) =>
      request<any>(`/availability?roomTypeId=${roomTypeId}`, { method: 'POST', body: JSON.stringify(availability) }),
    createBulk: (roomTypeId: number, from: string, to: string, rooms: number) =>
      request<any[]>(`/availability/bulk?roomTypeId=${roomTypeId}&from=${from}&to=${to}&rooms=${rooms}`, { method: 'POST' }),
    update: (id: number, availability: any) =>
      request<any>(`/availability/${id}`, { method: 'PUT', body: JSON.stringify(availability) }),
    delete: (id: number) => request<void>(`/availability/${id}`, { method: 'DELETE' }),
  },

  reservations: {
    getAll: (page = 0, size = 10, search = '', sortBy = 'id', sortDir = 'desc') =>
      request<any>(`/reservations?page=${page}&size=${size}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getById: (id: number) => request<any>(`/reservations/${id}`),
    create: (reservation: any, hotelId: number, roomTypeId: number) =>
      request<any>(`/reservations?hotelId=${hotelId}&roomTypeId=${roomTypeId}`, { method: 'POST', body: JSON.stringify(reservation) }),
    update: (id: number, reservation: any) =>
      request<any>(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(reservation) }),
    updateStatus: (id: number, status: string) =>
      request<any>(`/reservations/${id}/status?status=${status}`, { method: 'PUT' }),
    delete: (id: number) => request<void>(`/reservations/${id}`, { method: 'DELETE' }),
  },
};
