package com.altairis.backoffice.controller;

import com.altairis.backoffice.model.Reservation;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.ReservationRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;

    public ReservationController(ReservationRepository reservationRepository,
                                  HotelRepository hotelRepository,
                                  RoomTypeRepository roomTypeRepository) {
        this.reservationRepository = reservationRepository;
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    @GetMapping
    public Page<Reservation> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (search.isEmpty()) {
            return reservationRepository.findAll(pageRequest);
        }
        return reservationRepository.searchReservations(search, pageRequest);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getById(@PathVariable Long id) {
        return reservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Reservation> create(@Valid @RequestBody Reservation reservation,
                                               @RequestParam Long hotelId,
                                               @RequestParam Long roomTypeId) {
        var hotel = hotelRepository.findById(hotelId);
        var roomType = roomTypeRepository.findById(roomTypeId);

        if (hotel.isEmpty() || roomType.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!reservation.getCheckOut().isAfter(reservation.getCheckIn())) {
            return ResponseEntity.badRequest().build();
        }

        reservation.setHotel(hotel.get());
        reservation.setRoomType(roomType.get());
        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Reservation> updateStatus(@PathVariable Long id, @RequestParam Reservation.Status status) {
        return reservationRepository.findById(id).map(existing -> {
            existing.setStatus(status);
            return ResponseEntity.ok(reservationRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reservation> update(@PathVariable Long id, @Valid @RequestBody Reservation reservation) {
        if (!reservation.getCheckOut().isAfter(reservation.getCheckIn())) {
            return ResponseEntity.badRequest().build();
        }
        return reservationRepository.findById(id).map(existing -> {
            existing.setGuestName(reservation.getGuestName());
            existing.setGuestEmail(reservation.getGuestEmail());
            existing.setGuestPhone(reservation.getGuestPhone());
            existing.setCheckIn(reservation.getCheckIn());
            existing.setCheckOut(reservation.getCheckOut());
            existing.setNumGuests(reservation.getNumGuests());
            existing.setTotalPrice(reservation.getTotalPrice());
            existing.setNotes(reservation.getNotes());
            existing.setStatus(reservation.getStatus());
            return ResponseEntity.ok(reservationRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (reservationRepository.existsById(id)) {
            reservationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
