package com.altairis.backoffice.config;

import com.altairis.backoffice.model.Availability;
import com.altairis.backoffice.model.Hotel;
import com.altairis.backoffice.model.Reservation;
import com.altairis.backoffice.model.RoomType;
import com.altairis.backoffice.repository.AvailabilityRepository;
import com.altairis.backoffice.repository.HotelRepository;
import com.altairis.backoffice.repository.ReservationRepository;
import com.altairis.backoffice.repository.RoomTypeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(HotelRepository hotelRepo,
                               RoomTypeRepository roomTypeRepo,
                               AvailabilityRepository availRepo,
                               ReservationRepository resRepo,
                               @Value("${app.seed.mode:demo}") String seedMode,
                               @Value("${app.seed.large.hotels:2000}") int largeHotelCount) {
        return args -> {
            if (hotelRepo.count() > 0) {
                return;
            }

            Random random = new Random(42);
            seedDemoData(hotelRepo, roomTypeRepo, availRepo, resRepo, random);

            if ("large".equalsIgnoreCase(seedMode)) {
                seedLargeData(hotelRepo, roomTypeRepo, availRepo, resRepo, largeHotelCount, random);
            }
        };
    }

    private void seedDemoData(HotelRepository hotelRepo,
                              RoomTypeRepository roomTypeRepo,
                              AvailabilityRepository availRepo,
                              ReservationRepository resRepo,
                              Random random) {

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

        Reservation.Status[] statuses = {
                Reservation.Status.CONFIRMED,
                Reservation.Status.PENDING,
                Reservation.Status.COMPLETED,
                Reservation.Status.CANCELLED
        };

        String[] guestNames = {
                "Carlos Garcia", "Maria Lopez", "Jean Dupont", "Emma Wilson",
                "Marco Rossi", "Ana Silva", "Hans Mueller", "Sophie Martin"
        };

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
                RoomType roomType = new RoomType();
                roomType.setName(rd[0]);
                roomType.setDescription(rd[1]);
                roomType.setCapacity(Integer.parseInt(rd[2]));
                roomType.setBasePrice(new BigDecimal(rd[3]));
                roomType.setHotel(hotel);
                roomType = roomTypeRepo.save(roomType);

                LocalDate start = LocalDate.now();
                List<Availability> availabilities = new ArrayList<>();
                for (int d = 0; d < 30; d++) {
                    Availability availability = new Availability();
                    availability.setDate(start.plusDays(d));
                    availability.setAvailableRooms(random.nextInt(10) + 1);
                    availability.setRoomType(roomType);
                    availabilities.add(availability);
                }
                availRepo.saveAll(availabilities);

                if (resIndex < guestNames.length) {
                    Reservation reservation = new Reservation();
                    reservation.setLocator(String.format("ALT-DEMO-%04d", resIndex + 1));
                    reservation.setGuestName(guestNames[resIndex % guestNames.length]);
                    reservation.setGuestEmail(guestNames[resIndex % guestNames.length].toLowerCase().replace(" ", ".") + "@email.com");
                    reservation.setCheckIn(LocalDate.now().plusDays(resIndex));
                    reservation.setCheckOut(LocalDate.now().plusDays(resIndex + 3));
                    reservation.setNumGuests(Math.min(roomType.getCapacity(), 2));
                    reservation.setTotalPrice(roomType.getBasePrice().multiply(BigDecimal.valueOf(3)));
                    reservation.setStatus(statuses[resIndex % statuses.length]);
                    reservation.setHotel(hotel);
                    reservation.setRoomType(roomType);
                    resRepo.save(reservation);
                    if (statusConsumesInventory(reservation.getStatus())) {
                        decrementInventory(availRepo, roomType.getId(), reservation.getCheckIn(), reservation.getCheckOut());
                    }
                    resIndex++;
                }
            }
        }
    }

    private void seedLargeData(HotelRepository hotelRepo,
                               RoomTypeRepository roomTypeRepo,
                               AvailabilityRepository availRepo,
                               ReservationRepository resRepo,
                               int largeHotelCount,
                               Random random) {

        String[] countries = {"Spain", "France", "Italy", "Portugal", "Germany"};
        String[] cities = {"Madrid", "Barcelona", "Paris", "Rome", "Lisbon", "Berlin", "Valencia", "Seville"};

        LocalDate startDate = LocalDate.now();
        int reservationIndex = 1;

        for (int i = 1; i <= largeHotelCount; i++) {
            Hotel hotel = new Hotel();
            hotel.setName("Hotel Altairis Demo " + i);
            hotel.setAddress("Avenida Demo " + i);
            hotel.setCity(cities[i % cities.length]);
            hotel.setCountry(countries[i % countries.length]);
            hotel.setStarRating(3 + (i % 3));
            hotel.setPhone(String.format("+34 900 %03d %03d", i % 1000, (i * 7) % 1000));
            hotel.setEmail("hotel" + i + "@altairis-demo.com");
            hotel.setDescription("Hotel generado para pruebas de volumen y paginacion.");
            hotel.setActive(i % 10 != 0);
            hotel = hotelRepo.save(hotel);

            for (int rt = 1; rt <= 3; rt++) {
                RoomType roomType = new RoomType();
                roomType.setName(rt == 1 ? "Standard" : rt == 2 ? "Superior" : "Family");
                roomType.setDescription("Tipo de habitacion demo para test de carga");
                roomType.setCapacity(rt == 3 ? 4 : 2);
                roomType.setBasePrice(BigDecimal.valueOf(90 + (rt * 35L) + (i % 20)));
                roomType.setHotel(hotel);
                roomType = roomTypeRepo.save(roomType);

                List<Availability> availabilities = new ArrayList<>();
                for (int d = 0; d < 14; d++) {
                    Availability availability = new Availability();
                    availability.setDate(startDate.plusDays(d));
                    availability.setAvailableRooms(5 + random.nextInt(20));
                    availability.setRoomType(roomType);
                    availabilities.add(availability);
                }
                availRepo.saveAll(availabilities);

                if (rt <= 2) {
                    Reservation reservation = new Reservation();
                    reservation.setLocator(String.format("ALT-LARGE-%06d", reservationIndex++));
                    reservation.setGuestName("Guest Demo " + i + "-" + rt);
                    reservation.setGuestEmail("guest" + i + rt + "@demo.com");
                    reservation.setGuestPhone("+34 600 000 000");
                    reservation.setCheckIn(startDate.plusDays(random.nextInt(6)));
                    reservation.setCheckOut(startDate.plusDays(6 + random.nextInt(6)));
                    reservation.setNumGuests(rt == 1 ? 1 : 2);
                    reservation.setTotalPrice(roomType.getBasePrice().multiply(BigDecimal.valueOf(3)));
                    reservation.setStatus(rt == 1 ? Reservation.Status.CONFIRMED : Reservation.Status.PENDING);
                    reservation.setHotel(hotel);
                    reservation.setRoomType(roomType);
                    reservation.setNotes("Reserva generada automaticamente para dataset masivo.");
                    resRepo.save(reservation);
                    if (statusConsumesInventory(reservation.getStatus())) {
                        decrementInventory(availRepo, roomType.getId(), reservation.getCheckIn(), reservation.getCheckOut());
                    }
                }
            }
        }
    }

    private boolean statusConsumesInventory(Reservation.Status status) {
        return status == Reservation.Status.PENDING
                || status == Reservation.Status.CONFIRMED
                || status == Reservation.Status.COMPLETED;
    }

    private void decrementInventory(AvailabilityRepository availRepo, Long roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        List<Availability> range = availRepo.findByRoomTypeIdAndDateBetweenOrderByDateAsc(roomTypeId, checkIn, checkOut.minusDays(1));
        Map<LocalDate, Availability> byDate = new HashMap<>();
        for (Availability availability : range) {
            byDate.put(availability.getDate(), availability);
        }

        for (LocalDate day = checkIn; day.isBefore(checkOut); day = day.plusDays(1)) {
            Availability availability = byDate.get(day);
            if (availability != null && availability.getAvailableRooms() > 0) {
                availability.setAvailableRooms(availability.getAvailableRooms() - 1);
            }
        }
        availRepo.saveAll(range);
    }
}
