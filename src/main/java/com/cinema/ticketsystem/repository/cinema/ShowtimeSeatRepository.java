package com.cinema.ticketsystem.repository.cinema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import jakarta.persistence.LockModeType;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, Long> {
    // Tìm danh sách ghế của một suất chiếu cụ thể
    List<ShowtimeSeat> findByShowtimeId(Long showtimeId);

    // Tìm danh sách ghế có trạng thái "Đang giữ" mà đã hết thời gian giữ (Dùng để giải phóng ghế)
    List<ShowtimeSeat> findByStatusAndHoldTimestampBefore(int status, LocalDateTime dateTime);

    // Tìm chính xác 1 ghế của 1 suất chiếu cụ thể
    Optional<ShowtimeSeat> findByShowtimeIdAndSeatId(Long showtimeId, Long seatId);

    // Khóa cứng khi giữ ghế từ UI — tránh race condition 2 user cùng hold 1 ghế
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ShowtimeSeat s WHERE s.showtime.id = :showtimeId AND s.seat.id = :seatId")
    Optional<ShowtimeSeat> findByShowtimeIdAndSeatIdWithLock(@Param("showtimeId") Long showtimeId,
                                                              @Param("seatId") Long seatId);

    // Khóa cứng (Pessimistic Write Lock) khi đọc ghế — tránh race condition khi nhiều user cùng giữ 1 ghế
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ShowtimeSeat s WHERE s.id = :id")
    Optional<ShowtimeSeat> findByIdWithLock(@Param("id") Long id);

    List<ShowtimeSeat> findAll();
}