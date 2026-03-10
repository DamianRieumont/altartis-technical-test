export interface Hotel {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  phone: string;
  email: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roomTypes?: RoomType[];
}

export interface RoomType {
  id: number;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
}

export interface Availability {
  id: number;
  date: string;
  availableRooms: number;
  hotelId: number;
  roomTypeId: number;
}

export interface Reservation {
  id: number;
  locator: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  roomType: RoomType;
  roomTypeId: number;
  hotel: Hotel;
  hotelId: number;
  notes: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardData {
  totalHotels: number;
  activeHotels: number;
  totalRoomTypes: number;
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  completedReservations: number;
  todayAvailableRooms: number;
  todayActiveReservations: number;
  upcomingReservations: number;
}
