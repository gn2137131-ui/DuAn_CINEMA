package com.cinema.ticketsystem.dto;



import java.util.List;

import lombok.Data;

@Data
public class BookingRequestDTO {
    private List<Long> showtimeSeatIds;
    private List<BookingFoodDTO> bookingFoods;
    private CustomerInfoDTO customerInfo;
    private String discountCode;
    
    // Getters & Setters
}