package com.cinema.ticketsystem.entity.cinema;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // 🌟 Thêm import này nếu chưa có
import jakarta.persistence.*;

@Entity
@Table(name = "seats")
@Data
// 🌟 THÊM DÒNG NÀY: Giúp Jackson bỏ qua các thuộc tính Proxy của Hibernate khi render danh sách ghế
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fix #9: LAZY thay vì EAGER mặc định
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    @JsonBackReference // Khớp với @JsonManagedReference ở Room để tránh vòng lặp vô hạn
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Room room;
    
    private String rowName; // Ví dụ: A, B, C

    private int colIndex; // Ví dụ: 1, 2, 3

    private String seatType; 

    public String getSeatNumber() {
        return this.rowName + this.colIndex;
    }
}