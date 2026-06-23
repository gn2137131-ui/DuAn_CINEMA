package com.cinema.ticketsystem.repository.cinema;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.user.User;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Tìm danh sách đơn hàng của một người dùng cụ thể (Sắp xếp mới nhất lên đầu)
    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);

    List<Booking> findByUserId(Long userId);

    List<Booking> findByUserAndPaymentStatus(User user, String paymentStatus);

    // Tìm danh sách đơn hàng theo trạng thái thanh toán
    List<Booking> findByPaymentStatus(String paymentStatus);

    // Tìm booking theo mã tham chiếu giao dịch ngân hàng
    Optional<Booking> findByTransactionReference(String transactionReference);

    // Trong BookingRepository.java
    Optional<Booking> findByOrderCode(String orderCode);
    
    Optional<Booking> findFirstByOrderCodeStartingWith(String prefix);

    // ==========================================
    // STATS QUERIES
    // ==========================================

    @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.paymentStatus = 'PAID'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COUNT(DISTINCT b.user.id) FROM Booking b WHERE b.paymentStatus = 'PAID'")
    Long getTotalCustomers();

    @Query("SELECT COUNT(t.id) FROM Booking b JOIN b.tickets t WHERE b.paymentStatus = 'PAID'")
    Long getTicketsSold();

    @Query(value = "SELECT " +
            "MONTH(bg.booking_time) AS month, " +
            "SUM(bg.total_price) AS revenue, " +
            "SUM(bg.ticket_count) AS tickets " +
            "FROM (" +
            "  SELECT b.id, b.booking_time, b.total_price, COUNT(t.id) AS ticket_count " +
            "  FROM bookings b " +
            "  LEFT JOIN ticket t ON t.booking_id = b.id " +
            "  WHERE b.payment_status = 'PAID' AND YEAR(b.booking_time) = :year " +
            "  GROUP BY b.id, b.booking_time, b.total_price" +
            ") bg " +
            "GROUP BY MONTH(bg.booking_time)", nativeQuery = true)
    List<Object[]> getRevenueByMonth(@Param("year") int year);

    @Query(value = "SELECT m.title AS movie, " +
            "SUM(bg.total_price) AS revenue, " +
            "SUM(bg.ticket_count) AS tickets " +
            "FROM (" +
            "  SELECT b.id, b.total_price, COUNT(t.id) AS ticket_count, MAX(m2.id) as movie_id " +
            "  FROM bookings b " +
            "  JOIN ticket t ON t.booking_id = b.id " +
            "  JOIN showtime_seat ss ON t.showtime_seat_id = ss.id " +
            "  JOIN showtime st ON ss.showtime_id = st.id " +
            "  JOIN movies m2 ON st.movie_id = m2.id " +
            "  WHERE b.payment_status = 'PAID' " +
            "  GROUP BY b.id, b.total_price" +
            ") bg " +
            "JOIN movies m ON m.id = bg.movie_id " +
            "GROUP BY m.id, m.title " +
            "ORDER BY revenue DESC", nativeQuery = true)
    List<Object[]> getRevenueByMovie();

    @Query(value = "SELECT m.genre AS genre, COUNT(m.id) AS count FROM movies m GROUP BY m.genre", nativeQuery = true)
    List<Object[]> getMovieGenreShare();

    List<Booking> findTop10ByOrderByBookingTimeDesc();
}