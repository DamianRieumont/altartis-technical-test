package com.altairis.backoffice.service;

import com.altairis.backoffice.exception.ApiException;
import com.altairis.backoffice.model.Availability;
import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.model.Reservation;
import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.AvailabilityRepository;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.ReservationRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final AvailabilityRepository availabilityRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              HotelRepository hotelRepository,
                              RoomTypeRepository roomTypeRepository,
                              AvailabilityRepository availabilityRepository) {
        this.reservationRepository = reservationRepository;
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @Transactional
    public Reservation create(Reservation reservation, Long hotelId, Long roomTypeId) {
        if (reservation.getStatus() == null) {
            reservation.setStatus(Reservation.Status.PENDING);
        }

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hotel no encontrado"));

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tipo de habitacion no encontrado"));

        validateReservationData(reservation, hotel, roomType);

        reservation.setHotel(hotel);
        reservation.setRoomType(roomType);

        if (statusConsumesInventory(reservation.getStatus())) {
            reserveInventory(roomType.getId(), reservation.getCheckIn(), reservation.getCheckOut());
        }

        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation update(Long id, Reservation payload) {
        Reservation existing = reservationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        Long hotelId = existing.getHotelId();
        Long roomTypeId = existing.getRoomTypeId();

        if (payload.getHotel() != null && payload.getHotel().getId() != null) {
            hotelId = payload.getHotel().getId();
        }
        if (payload.getRoomType() != null && payload.getRoomType().getId() != null) {
            roomTypeId = payload.getRoomType().getId();
        }

        if (payload.getStatus() == null) {
            payload.setStatus(existing.getStatus());
        }

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hotel no encontrado"));

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tipo de habitacion no encontrado"));

        validateReservationData(payload, hotel, roomType);

        if (statusConsumesInventory(existing.getStatus())) {
            releaseInventory(existing.getRoomTypeId(), existing.getCheckIn(), existing.getCheckOut());
        }

        if (statusConsumesInventory(payload.getStatus())) {
            reserveInventory(roomType.getId(), payload.getCheckIn(), payload.getCheckOut());
        }

        existing.setGuestName(payload.getGuestName());
        existing.setGuestEmail(payload.getGuestEmail());
        existing.setGuestPhone(payload.getGuestPhone());
        existing.setCheckIn(payload.getCheckIn());
        existing.setCheckOut(payload.getCheckOut());
        existing.setNumGuests(payload.getNumGuests());
        existing.setTotalPrice(payload.getTotalPrice());
        existing.setNotes(payload.getNotes());
        existing.setStatus(payload.getStatus());
        existing.setHotel(hotel);
        existing.setRoomType(roomType);

        return reservationRepository.save(existing);
    }

    @Transactional
    public Reservation updateStatus(Long id, Reservation.Status newStatus) {
        Reservation existing = reservationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        if (existing.getStatus() == newStatus) {
            return existing;
        }

        if (statusConsumesInventory(existing.getStatus()) && !statusConsumesInventory(newStatus)) {
            releaseInventory(existing.getRoomTypeId(), existing.getCheckIn(), existing.getCheckOut());
        }

        if (!statusConsumesInventory(existing.getStatus()) && statusConsumesInventory(newStatus)) {
            reserveInventory(existing.getRoomTypeId(), existing.getCheckIn(), existing.getCheckOut());
        }

        existing.setStatus(newStatus);
        return reservationRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Reservation existing = reservationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        if (statusConsumesInventory(existing.getStatus())) {
            releaseInventory(existing.getRoomTypeId(), existing.getCheckIn(), existing.getCheckOut());
        }

        reservationRepository.delete(existing);
    }

    private void validateReservationData(Reservation reservation, Hotel hotel, RoomType roomType) {
        if (!roomType.getHotelId().equals(hotel.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El tipo de habitacion no pertenece al hotel seleccionado");
        }

        if (reservation.getCheckIn() == null || reservation.getCheckOut() == null || !reservation.getCheckOut().isAfter(reservation.getCheckIn())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La fecha de check-out debe ser posterior a la de check-in");
        }

        if (reservation.getNumGuests() != null && reservation.getNumGuests() > roomType.getCapacity()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El numero de huespedes excede la capacidad del tipo de habitacion");
        }
    }

    private boolean statusConsumesInventory(Reservation.Status status) {
        return status == Reservation.Status.PENDING
                || status == Reservation.Status.CONFIRMED
                || status == Reservation.Status.COMPLETED;
    }

    private void reserveInventory(Long roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        List<Availability> range = availabilityRepository.findByRoomTypeIdAndDateBetweenForUpdate(
                roomTypeId,
                checkIn,
                checkOut.minusDays(1)
        );

        Map<LocalDate, Availability> byDate = new HashMap<>();
        for (Availability availability : range) {
            byDate.put(availability.getDate(), availability);
        }

        for (LocalDate day = checkIn; day.isBefore(checkOut); day = day.plusDays(1)) {
            Availability availability = byDate.get(day);
            if (availability == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "No existe inventario cargado para " + day + " en el tipo de habitacion seleccionado");
            }
            if (availability.getAvailableRooms() <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Sin disponibilidad para " + day + " en el tipo de habitacion seleccionado");
            }
        }

        for (LocalDate day = checkIn; day.isBefore(checkOut); day = day.plusDays(1)) {
            Availability availability = byDate.get(day);
            availability.setAvailableRooms(availability.getAvailableRooms() - 1);
            availabilityRepository.save(availability);
        }
    }

    private void releaseInventory(Long roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        List<Availability> range = availabilityRepository.findByRoomTypeIdAndDateBetweenForUpdate(
                roomTypeId,
                checkIn,
                checkOut.minusDays(1)
        );

        Map<LocalDate, Availability> byDate = new HashMap<>();
        for (Availability availability : range) {
            byDate.put(availability.getDate(), availability);
        }

        for (LocalDate day = checkIn; day.isBefore(checkOut); day = day.plusDays(1)) {
            Availability availability = byDate.get(day);
            if (availability != null) {
                availability.setAvailableRooms(availability.getAvailableRooms() + 1);
                availabilityRepository.save(availability);
            }
        }
    }
}
