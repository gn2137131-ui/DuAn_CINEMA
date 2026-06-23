package com.cinema.ticketsystem.repository.cinema;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinema.ticketsystem.entity.cinema.Ticket;

import java.util.List;
import java.util.Optional;
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    // Tìm kiếm vé bằng mã Code (Phục vụ chức năng quét QR Code tại rạp)
    Optional<Ticket> findByTicketCode(String ticketCode);

    @Query("SELECT t FROM Ticket t WHERE t.showtimeSeat.showtime.id = :showtimeId")
    List<Ticket> findByShowtimeId(@Param("showtimeId") Long showtimeId);
}