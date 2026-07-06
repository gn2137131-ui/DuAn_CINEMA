package com.cinema.ticketsystem.service.jwt;

import com.cinema.ticketsystem.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Fix #1: nhận RegisterRequest DTO thay vì User entity
    // → luôn set role = CUSTOMER, không để client tự truyền role
    public String register(RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Tên đăng nhập không được để trống");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email không được để trống");
        }
        if (request.getPhone() == null || !request.getPhone().matches("\\d{10}")) {
            throw new RuntimeException("Số điện thoại phải bao gồm đúng 10 chữ số");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự");
        }
        if (!request.getPassword().matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setFullName(request.getFullName());
        // Mã hóa mật khẩu trước khi lưu
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Fix #1: LUÔN set CUSTOMER — client không thể tự set ADMIN qua API
        user.setRole(Role.CUSTOMER);

        userRepository.save(user);
        return jwtService.generateToken(user);
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Sai tên đăng nhập hoặc mật khẩu"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            // Truyền cả object user vào để JwtService lấy được Role nhồi vào Token
            return jwtService.generateToken(user);
        } else {
            throw new RuntimeException("Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    public User getCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
    }
}