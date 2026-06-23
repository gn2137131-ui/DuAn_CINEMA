package com.cinema.ticketsystem.service.payment;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.dto.QrCodeResponse;
import com.cinema.ticketsystem.entity.cinema.SePay;

@Service
public class PaymentService {
    
    @Autowired
    private SePay sePayConfig;

    // Giả lập thanh toán MoMo/VNPay
    public boolean processPayment(double amount, String paymentMethod) {
        System.out.println("Processing payment of " + amount + " via " + paymentMethod);
        return true; // Giả lập thành công
    }

    // Tạo SePay QR Code URL
    public QrCodeResponse generateSePayQrCode(Long bookingId, String orderCode, double amount) {
        QrCodeResponse response = new QrCodeResponse();
        response.setBookingId(bookingId);
        response.setOrderCode(orderCode);
        response.setAmount(amount);
        
        try {
            // Nội dung chuyển khoản cho khách hàng phải là mã đơn hàng thực tế
            // Để SePay webhook gửi về đúng mã orderCode và có thể đối soát với DB
            String description = orderCode;
            
            // URL VietQR: Format chuẩn cho các ngân hàng Việt Nam
            // Bạn có thể thay đổi ngân hàng, số tài khoản tại đây
            String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                "MB",  // Mã ngân hàng (MB = MBBank, VCB = VietcomBank, TCB = Techcombank, etc.)
                sePayConfig.getAccountNumber(),
                (long) amount,
                URLEncoder.encode(description, StandardCharsets.UTF_8.toString()),
                URLEncoder.encode(sePayConfig.getAccountName(), StandardCharsets.UTF_8.toString())
            );
            
            response.setQrUrl(qrUrl);
            response.setQrData(String.format(
                "https://api.vietqr.io/image/MB-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                sePayConfig.getAccountNumber(),
                (long) amount,
                description,
                sePayConfig.getAccountName()
            ));
            response.setDescription(description);
            
            return response;
            
        } catch (UnsupportedEncodingException e) {
            System.err.println("Error encoding QR code URL: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // Tạo URL thanh toán (placeholder)
    public String generatePaymentUrl(Long bookingId, double amount) {
        return "https://sandbox.momo.vn/payment?bookingId=" + bookingId + "&amount=" + amount;
    }
}