package com.altairis.backoffice.controller;

import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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
        return roomTypeRepository.findByHotelsId(hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomType> getById(@PathVariable Long id) {
        return roomTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RoomType create(@Valid @RequestBody RoomType roomType) {
        return roomTypeRepository.save(roomType);
    }

    @PostMapping("/hotel/{hotelId}/{roomTypeId}")
    @Transactional
    public ResponseEntity<Void> assignToHotel(@PathVariable Long hotelId, @PathVariable Long roomTypeId) {
        var hotelOpt = hotelRepository.findById(hotelId);
        var roomTypeOpt = roomTypeRepository.findById(roomTypeId);

        if (hotelOpt.isEmpty() || roomTypeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Hotel hotel = hotelOpt.get();
        RoomType roomType = roomTypeOpt.get();
        hotel.getRoomTypes().add(roomType);
        hotelRepository.save(hotel);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/hotel/{hotelId}/{roomTypeId}")
    @Transactional
    public ResponseEntity<Void> unassignFromHotel(@PathVariable Long hotelId, @PathVariable Long roomTypeId) {
        var hotelOpt = hotelRepository.findById(hotelId);
        var roomTypeOpt = roomTypeRepository.findById(roomTypeId);

        if (hotelOpt.isEmpty() || roomTypeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Hotel hotel = hotelOpt.get();
        hotel.getRoomTypes().remove(roomTypeOpt.get());
        hotelRepository.save(hotel);

        return ResponseEntity.noContent().build();
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
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        var roomTypeOpt = roomTypeRepository.findById(id);
        if (roomTypeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RoomType roomType = roomTypeOpt.get();
        for (Hotel hotel : new ArrayList<>(roomType.getHotels())) {
            hotel.getRoomTypes().remove(roomType);
            hotelRepository.save(hotel);
        }
        roomTypeRepository.delete(roomType);
        return ResponseEntity.noContent().build();
    }
}
