package com.cinema.ticketsystem.entity.cinema;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
// Fix #11: tên bảng rõ ràng; Fix #12: unique constraint ngăn DB tạo 2 row trùng ghế-suất chiếu
@Table(name = "showtime_seat", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"showtime_id", "seat_id"})
})
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ShowtimeSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fix #9: LAZY thay vì EAGER mặc định — tránh N+1 queries khi load danh sách ghế
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id")
    @JsonIgnoreProperties({"showtimes", "hibernateLazyInitializer", "handler"})
    private Showtime showtime;

    // Fix #9: LAZY thay vì EAGER mặc định
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    // 1: Available, 2: Booked, 3: Holding
    private int status;

    private LocalDateTime holdTimestamp;

    // ID của user đang giữ ghế (null nếu không có ai giữ)
    @Column(name = "holding_user_id")
    private Long holdingUserId;

    // Optimistic Locking: ngăn 2 request đồng thời ghi đè nhau (Race Condition)
    @Version
    private Long version;

    public static final int STATUS_AVAILABLE = 1;
    public static final int STATUS_BOOKED = 2;
    public static final int STATUS_HOLDING = 3;
}