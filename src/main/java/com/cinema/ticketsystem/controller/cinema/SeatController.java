package com.cinema.ticketsystem.controller.cinema;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.ticketsystem.entity.cinema.Room;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.repository.cinema.RoomRepository;
import com.cinema.ticketsystem.repository.cinema.SeatRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ShowtimeSeatRepository showtimeSeatRepository;

    // API: Tự động tạo ghế cho một phòng (Admin gọi cái này sau khi tạo Room)
    @PostMapping("/generate/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> generateSeatsForRoom(@PathVariable("roomId") Long roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();

        char rowName = 'A';
        for (int i = 0; i < room.getTotalRows(); i++) {
            for (int j = 1; j <= room.getTotalColumns(); j++) {
                Seat seat = new Seat();
                seat.setRoom(room);
                seat.setRowName(String.valueOf(rowName));
                seat.setColIndex(j);
                seat.setSeatType("NORMAL"); // Mặc định là ghế thường
                seatRepository.save(seat);
            }
            rowName++; // Chuyển từ hàng A sang hàng B, C...
        }
        return ResponseEntity
                .ok("Đã tạo xong " + (room.getTotalRows() * room.getTotalColumns()) + " ghế cho " + room.getName());
    }

    // Lấy danh sách ghế của một phòng để hiển thị sơ đồ
    @GetMapping("/room/{roomId}")
    public List<Seat> getSeatsByRoom(@PathVariable("roomId") Long roomId) {
        return seatRepository.findByRoomId(roomId);
    }

    // Trong SeatController.java

    @PutMapping("/update-row-vip")
    public ResponseEntity<String> setRowAsVip(@RequestParam("roomId") Long roomId, @RequestParam("rowName") String rowName) {
        List<Seat> seats = seatRepository.findByRoomIdAndRowName(roomId, rowName);

        if (seats.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        for (Seat seat : seats) {
            seat.setSeatType("VIP");
        }
        seatRepository.saveAll(seats); // Lưu nhanh cả danh sách

        return ResponseEntity.ok("Hàng " + rowName + " của phòng " + roomId + " đã được chuyển thành ghế VIP!");
    }

    @GetMapping("/admin/reset-seats")
    public String resetSeats() {
        showtimeSeatRepository.findAll().forEach(s -> {
            s.setStatus(1);
            showtimeSeatRepository.save(s);
        });
        return "Đã reset xong!";
    }

    // Cập nhật loại ghế cho 1 ghế riêng lẻ (NORMAL, VIP, COUPLE, BROKEN)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSeatType(@PathVariable("id") Long id, @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> payload) {
        return seatRepository.findById(id).map(seat -> {
            if (payload.containsKey("seatType")) {
                seat.setSeatType(payload.get("seatType"));
            }
            seatRepository.save(seat);
            return ResponseEntity.ok(seat);
        }).orElse(ResponseEntity.notFound().build());
    }
}