package com.cinema.ticketsystem.entity;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cho phép truy cập từ URL /uploads/ tới thư mục uploads thực tế trong dự án
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/"); // Hoặc "file:src/main/resources/static/uploads/" tùy vị trí bạn lưu
    }
}