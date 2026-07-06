package com.cinema.ticketsystem.entity.cinema;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "ticket") // Revert to original table name
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fix #9: LAZY thay vì EAGER mặc định — tránh N+1
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    @JsonBackReference(value = "booking-tickets")
    private Booking booking;

    @OneToOne(fetch = FetchType.LAZY) // Fix #9: LAZY
    @JoinColumn(name = "showtime_seat_id")
    private ShowtimeSeat showtimeSeat;

    private double price; // Giá thực tế của vé này (đã bao gồm phụ phí)
    private String ticketCode; // Mã QR dùng để soát vé

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, CANCELLED, USED
}