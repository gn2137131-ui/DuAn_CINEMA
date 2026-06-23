package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.CinemaSettings;
import com.cinema.ticketsystem.service.cinema.CinemaSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class CinemaSettingsController {

    @Autowired
    private CinemaSettingsService settingsService;

    // GET /api/settings - Lấy cài đặt hiện tại (public để frontend dùng được)
    @GetMapping
    public ResponseEntity<CinemaSettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    // PUT /api/settings - Admin lưu cài đặt mới
    @PutMapping
    public ResponseEntity<CinemaSettings> saveSettings(@RequestBody CinemaSettings settings) {
        return ResponseEntity.ok(settingsService.saveSettings(settings));
    }
}
