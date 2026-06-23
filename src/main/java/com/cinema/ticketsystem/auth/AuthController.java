package com.cinema.ticketsystem.auth;

import com.cinema.ticketsystem.dto.LoginRequest;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;
import com.cinema.ticketsystem.service.jwt.AuthService;

import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            String token = authService.register(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Đăng ký thành công!",
                    "token", "Bearer " + token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.login(request.getUsername(), request.getPassword());
            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng nhập thành công!");
            response.put("token", "Bearer " + token);
            response.put("role", user.getRole().name());
            response.put("username", user.getUsername());
            
            Map<String, String> userDetails = new HashMap<>();
            userDetails.put("name", user.getFullName() != null ? user.getFullName() : user.getUsername());
            userDetails.put("avatarUrl", user.getAvatar() != null ? user.getAvatar() : "");
            response.put("user", userDetails);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }
}