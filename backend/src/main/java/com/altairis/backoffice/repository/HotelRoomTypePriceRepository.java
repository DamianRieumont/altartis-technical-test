package com.altairis.backoffice.repository;

import com.altairis.backoffice.model.HotelRoomTypePrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HotelRoomTypePriceRepository extends JpaRepository<HotelRoomTypePrice, Long> {

    List<HotelRoomTypePrice> findByHotelId(Long hotelId);

    Optional<HotelRoomTypePrice> findByHotelIdAndRoomTypeId(Long hotelId, Long roomTypeId);

    void deleteByHotelIdAndRoomTypeId(Long hotelId, Long roomTypeId);

    void deleteByRoomTypeId(Long roomTypeId);
}
