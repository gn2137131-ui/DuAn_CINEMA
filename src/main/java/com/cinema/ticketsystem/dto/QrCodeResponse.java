package com.cinema.ticketsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QrCodeResponse {
    private String qrUrl;      // URL hình ảnh QR code
    private String qrData;     // Dữ liệu QR (để backup)
    private Long bookingId;    // ID đơn hàng
    private String orderCode;  // Mã đơn hàng (VD: DH10293)
    private Double amount;     // Số tiền phải thanh toán
    private String description; // Nội dung chuyển khoản (cho khách)
}
