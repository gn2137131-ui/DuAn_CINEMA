package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Room;
import com.cinema.ticketsystem.repository.cinema.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")//1
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    // 1. Lấy danh sách tất cả các phòng chiếu
    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // 2. Thêm phòng chiếu mới (Ví dụ: Thêm phòng IMAX, phòng 4DX)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Room createRoom(@RequestBody Room room) {
        return roomRepository.save(room);
    }

    // 3. Lấy thông tin chi tiết 1 phòng (Để biết số hàng/cột nhằm vẽ sơ đồ ghế)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Cập nhật thông tin phòng (Đổi tên phòng hoặc nâng cấp loại phòng)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Room roomDetails) {
        return roomRepository.findById(id).map(room -> {
            room.setName(roomDetails.getName());
            room.setType(roomDetails.getType());
            room.setTotalRows(roomDetails.getTotalRows());
            room.setTotalColumns(roomDetails.getTotalColumns());
            return ResponseEntity.ok(roomRepository.save(room));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Xóa phòng chiếu
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        return roomRepository.findById(id).map(room -> {
            roomRepository.delete(room);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}