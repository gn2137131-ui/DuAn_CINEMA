package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, Long> {
    // Mặc định JpaRepository đã cung cấp các phương thức CRUD
}
