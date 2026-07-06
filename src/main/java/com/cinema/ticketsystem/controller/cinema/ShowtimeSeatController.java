package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;
import com.cinema.ticketsystem.service.jwt.AuthService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/showtime-seats")
@RequiredArgsConstructor
public class ShowtimeSeatController {

    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final AuthService authService;

    // 1. Lấy sơ đồ ghế của một suất chiếu
    @GetMapping("/showtime/{showtimeId}")
    public List<ShowtimeSeat> getSeatsByShowtime(@PathVariable("showtimeId") Long showtimeId) {
        return showtimeSeatRepository.findByShowtimeId(showtimeId);
    }

    // DTO: cấu trúc dữ liệu nhận từ React
    public static class SeatRequest {
        private Long showtimeId;
        private Long seatId;

        public Long getShowtimeId() { return showtimeId; }
        public void setShowtimeId(Long showtimeId) { this.showtimeId = showtimeId; }
        public Long getSeatId() { return seatId; }
        public void setSeatId(Long seatId) { this.seatId = seatId; }
    }

    // 2. API GIỮ GHẾ
    @PutMapping("/hold")
    @Transactional
    public ResponseEntity<?> holdSeat(@RequestBody SeatRequest request) {
        // Lấy thông tin user đang đăng nhập
        User currentUser = authService.getCurrentUser();

        // Dùng PESSIMISTIC_WRITE lock để tránh race condition: chỉ 1 transaction được đọc+ghi cùng lúc
        ShowtimeSeat seat = showtimeSeatRepository
                .findByShowtimeIdAndSeatIdWithLock(request.getShowtimeId(), request.getSeatId())
                .orElse(null);

        if (seat == null) {
            return ResponseEntity.badRequest().body("Không tìm thấy thông tin vị trí ghế cho suất chiếu này!");
        }

        // Chỉ cho giữ nếu ghế đang ở trạng thái Available
        if (seat.getStatus() != ShowtimeSeat.STATUS_AVAILABLE) {
            return ResponseEntity.badRequest().body("Ghế này đã có người nhanh tay chọn trước hoặc đã bán!");
        }

        // Kiểm tra thời gian suất chiếu
        LocalDateTime showStartDateTime = LocalDateTime.of(
                seat.getShowtime().getShowDate(),
                seat.getShowtime().getStartTime());

        if (!showStartDateTime.isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Suất chiếu đã diễn ra, không thể thực hiện thao tác giữ ghế!");
        }

        seat.setStatus(ShowtimeSeat.STATUS_HOLDING);
        seat.setHoldTimestamp(LocalDateTime.now());
        // Lưu ID của user đang giữ ghế để ngăn user khác "cướp" ghế này
        seat.setHoldingUserId(currentUser.getId());

        showtimeSeatRepository.save(seat);
        return ResponseEntity.ok("Giữ vị trí ghế thành công.");
    }

    // 3. API NHẢ GHẾ
    @PutMapping("/release")
    @Transactional
    public ResponseEntity<?> releaseSeat(@RequestBody SeatRequest request) {
        User currentUser = authService.getCurrentUser();

        ShowtimeSeat seat = showtimeSeatRepository
                .findByShowtimeIdAndSeatId(request.getShowtimeId(), request.getSeatId())
                .orElse(null);

        if (seat != null && seat.getStatus() == ShowtimeSeat.STATUS_HOLDING) {
            // Chỉ cho phép người đã giữ ghế (hoặc admin) mới được nhả
            if (currentUser.getId().equals(seat.getHoldingUserId())
                    || com.cinema.ticketsystem.entity.user.Role.ADMIN.equals(currentUser.getRole())) {
                seat.setStatus(ShowtimeSeat.STATUS_AVAILABLE);
                seat.setHoldTimestamp(null);
                seat.setHoldingUserId(null);
                showtimeSeatRepository.save(seat);
            }
        }
        return ResponseEntity.ok("Đã huỷ chọn ghế thành công.");
    }
}