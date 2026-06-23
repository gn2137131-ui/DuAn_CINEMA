package com.cinema.ticketsystem.repository.cinema;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cinema.ticketsystem.entity.cinema.Seat;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    // Custom query methods can be defined here
    List<Seat> findByRoomId(Long roomId);

    // Thêm dòng này để tìm tất cả ghế của một hàng trong một phòng cụ thể
    List<Seat> findByRoomIdAndRowName(Long roomId, String rowName);
}