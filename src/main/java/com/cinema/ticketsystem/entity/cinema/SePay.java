package com.cinema.ticketsystem.entity.cinema;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "sepay.api")
public class SePay {
    private String key;
    private String accountNumber = "0123456789"; // Số tài khoản mặc định
    private String accountName = "CINEMA"; // Tên tài khoản
}
