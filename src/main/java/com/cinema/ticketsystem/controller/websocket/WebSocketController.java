package com.cinema.ticketsystem.controller.websocket;

import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    // Lắng nghe các sự kiện từ client gửi vào /app/seats/lock/{showtimeId}
    @MessageMapping("/seats/lock/{showtimeId}")
    @SendTo("/topic/seats/{showtimeId}")
    public Map<String, Object> handleSeatLock(@DestinationVariable String showtimeId, @Payload Map<String, Object> payload) {
        // payload có thể chứa: seatId, action (lock/unlock), userId, sessionId
        // Cứ có thông tin, server sẽ broadcast ngay lập tức cho toàn bộ user đang subscribe /topic/seats/{showtimeId}
        return payload;
    }
}
