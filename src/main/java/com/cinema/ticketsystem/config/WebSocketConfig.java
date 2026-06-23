package com.cinema.ticketsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt broker cho các endpoint tiền tố "/topic" (để broadcast) và "/queue"
        config.enableSimpleBroker("/topic", "/queue");
        // Các message client gửi lên server phải bắt đầu bằng "/app"
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Điểm cuối (endpoint) để client kết nối qua WebSocket
        registry.addEndpoint("/ws-cinema")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
