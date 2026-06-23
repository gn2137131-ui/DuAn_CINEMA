package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "settings")
@Data
public class Settings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thông tin rạp
    @JsonProperty("cinema_name")
    @Column(name = "cinema_name")
    private String cinemaName; // Tên rạp (ví dụ: Cinema Galaxy)

    @Column(nullable = true)
    private String email; // Email liên hệ

    @JsonProperty("phone_number")
    @Column(name = "phone_number")
    private String phoneNumber; // Số điện thoại hotline

    @Column(nullable = true)
    private String address; // Địa chỉ rạp

    @Column(columnDefinition = "TEXT")
    private String introduction; // Giới thiệu về rạp

    // Cấu hình giảm giá theo đối tượng (lưu dạng %)
    @JsonProperty("student_discount")
    @Column(name = "student_discount")
    private Double studentDiscount = 0.0; // Giảm giá sinh viên (%)

    @JsonProperty("elder_discount")
    @Column(name = "elder_discount")
    private Double elderDiscount = 0.0; // Giảm giá người cao tuổi (%)

    @JsonProperty("child_discount")
    @Column(name = "child_discount")
    private Double childDiscount = 0.0; // Giảm giá trẻ em (%)

    @JsonProperty("weekend_surcharge")
    @Column(name = "weekend_surcharge")
    private Double weekendSurcharge = 0.1; // Phụ phí cuối tuần (10% mặc định)

    @JsonProperty("peak_hour_surcharge")
    @Column(name = "peak_hour_surcharge")
    private Double peakHourSurcharge = 0.2; // Phụ phí giờ cao điểm 18h-23h (20% mặc định)

    @JsonProperty("vip_seat_surcharge")
    @Column(name = "vip_seat_surcharge")
    private Double vipSeatSurcharge = 20000.0; // Phụ phí ghế VIP (đơn vị tiền)

    @Column(columnDefinition = "TEXT")
    private String notes; // Ghi chú thêm
}
