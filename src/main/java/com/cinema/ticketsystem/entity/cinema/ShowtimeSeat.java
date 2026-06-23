package com.cinema.ticketsystem.entity.cinema;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // 🌟 Thêm import này

@Entity
@Data
// 🌟 THÊM DÒNG NÀY: Vô hiệu hóa lỗi ByteBuddyInterceptor cho thực thể Trạng thái ghế
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class ShowtimeSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "showtime_id")
    // 💡 Thêm dòng này để khi lấy ghế, nó không lặp ngược lại kéo theo toàn bộ thông tin suất chiếu đồ sộ
    @JsonIgnoreProperties({"showtimes", "hibernateLazyInitializer", "handler"}) 
    private Showtime showtime;

    @ManyToOne
    @JoinColumn(name = "seat_id")
    private Seat seat;

    // 1: Available, 2: Booked, 3: Holding
    private int status;

    private LocalDateTime holdTimestamp;

    public static final int STATUS_AVAILABLE = 1;
    public static final int STATUS_BOOKED = 2;
    public static final int STATUS_HOLDING = 3;
}