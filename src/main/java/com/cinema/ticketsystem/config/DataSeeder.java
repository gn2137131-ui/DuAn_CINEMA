package com.cinema.ticketsystem.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import java.sql.Connection;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Check if user table has any data
                Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user", Integer.class);
                if (count != null && count == 0) {
                    System.out.println("====================================================");
                    System.out.println("DATABASE IS EMPTY. IMPORTING DATA FROM backup.sql...");
                    System.out.println("====================================================");
                    try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                        ScriptUtils.executeSqlScript(conn, new ClassPathResource("backup.sql"));
                        System.out.println("====================================================");
                        System.out.println("IMPORT SUCCESSFUL!");
                        System.out.println("====================================================");
                    }
                } else {
                    System.out.println("Database already contains data (" + count + " users). Skipping import.");
                }
            } catch (Exception e) {
                System.out.println("Could not run data seeder or database is not empty. Reason: " + e.getMessage());
            }
        };
    }
}
