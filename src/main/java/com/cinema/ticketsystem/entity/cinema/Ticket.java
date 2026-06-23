package com.cinema.ticketsystem.entity.cinema;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Entity
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    @JsonBackReference(value = "booking-tickets")
    private Booking booking;

    @OneToOne
    @JoinColumn(name = "showtime_seat_id")
    private ShowtimeSeat showtimeSeat;

    private double price; // Giá thực tế của vé này (đã bao gồm phụ phí)
    private String ticketCode; // Mã QR dùng để soát vé

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, CANCELLED, USED
}