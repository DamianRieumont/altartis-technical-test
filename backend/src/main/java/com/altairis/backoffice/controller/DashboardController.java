package com.altairis.backoffice.controller;

import com.altairis.backoffice.model.Reservation;
import com.altairis.backoffice.repository.AvailabilityRepository;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.ReservationRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ReservationRepository reservationRepository;
    private final AvailabilityRepository availabilityRepository;

    public DashboardController(HotelRepository hotelRepository,
                               RoomTypeRepository roomTypeRepository,
                               ReservationRepository reservationRepository,
                               AvailabilityRepository availabilityRepository) {
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.reservationRepository = reservationRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @GetMapping
    public Map<String, Object> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("totalHotels", hotelRepository.count());
        dashboard.put("activeHotels", hotelRepository.countByActiveTrue());
        dashboard.put("totalRoomTypes", roomTypeRepository.count());
        dashboard.put("totalReservations", reservationRepository.count());

        dashboard.put("pendingReservations", reservationRepository.countByStatus(Reservation.Status.PENDING));
        dashboard.put("confirmedReservations", reservationRepository.countByStatus(Reservation.Status.CONFIRMED));
        dashboard.put("cancelledReservations", reservationRepository.countByStatus(Reservation.Status.CANCELLED));
        dashboard.put("completedReservations", reservationRepository.countByStatus(Reservation.Status.COMPLETED));

        LocalDate today = LocalDate.now();
        dashboard.put("todayAvailableRooms", availabilityRepository.getTotalAvailableRoomsForDate(today));
        dashboard.put("todayActiveReservations", reservationRepository.findActiveReservationsForDate(today).size());

        long upcomingReservations = reservationRepository.countByCheckInBetween(today, today.plusDays(7));
        dashboard.put("upcomingReservations", upcomingReservations);

        return dashboard;
    }
}
