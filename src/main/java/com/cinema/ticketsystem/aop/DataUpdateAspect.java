package com.cinema.ticketsystem.aop;

import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class DataUpdateAspect {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Pointcut("within(com.cinema.ticketsystem.controller.cinema.*) && " +
            "(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping))")
    public void modifyingMethods() {}

    @Pointcut("!within(com.cinema.ticketsystem.controller.cinema.BookingController) && " +
            "!within(com.cinema.ticketsystem.controller.cinema.ReviewController) && " +
            "!within(com.cinema.ticketsystem.controller.cinema.MovieCommentController) && " +
            "!within(com.cinema.ticketsystem.controller.cinema.WebhookController) && " +
            "!within(com.cinema.ticketsystem.controller.cinema.ShowtimeSeatController)")
    public void excludeUserControllers() {}

    @AfterReturning("modifyingMethods() && excludeUserControllers()")
    public void afterDataModified() {
        // Send a message to /topic/public/updates when admin data is modified
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "DATA_UPDATED");
        payload.put("timestamp", System.currentTimeMillis());
        
        try {
            messagingTemplate.convertAndSend("/topic/public/updates", payload);
            System.out.println("Broadcasted data update event to /topic/public/updates");
        } catch (Exception e) {
            System.err.println("Failed to broadcast data update event: " + e.getMessage());
        }
    }
}
