package com.cinema.ticketsystem.controller.cinema;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.ticketsystem.dto.SePayWebhookRequest;
import com.cinema.ticketsystem.entity.cinema.SePay;
import com.cinema.ticketsystem.service.cinema.BookingService;
import com.cinema.ticketsystem.service.cinema.NotificationService;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private final BookingService bookingService;
    private final NotificationService notificationService;
    private final SePay sePayConfig;

    @Autowired
    public WebhookController(BookingService bookingService, NotificationService notificationService,
            SePay sePayConfig) {
        this.bookingService = bookingService;
        this.notificationService = notificationService;
        this.sePayConfig = sePayConfig;
    }

    @PostMapping("/sepay")
    public ResponseEntity<?> handleSePayWebhook(@RequestBody SePayWebhookRequest payload,
            @RequestHeader(value = "X-SEPAY-KEY", required = false) String sepayKey) {
        try {
            // 1. Kiểm tra bảo mật Key
            if (sePayConfig.getKey() != null && !sePayConfig.getKey().isBlank()) {
                if (sepayKey == null) {
                    System.out.println("CẢNH BÁO: Webhook gọi đến không có X-SEPAY-KEY. Đang cho phép vượt qua để TEST...");
                } else if (!sePayConfig.getKey().equals(sepayKey)) {
                    System.out.println("LỖI: X-SEPAY-KEY không khớp!");
                    return ResponseEntity.status(403)
                            .body(Map.of("success", false, "message", "Secret key không hợp lệ."));
                }
            }

            // 2. Log dữ liệu để debug
            System.out.println("====== SEPAY WEBHOOK: Mã đơn " + payload.getCode() + " ======");
            System.out.println("Amount: " + payload.getTransferAmount());
            System.out.println("Reference: " + payload.getReferenceCode());
            System.out.println("Transfer Type: " + payload.getTransferType());

            // 3. Kiểm tra loại giao dịch
            if (payload.getTransferType() != null && !"in".equalsIgnoreCase(payload.getTransferType())) {
                throw new RuntimeException("Chỉ chấp nhận giao dịch incoming (in) từ SePay.");
            }

            // 4. Gọi Service (truyền đối tượng payload đã sửa lỗi parameter)
            Long bookingId = bookingService.handleWebhookPayment(payload);

            // 5. Gửi event thanh toán thành công qua SSE
            if (bookingId != null) {
                notificationService.sendPaymentSuccess(bookingId);
            }

            return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Thanh toán đã được xác nhận", 
                "bookingId", bookingId
            ));

        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(400).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}