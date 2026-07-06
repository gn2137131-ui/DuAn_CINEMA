package com.cinema.ticketsystem.dto;

import lombok.Data;

/**
 * DTO cho endpoint đăng ký — chỉ nhận đúng các trường cần thiết.
 * Ngăn Mass Assignment Attack (user tự set role=ADMIN từ JSON body).
 */
@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String phone;
    private String fullName;
}
