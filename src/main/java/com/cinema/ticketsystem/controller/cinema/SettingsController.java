package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Settings;
import com.cinema.ticketsystem.service.cinema.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/old-settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    // Lấy cấu hình chính của rạp
    @GetMapping("/main")
    public ResponseEntity<?> getMainSettings() {
        try {
            Settings settings = settingsService.getMainSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi lấy cấu hình: " + e.getMessage());
        }
    }

    // Lấy tất cả cấu hình (chỉ admin)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllSettings() {
        try {
            List<Settings> settingsList = settingsService.getAllSettings();
            return ResponseEntity.ok(settingsList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi lấy danh sách cấu hình: " + e.getMessage());
        }
    }

    // Cập nhật cấu hình chính (chỉ admin)
    @PutMapping("/main")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMainSettings(@RequestBody Settings settings) {
        try {
            // Đảm bảo ID là 1 (cấu hình chính)
            settings.setId(1L);
            Settings updated = settingsService.updateSettings(settings);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật cấu hình: " + e.getMessage());
        }
    }
}
