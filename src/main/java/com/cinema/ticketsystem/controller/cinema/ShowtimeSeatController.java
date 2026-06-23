package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/showtime-seats")
@CrossOrigin("*")
public class ShowtimeSeatController {

    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;

    // 1. Lấy sơ đồ ghế của một suất chiếu
    @GetMapping("/showtime/{showtimeId}")
    public List<ShowtimeSeat> getSeatsByShowtime(@PathVariable Long showtimeId) {
        return showtimeSeatRepository.findByShowtimeId(showtimeId);
    }

    // 🌟 LỚP DTO: Định nghĩa cấu trúc khớp hoàn toàn với Object dữ liệu từ React
    // gửi sang
    public static class SeatRequest {
        private Long showtimeId;
        private Long seatId;

        public Long getShowtimeId() {
            return showtimeId;
        }

        public void setShowtimeId(Long showtimeId) {
            this.showtimeId = showtimeId;
        }

        public Long getSeatId() {
            return seatId;
        }

        public void setSeatId(Long seatId) {
            this.seatId = seatId;
        }
    }

    // 2. API GIỮ GHẾ: Đã sửa đổi để hứng Object { showtimeId, seatId } từ React
    @PutMapping("/hold")
    @Transactional
    public ResponseEntity<?> holdSeat(@RequestBody SeatRequest request) {
        // Tìm đúng ghế của suất chiếu đó trong DB
        ShowtimeSeat seat = showtimeSeatRepository
                .findByShowtimeIdAndSeatId(request.getShowtimeId(), request.getSeatId())
                .orElse(null);

        if (seat == null) {
            return ResponseEntity.badRequest().body("Không tìm thấy thông tin vị trí ghế cho suất chiếu này!");
        }

        // Chỉ cho giữ nếu ghế đang ở trạng thái Available (1)
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

        seat.setStatus(ShowtimeSeat.STATUS_HOLDING); // 3: Đang giữ (Holding)
        seat.setHoldTimestamp(LocalDateTime.now());

        showtimeSeatRepository.save(seat);
        return ResponseEntity.ok("Giữ vị trí ghế thành công.");
    }

    // 3. API NHẢ GHẾ: Đã sửa đổi khớp cấu trúc để hủy chọn ghế mượt mà
    @PutMapping("/release")
    @Transactional
    public ResponseEntity<?> releaseSeat(@RequestBody SeatRequest request) {
        ShowtimeSeat seat = showtimeSeatRepository
                .findByShowtimeIdAndSeatId(request.getShowtimeId(), request.getSeatId())
                .orElse(null);

        if (seat != null && seat.getStatus() == ShowtimeSeat.STATUS_HOLDING) {
            seat.setStatus(ShowtimeSeat.STATUS_AVAILABLE);
            seat.setHoldTimestamp(null);
            showtimeSeatRepository.save(seat);
        }
        return ResponseEntity.ok("Đã huỷ chọn ghế thành công.");
    }
}