package com.cinema.ticketsystem.service.jwt;

import com.cinema.ticketsystem.dto.RegisterRequest;
import com.cinema.ticketsystem.dto.ChangePasswordRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;
import com.cinema.ticketsystem.service.cinema.EmailService;
import java.util.UUID;
import java.io.UnsupportedEncodingException;
import jakarta.mail.MessagingException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

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

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này"));

        // Tạo mật khẩu tạm ngẫu nhiên đủ mạnh (VD: Temp@ + 8 ký tự UUID ngẫu nhiên)
        String uuidPart = UUID.randomUUID().toString().substring(0, 8);
        String tempPassword = "Tmp@" + uuidPart.toUpperCase();

        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setIsTemporaryPassword(true);
        userRepository.save(user);

        try {
            emailService.sendForgotPasswordEmail(email, tempPassword);
        } catch (MessagingException | UnsupportedEncodingException e) {
            System.err.println("Lỗi khi gửi email (cảnh báo): " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Lỗi chung khi gửi email: " + e.getMessage());
        }
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 8 ký tự");
        }
        if (!request.getNewPassword().matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$")) {
            throw new RuntimeException("Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setIsTemporaryPassword(false);
        userRepository.save(user);
    }
}