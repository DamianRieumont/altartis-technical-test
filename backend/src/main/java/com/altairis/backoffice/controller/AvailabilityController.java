package com.altairis.backoffice.controller;

import com.altairis.backoffice.exception.ApiException;
import com.altairis.backoffice.model.Availability;
import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.AvailabilityRepository;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final HotelRepository hotelRepository;

    public AvailabilityController(AvailabilityRepository availabilityRepository,
                                  RoomTypeRepository roomTypeRepository,
                                  HotelRepository hotelRepository) {
        this.availabilityRepository = availabilityRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.hotelRepository = hotelRepository;
    }

    @GetMapping("/room-type/{roomTypeId}")
    public List<Availability> getByRoomType(
            @PathVariable Long roomTypeId,
            @RequestParam Long hotelId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        validateDateRange(from, to);
        validateRoomTypeAssignment(hotelId, roomTypeId);
        return availabilityRepository.findByHotelIdAndRoomTypeIdAndDateBetweenOrderByDateAsc(hotelId, roomTypeId, from, to);
    }

    @GetMapping("/hotel/{hotelId}")
    public List<Availability> getByHotel(
            @PathVariable Long hotelId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        validateDateRange(from, to);
        return availabilityRepository.findByHotelIdAndDateRange(hotelId, from, to);
    }

    @PostMapping
    public ResponseEntity<Availability> create(@Valid @RequestBody Availability availability,
                                               @RequestParam Long hotelId,
                                               @RequestParam Long roomTypeId) {

        Hotel hotel = getHotelOrThrow(hotelId);
        RoomType roomType = getRoomTypeOrThrow(roomTypeId);
        validateRoomTypeAssignment(hotelId, roomTypeId);

        availability.setHotel(hotel);
        availability.setRoomType(roomType);
        return ResponseEntity.ok(availabilityRepository.save(availability));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Availability>> createBulk(
            @RequestParam Long hotelId,
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam Integer rooms) {

        validateDateRange(from, to);
        if (rooms < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El numero de habitaciones no puede ser negativo");
        }

        Hotel hotel = getHotelOrThrow(hotelId);
        RoomType roomType = getRoomTypeOrThrow(roomTypeId);
        validateRoomTypeAssignment(hotelId, roomTypeId);

        List<Availability> created = from.datesUntil(to.plusDays(1)).map(date -> {
            var existing = availabilityRepository.findByHotelIdAndRoomTypeIdAndDate(hotelId, roomTypeId, date);
            if (existing.isPresent()) {
                existing.get().setAvailableRooms(rooms);
                return availabilityRepository.save(existing.get());
            }
            Availability a = new Availability();
            a.setDate(date);
            a.setAvailableRooms(rooms);
            a.setHotel(hotel);
            a.setRoomType(roomType);
            return availabilityRepository.save(a);
        }).toList();

        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Availability> update(@PathVariable Long id, @Valid @RequestBody Availability availability) {
        return availabilityRepository.findById(id).map(existing -> {
            existing.setAvailableRooms(availability.getAvailableRooms());
            existing.setDate(availability.getDate());
            return ResponseEntity.ok(availabilityRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (availabilityRepository.existsById(id)) {
            availabilityRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El rango de fechas es invalido");
        }
    }

    private Hotel getHotelOrThrow(Long hotelId) {
        return hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hotel no encontrado"));
    }

    private RoomType getRoomTypeOrThrow(Long roomTypeId) {
        return roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tipo de habitacion no encontrado"));
    }

    private void validateRoomTypeAssignment(Long hotelId, Long roomTypeId) {
        if (!roomTypeRepository.existsByIdAndHotelsId(roomTypeId, hotelId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El tipo de habitacion no esta asignado al hotel");
        }
    }
}
