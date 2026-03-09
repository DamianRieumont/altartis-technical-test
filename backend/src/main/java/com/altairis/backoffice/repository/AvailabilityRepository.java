package com.altairis.backoffice.repository;

import com.altairis.backoffice.model.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    List<Availability> findByRoomTypeIdAndDateBetweenOrderByDateAsc(Long roomTypeId, LocalDate from, LocalDate to);

    @Query("SELECT a FROM Availability a WHERE a.roomType.hotel.id = :hotelId AND a.date BETWEEN :from AND :to ORDER BY a.date ASC")
    List<Availability> findByHotelIdAndDateRange(@Param("hotelId") Long hotelId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    Optional<Availability> findByRoomTypeIdAndDate(Long roomTypeId, LocalDate date);

    @Query("SELECT COALESCE(SUM(a.availableRooms), 0) FROM Availability a WHERE a.date = :date")
    int getTotalAvailableRoomsForDate(@Param("date") LocalDate date);
}
