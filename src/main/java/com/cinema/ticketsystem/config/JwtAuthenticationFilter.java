package com.cinema.ticketsystem.config;

import com.cinema.ticketsystem.service.jwt.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;


@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 1. Kiểm tra xem Header có chứa "Bearer " hay không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Cắt chuỗi để lấy Token thực tế
        jwt = authHeader.substring(7);
        try {
            username = jwtService.extractUsername(jwt);
        } catch (JwtException | IllegalArgumentException ex) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Nếu Token hợp lệ, thiết lập danh tính vào hệ thống
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtService.isTokenValid(jwt, username)) {
                // 1. Lấy role từ token (đã có tiền tố ROLE_ từ JwtService)
                String role = jwtService.extractRole(jwt);

                // 2. Tạo danh sách quyền hạn chuẩn
                var authorities = java.util.List
                        .of(new org.springframework.security.core.authority.SimpleGrantedAuthority(role));

                // 3. Khởi tạo authToken
                // Lưu ý: Nên truyền username làm principal, null làm credentials, và
                // authorities
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        authorities);

                // 4. Thiết lập chi tiết request
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 5. Quan trọng: Lưu vào Context để các Filter sau (và Controller) biết bạn là
                // ai
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}