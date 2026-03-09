package com.altairis.backoffice.controller;

import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.repository.HotelRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelRepository hotelRepository;

    public HotelController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public Page<Hotel> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        if (search.isEmpty()) {
            return hotelRepository.findAll(pageRequest);
        }
        return hotelRepository.searchHotels(search, pageRequest);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hotel> getById(@PathVariable Long id) {
        return hotelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Hotel create(@Valid @RequestBody Hotel hotel) {
        return hotelRepository.save(hotel);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Hotel> update(@PathVariable Long id, @Valid @RequestBody Hotel hotel) {
        return hotelRepository.findById(id).map(existing -> {
            existing.setName(hotel.getName());
            existing.setAddress(hotel.getAddress());
            existing.setCity(hotel.getCity());
            existing.setCountry(hotel.getCountry());
            existing.setStarRating(hotel.getStarRating());
            existing.setPhone(hotel.getPhone());
            existing.setEmail(hotel.getEmail());
            existing.setDescription(hotel.getDescription());
            existing.setActive(hotel.isActive());
            return ResponseEntity.ok(hotelRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (hotelRepository.existsById(id)) {
            hotelRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
