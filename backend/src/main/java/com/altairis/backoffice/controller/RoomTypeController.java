package com.altairis.backoffice.controller;

import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room-types")
public class RoomTypeController {

    private final RoomTypeRepository roomTypeRepository;
    private final HotelRepository hotelRepository;

    public RoomTypeController(RoomTypeRepository roomTypeRepository, HotelRepository hotelRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public List<RoomType> getAll() {
        return roomTypeRepository.findAll();
    }

    @GetMapping("/hotel/{hotelId}")
    public List<RoomType> getByHotel(@PathVariable Long hotelId) {
        return roomTypeRepository.findByHotelId(hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomType> getById(@PathVariable Long id) {
        return roomTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RoomType> create(@Valid @RequestBody RoomType roomType, @RequestParam Long hotelId) {
        return hotelRepository.findById(hotelId).map(hotel -> {
            roomType.setHotel(hotel);
            return ResponseEntity.ok(roomTypeRepository.save(roomType));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomType> update(@PathVariable Long id, @Valid @RequestBody RoomType roomType) {
        return roomTypeRepository.findById(id).map(existing -> {
            existing.setName(roomType.getName());
            existing.setDescription(roomType.getDescription());
            existing.setCapacity(roomType.getCapacity());
            existing.setBasePrice(roomType.getBasePrice());
            return ResponseEntity.ok(roomTypeRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (roomTypeRepository.existsById(id)) {
            roomTypeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
