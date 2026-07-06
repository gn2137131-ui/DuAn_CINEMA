package com.cinema.ticketsystem.config;

import com.cinema.ticketsystem.entity.user.Role;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner createAdminIfNotExists(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            try {
                if (userRepository.findByEmail("ngiau4410@gmail.com").isEmpty() && userRepository.findByUsername("admin").isEmpty()) {
                    System.out.println("====================================================");
                    System.out.println("DATABASE IS EMPTY. CREATING DEFAULT ADMIN ACCOUNT...");
                    User admin = new User();
                    admin.setUsername("admin");
                    admin.setEmail("ngiau4410@gmail.com");
                    admin.setPassword(passwordEncoder.encode("Ngiau@123")); // Password matching their screenshot
                    admin.setPhone("0123456789");
                    admin.setFullName("Admin System");
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);
                    System.out.println("ADMIN CREATED: admin / Ngiau@123");
                    System.out.println("====================================================");
                }
            } catch (Exception e) {
                System.out.println("Could not create admin: " + e.getMessage());
            }
        };
    }
}
