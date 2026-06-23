package com.cinema.ticketsystem.service.cinema;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {
    // Map lưu trữ kết nối: Key là BookingId
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long bookingId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // Timeout cực lâu
        emitters.put(bookingId, emitter);

        emitter.onCompletion(() -> emitters.remove(bookingId));
        emitter.onTimeout(() -> emitters.remove(bookingId));
        return emitter;
    }

    public void sendPaymentSuccess(Long bookingId) {
        SseEmitter emitter = emitters.get(bookingId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("payment-success").data("PAID"));
                emitter.complete(); // Đóng kết nối sau khi gửi xong
            } catch (Exception e) {
                emitters.remove(bookingId);
            }
        }
    }
}