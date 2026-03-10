package com.altairis.backoffice.controller;

import com.altairis.backoffice.exception.ApiException;
import com.altairis.backoffice.model.Availability;
import com.altairis.backoffice.repository.AvailabilityRepository;
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

    public AvailabilityController(AvailabilityRepository availabilityRepository, RoomTypeRepository roomTypeRepository) {
        this.availabilityRepository = availabilityRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    @GetMapping("/room-type/{roomTypeId}")
    public List<Availability> getByRoomType(
            @PathVariable Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return availabilityRepository.findByRoomTypeIdAndDateBetweenOrderByDateAsc(roomTypeId, from, to);
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
    public ResponseEntity<Availability> create(@Valid @RequestBody Availability availability, @RequestParam Long roomTypeId) {
        return roomTypeRepository.findById(roomTypeId).map(roomType -> {
            availability.setRoomType(roomType);
            return ResponseEntity.ok(availabilityRepository.save(availability));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Availability>> createBulk(
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam Integer rooms) {

        validateDateRange(from, to);
        if (rooms < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El numero de habitaciones no puede ser negativo");
        }

        return roomTypeRepository.findById(roomTypeId).map(roomType -> {
            List<Availability> created = from.datesUntil(to.plusDays(1)).map(date -> {
                var existing = availabilityRepository.findByRoomTypeIdAndDate(roomTypeId, date);
                if (existing.isPresent()) {
                    existing.get().setAvailableRooms(rooms);
                    return availabilityRepository.save(existing.get());
                }
                Availability a = new Availability();
                a.setDate(date);
                a.setAvailableRooms(rooms);
                a.setRoomType(roomType);
                return availabilityRepository.save(a);
            }).toList();
            return ResponseEntity.ok(created);
        }).orElse(ResponseEntity.notFound().build());
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
}
