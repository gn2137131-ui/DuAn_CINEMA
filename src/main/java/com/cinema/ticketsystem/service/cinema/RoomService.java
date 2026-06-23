package com.cinema.ticketsystem.service.cinema;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.cinema.ticketsystem.entity.cinema.Room;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.repository.cinema.RoomRepository;
import com.cinema.ticketsystem.repository.cinema.SeatRepository;
import org.springframework.transaction.annotation.Transactional;


@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Transactional
    public Room createRoomWithSeats(Room room) {
        // 1. Tính tổng số ghế và lưu Room trước để lấy ID
        room.setBasePrice((double) (room.getTotalRows() * room.getTotalColumns()));
        Room savedRoom = roomRepository.save(room);

        // 2. Vòng lặp tự động tạo ghế
        for (int i = 0; i < savedRoom.getTotalRows(); i++) {
            // Chuyển chỉ số i (0, 1, 2...) thành chữ cái (A, B, C...)
            String rowName = String.valueOf((char) ('A' + i));

            for (int j = 1; j <= savedRoom.getTotalColumns(); j++) {
                Seat seat = new Seat();
                seat.setRoom(savedRoom);
                seat.setRowName(rowName);
                seat.setColIndex(j);
                
                // Mặc định: các hàng đầu là ghế thường, các hàng sau là VIP (tùy bạn chỉnh)
                if (i >= 5) { 
                    seat.setSeatType("VIP");
                } else {
                    seat.setSeatType("Standard");
                }
                
                seatRepository.save(seat);
            }
        }
        return savedRoom;
    }
}