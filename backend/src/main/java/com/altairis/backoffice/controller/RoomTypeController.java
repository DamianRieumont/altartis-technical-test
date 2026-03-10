package com.altairis.backoffice.controller;

import com.altairis.backoffice.exception.ApiException;
import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.model.HotelRoomTypePrice;
import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.HotelRoomTypePriceRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/room-types")
public class RoomTypeController {

    private final RoomTypeRepository roomTypeRepository;
    private final HotelRepository hotelRepository;
    private final HotelRoomTypePriceRepository hotelRoomTypePriceRepository;

    public RoomTypeController(RoomTypeRepository roomTypeRepository,
                              HotelRepository hotelRepository,
                              HotelRoomTypePriceRepository hotelRoomTypePriceRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.hotelRepository = hotelRepository;
        this.hotelRoomTypePriceRepository = hotelRoomTypePriceRepository;
    }

    @GetMapping
    public List<RoomType> getAll() {
        return roomTypeRepository.findAll();
    }

    @GetMapping("/hotel/{hotelId}")
    public List<RoomType> getByHotel(@PathVariable Long hotelId) {
        return roomTypeRepository.findByHotelsId(hotelId);
    }

    @GetMapping("/hotel/{hotelId}/prices")
    public ResponseEntity<List<HotelRoomTypePriceView>> getHotelPrices(@PathVariable Long hotelId) {
        if (!hotelRepository.existsById(hotelId)) {
            return ResponseEntity.notFound().build();
        }

        Map<Long, BigDecimal> overrides = hotelRoomTypePriceRepository.findByHotelId(hotelId).stream()
                .collect(Collectors.toMap(HotelRoomTypePrice::getRoomTypeId, HotelRoomTypePrice::getPrice));

        List<HotelRoomTypePriceView> prices = roomTypeRepository.findByHotelsId(hotelId).stream()
                .map(roomType -> new HotelRoomTypePriceView(
                        roomType.getId(),
                        overrides.getOrDefault(roomType.getId(), roomType.getBasePrice())
                ))
                .toList();

        return ResponseEntity.ok(prices);
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

        if (hotelRoomTypePriceRepository.findByHotelIdAndRoomTypeId(hotelId, roomTypeId).isEmpty()) {
            HotelRoomTypePrice roomTypePrice = new HotelRoomTypePrice();
            roomTypePrice.setHotel(hotel);
            roomTypePrice.setRoomType(roomType);
            roomTypePrice.setPrice(roomType.getBasePrice());
            hotelRoomTypePriceRepository.save(roomTypePrice);
        }

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
        hotelRoomTypePriceRepository.deleteByHotelIdAndRoomTypeId(hotelId, roomTypeId);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/hotel/{hotelId}/{roomTypeId}/price")
    @Transactional
    public ResponseEntity<Void> updateHotelPrice(@PathVariable Long hotelId,
                                                 @PathVariable Long roomTypeId,
                                                 @RequestParam BigDecimal price) {
        if (price == null || price.signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor que 0");
        }

        var hotelOpt = hotelRepository.findById(hotelId);
        var roomTypeOpt = roomTypeRepository.findById(roomTypeId);

        if (hotelOpt.isEmpty() || roomTypeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!roomTypeRepository.existsByIdAndHotelsId(roomTypeId, hotelId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El tipo de habitacion no esta asignado al hotel");
        }

        HotelRoomTypePrice roomTypePrice = hotelRoomTypePriceRepository
                .findByHotelIdAndRoomTypeId(hotelId, roomTypeId)
                .orElseGet(() -> {
                    HotelRoomTypePrice created = new HotelRoomTypePrice();
                    created.setHotel(hotelOpt.get());
                    created.setRoomType(roomTypeOpt.get());
                    return created;
                });
        roomTypePrice.setPrice(price);
        hotelRoomTypePriceRepository.save(roomTypePrice);

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
        hotelRoomTypePriceRepository.deleteByRoomTypeId(roomType.getId());
        roomTypeRepository.delete(roomType);
        return ResponseEntity.noContent().build();
    }

    public record HotelRoomTypePriceView(Long roomTypeId, BigDecimal price) {}
}
