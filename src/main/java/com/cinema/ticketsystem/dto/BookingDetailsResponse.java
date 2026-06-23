package com.cinema.ticketsystem.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDetailsResponse {
    private Long id;
    private String bookingCode;
    private String status;
    private BigDecimal totalAmount;
    private String createdAt;
    private MovieDto movie;
    private ShowtimeDto showtime;
    private List<SeatDto> seats;
    private CustomerInfoDto customerInfo;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovieDto {
        private Long id;
        private String title;
        private String posterUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShowtimeDto {
        private String theater;
        private String format;
        private String date;
        private String time;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatDto {
        private Long id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfoDto {
        private String name;
        private String email;
        private String phone;
    }
}
