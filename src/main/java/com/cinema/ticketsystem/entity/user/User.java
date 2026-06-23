package com.cinema.ticketsystem.entity.user;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // Lưu ý: Sẽ được mã hóa BCrypt

    private String fullName;
    private String email;
    private String phone;
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(nullable = false, columnDefinition = "int default 0")
    private Integer loyaltyPoints = 0;
}

