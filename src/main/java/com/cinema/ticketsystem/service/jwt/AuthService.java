package com.cinema.ticketsystem.service.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public String register(User user) {
        // Mã hóa mật khẩu trước khi lưu
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Nếu không gửi role từ Postman, mặc định là CUSTOMER
        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
        }

        userRepository.save(user);
        return "Đăng ký thành công!";
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