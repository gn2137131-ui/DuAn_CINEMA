package com.cinema.ticketsystem.service.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.Key;
import com.cinema.ticketsystem.entity.user.User;
import java.util.Date;

@Service
public class JwtService {
    // Fix #2: đọc secret từ application.properties — không hardcode trong source code
    @Value("${jwt.secret}")
    private String secret;

    // Fix #13: TTL 2h thay vì 24h
    private static final long TOKEN_TTL_MS = 1000L * 60 * 60 * 2;

    // Sửa lại hàm này
    public String generateToken(User user) {
        java.util.Map<String, Object> claims = new java.util.HashMap<>();

        // Spring Security yêu cầu quyền phải có prefix ROLE_ để khớp với
        // hasRole('ADMIN')
        claims.put("role", "ROLE_" + user.getRole().name());

        return Jwts.builder()
                .setClaims(claims) // Đưa quyền vào đây
                .setSubject(user.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + TOKEN_TTL_MS))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    // Thêm vào JwtService.java các hàm sau:

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}