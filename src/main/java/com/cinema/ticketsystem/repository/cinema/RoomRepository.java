package com.cinema.ticketsystem.repository.cinema;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cinema.ticketsystem.entity.cinema.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    // Custom query methods can be defined here
    //tính tổng số ghế theo id phòng
    @Query("SELECT r.totalRows * r.totalColumns FROM Room r WHERE r.id = :roomId")
    Integer calculateTotalSeats(@Param("roomId") Long roomId);
}