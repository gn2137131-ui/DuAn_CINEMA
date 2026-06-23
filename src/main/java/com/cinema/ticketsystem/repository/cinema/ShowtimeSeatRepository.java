package com.cinema.ticketsystem.repository.cinema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, Long> {
    // Tìm danh sách ghế của một suất chiếu cụ thể
    List<ShowtimeSeat> findByShowtimeId(Long showtimeId);

    // Tìm danh sách ghế có trạng thái "Đang giữ" mà đã hết thời gian giữ (Dùng để
    // giải phóng ghế)
    List<ShowtimeSeat> findByStatusAndHoldTimestampBefore(int status, LocalDateTime dateTime);

    // 🌟 THÊM DÒNG NÀY: Tìm chính xác 1 ghế của 1 suất chiếu cụ thể
    Optional<ShowtimeSeat> findByShowtimeIdAndSeatId(Long showtimeId, Long seatId);

    // Thêm các phương thức tùy chỉnh khác nếu cần (VD: tìm theo trạng thái, tìm theo userId đang giữ ghế...)
    //findAll
    List<ShowtimeSeat> findAll();
    
}