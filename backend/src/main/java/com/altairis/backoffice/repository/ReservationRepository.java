package com.altairis.backoffice.repository;

import com.altairis.backoffice.model.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Page<Reservation> findByHotelId(Long hotelId, Pageable pageable);

    @Query("SELECT r FROM Reservation r WHERE " +
           "LOWER(r.guestName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.locator) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Reservation> searchReservations(@Param("search") String search, Pageable pageable);

    List<Reservation> findByCheckInBetween(LocalDate from, LocalDate to);

    long countByStatus(Reservation.Status status);

    @Query("SELECT r FROM Reservation r WHERE r.checkIn <= :date AND r.checkOut >= :date AND r.status != 'CANCELLED'")
    List<Reservation> findActiveReservationsForDate(@Param("date") LocalDate date);
}
