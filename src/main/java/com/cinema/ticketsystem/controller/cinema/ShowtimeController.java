package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.entity.cinema.Room;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.entity.cinema.Showtime;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;
import com.cinema.ticketsystem.repository.cinema.RoomRepository;
import com.cinema.ticketsystem.repository.cinema.SeatRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;
import com.cinema.ticketsystem.service.cinema.ShowtimeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.cinema.ticketsystem.dto.ShowtimeBatchRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.cinema.ticketsystem.entity.cinema.roles.ShowtimeStatus;

@RestController
@RequestMapping("/api/showtimes")
@CrossOrigin(origins = "*")
public class ShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;

    @Autowired
    private ShowtimeService showtimeService;

    // 1. Lấy danh sách tất cả các suất chiếu ACTIVE (cho khách hàng)
    @GetMapping
    public ResponseEntity<List<Showtime>> getAllShowtimes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        // Nếu có truyền ngày, ta xử lý lấy theo ngày, nếu không truyền (null) thì lấy
        // tất cả
        List<Showtime> showtimes;
        if (date != null) {
            showtimes = showtimeRepository.findByShowDate(date); // Gọi thẳng Repository đã có @EntityGraph
        } else {
            showtimes = showtimeRepository.findAll();
        }

        return ResponseEntity.ok(filterValidShowtimes(showtimes));
    }
    // 1.1. Lấy suất chiếu theo phim và ngày (tùy chọn) - chỉ ACTIVE

    @GetMapping("/filter")
    public List<Showtime> getShowtimesByFilter(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Showtime> results;
        if (movieId != null && date != null) {
            results = showtimeRepository.findByMovieIdAndShowDateAndStatus(movieId, date, ShowtimeStatus.ACTIVE);
        } else if (movieId != null) {
            results = showtimeRepository.findByMovieIdAndStatus(movieId, ShowtimeStatus.ACTIVE);
        } else if (date != null) {
            results = showtimeRepository.findByShowDateAndStatus(date, ShowtimeStatus.ACTIVE);
        } else {
            results = showtimeRepository.findByStatus(ShowtimeStatus.ACTIVE);
        }
        return filterValidShowtimes(results);
    }

    // 1.2. Lấy suất chiếu theo ngày cụ thể
    @GetMapping("/daily")
    public List<Showtime> getShowtimesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Showtime> results = showtimeRepository.findByShowDateAndStatus(date, ShowtimeStatus.ACTIVE);
        return filterValidShowtimes(results);
    }

    // 1.3. Lấy suất chiếu theo tuần (7 ngày từ ngày hiện tại)
    @GetMapping("/weekly")
    public List<Showtime> getShowtimesWeekly(@RequestParam(required = false) Long movieId) {
        LocalDate today = LocalDate.now();
        LocalDate endOfWeek = today.plusDays(6); // 6 ngày sau = 7 ngày tổng cộng
        List<Showtime> results = showtimeRepository.findShowtimesInWeek(movieId, today, endOfWeek);
        return filterValidShowtimes(results);
    }

    // Helper: Lọc suất chiếu, ẩn đi sau khi giờ chiếu đã qua 15 phút
    private List<Showtime> filterValidShowtimes(List<Showtime> showtimes) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        return showtimes.stream().filter(st -> {
            if (st.getShowDate() == null || st.getStartTime() == null) return true;
            java.time.LocalDateTime showStart = java.time.LocalDateTime.of(st.getShowDate(), st.getStartTime());
            return now.isBefore(showStart.plusMinutes(15));
        }).collect(Collectors.toList());
    }

    // 1.4. Gợi ý khung giờ khả dụng cho phòng và ngày
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableShowtimeSlots(@RequestParam Long roomId,
            @RequestParam String date,
            @RequestParam int duration) {
        try {
            return ResponseEntity.ok(showtimeService.findAvailableSlots(roomId, date, duration));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createShowtime(@RequestBody Showtime showtime) {
        try {
            Movie movie = movieRepository.findById(showtime.getMovie().getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
            Room room = roomRepository.findById(showtime.getRoom().getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

            showtime.setMovie(movie);
            showtime.setRoom(room);

            Showtime savedShowtime = showtimeService.createShowtime(showtime);

            // --- TỰ ĐỘNG TẠO BẢN ĐỒ GHẾ CHO SUẤT NÀY ---
            List<Seat> physicalSeats = seatRepository.findByRoomId(savedShowtime.getRoom().getId());
            List<ShowtimeSeat> sts = physicalSeats.stream().map(seat -> {
                ShowtimeSeat stSeat = new ShowtimeSeat();
                stSeat.setShowtime(savedShowtime);
                stSeat.setSeat(seat);
                stSeat.setStatus(1); // 1 = Có sẵn (Available)
                return stSeat;
            }).collect(Collectors.toList());

            showtimeSeatRepository.saveAll(sts);
            return ResponseEntity.ok(savedShowtime);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createShowtimesBatch(@RequestBody ShowtimeBatchRequest request) {
        try {
            return ResponseEntity.ok(showtimeService.createShowtimesBatch(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateShowtime(@PathVariable Long id, @RequestBody Showtime showtime) {
        try {
            return ResponseEntity.ok(showtimeService.updateShowtime(id, showtime));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Lấy sơ đồ ghế của một suất chiếu cụ thể
    @GetMapping("/{showtimeId}/seats")
    public List<ShowtimeSeat> getSeatsByShowtime(@PathVariable Long showtimeId) {
        return showtimeSeatRepository.findByShowtimeId(showtimeId);
    }

    // 4. xóa suất chiếu (cần xóa cả bản đồ ghế liên quan)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        return showtimeRepository.findById(id).map(showtime -> {
            // Xóa bản đồ ghế liên quan trước
            showtimeSeatRepository.deleteAll(showtimeSeatRepository.findByShowtimeId(id));
            // Sau đó mới xóa suất chiếu
            showtimeRepository.delete(showtime);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Cập nhật trạng thái suất chiếu (Admin)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateShowtimeStatus(@PathVariable Long id, @RequestBody ShowtimeStatus newStatus) {
        try {
            Showtime updated = showtimeService.updateShowtimeStatus(id, newStatus);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 6. Lấy tất cả suất chiếu (bao gồm INACTIVE và CANCELLED) - cho Admin
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Showtime> getAllShowtimesForAdmin() {
        return showtimeRepository.findAll();
    }
}