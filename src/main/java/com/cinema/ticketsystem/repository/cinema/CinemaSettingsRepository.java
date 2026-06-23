package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.CinemaSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CinemaSettingsRepository extends JpaRepository<CinemaSettings, Long> {
    // Luôn chỉ có 1 bản ghi cài đặt duy nhất
    Optional<CinemaSettings> findFirstByOrderByIdAsc();
}
