package com.altairis.backoffice.config;

import com.altairis.backoffice.model.*;
import com.altairis.backoffice.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(HotelRepository hotelRepo, RoomTypeRepository roomTypeRepo,
                               AvailabilityRepository availRepo, ReservationRepository resRepo) {
        return args -> {
            if (hotelRepo.count() > 0) return;

            String[][] hotelData = {
                {"Hotel Altairis Madrid", "Gran Via 28", "Madrid", "Spain", "5", "+34 911 234 567", "madrid@altairis.com", "Hotel de lujo en el centro de Madrid"},
                {"Hotel Altairis Barcelona", "Passeig de Gracia 45", "Barcelona", "Spain", "4", "+34 933 456 789", "barcelona@altairis.com", "Hotel boutique en el corazon de Barcelona"},
                {"Hotel Altairis Paris", "15 Rue de Rivoli", "Paris", "France", "5", "+33 1 42 36 12 34", "paris@altairis.com", "Elegante hotel con vistas a la Torre Eiffel"},
                {"Hotel Altairis Roma", "Via del Corso 126", "Rome", "Italy", "4", "+39 06 6789 1234", "roma@altairis.com", "Hotel clasico cerca del Coliseo"},
                {"Hotel Altairis London", "10 Park Lane", "London", "United Kingdom", "5", "+44 20 7123 4567", "london@altairis.com", "Hotel premium en Mayfair"},
                {"Hotel Altairis Lisboa", "Avenida da Liberdade 180", "Lisbon", "Portugal", "4", "+351 21 340 5678", "lisboa@altairis.com", "Hotel con encanto en Lisboa"},
                {"Hotel Altairis Berlin", "Unter den Linden 77", "Berlin", "Germany", "4", "+49 30 2023 4567", "berlin@altairis.com", "Hotel moderno en el centro de Berlin"},
                {"Hotel Altairis Amsterdam", "Dam Square 12", "Amsterdam", "Netherlands", "4", "+31 20 555 6789", "amsterdam@altairis.com", "Hotel en la plaza Dam de Amsterdam"},
            };

            String[][] roomData = {
                {"Individual", "Habitacion individual con cama sencilla", "1", "80"},
                {"Doble", "Habitacion doble con cama matrimonial", "2", "120"},
                {"Suite Junior", "Suite con sala de estar separada", "2", "200"},
                {"Suite Premium", "Suite de lujo con terraza y jacuzzi", "4", "350"},
                {"Familiar", "Habitacion amplia con dos camas dobles", "4", "180"},
            };

            Reservation.Status[] statuses = {Reservation.Status.CONFIRMED, Reservation.Status.PENDING,
                    Reservation.Status.COMPLETED, Reservation.Status.CANCELLED};
            String[] guestNames = {"Carlos Garcia", "Maria Lopez", "Jean Dupont", "Emma Wilson",
                    "Marco Rossi", "Ana Silva", "Hans Mueller", "Sophie Martin"};

            int resIndex = 0;
            for (String[] hd : hotelData) {
                Hotel hotel = new Hotel();
                hotel.setName(hd[0]);
                hotel.setAddress(hd[1]);
                hotel.setCity(hd[2]);
                hotel.setCountry(hd[3]);
                hotel.setStarRating(Integer.parseInt(hd[4]));
                hotel.setPhone(hd[5]);
                hotel.setEmail(hd[6]);
                hotel.setDescription(hd[7]);
                hotel.setActive(true);
                hotel = hotelRepo.save(hotel);

                for (String[] rd : roomData) {
                    RoomType rt = new RoomType();
                    rt.setName(rd[0]);
                    rt.setDescription(rd[1]);
                    rt.setCapacity(Integer.parseInt(rd[2]));
                    rt.setBasePrice(new BigDecimal(rd[3]));
                    rt.setHotel(hotel);
                    rt = roomTypeRepo.save(rt);

                    LocalDate start = LocalDate.now();
                    for (int d = 0; d < 30; d++) {
                        Availability a = new Availability();
                        a.setDate(start.plusDays(d));
                        a.setAvailableRooms((int) (Math.random() * 10) + 1);
                        a.setRoomType(rt);
                        availRepo.save(a);
                    }

                    if (resIndex < guestNames.length) {
                        Reservation res = new Reservation();
                        res.setGuestName(guestNames[resIndex % guestNames.length]);
                        res.setGuestEmail(guestNames[resIndex % guestNames.length].toLowerCase().replace(" ", ".") + "@email.com");
                        res.setCheckIn(LocalDate.now().plusDays(resIndex));
                        res.setCheckOut(LocalDate.now().plusDays(resIndex + 3));
                        res.setNumGuests(rt.getCapacity());
                        res.setTotalPrice(rt.getBasePrice().multiply(BigDecimal.valueOf(3)));
                        res.setStatus(statuses[resIndex % statuses.length]);
                        res.setHotel(hotel);
                        res.setRoomType(rt);
                        resRepo.save(res);
                        resIndex++;
                    }
                }
            }
        };
    }
}
