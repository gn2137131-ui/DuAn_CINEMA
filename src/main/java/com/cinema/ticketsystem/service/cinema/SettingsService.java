package com.cinema.ticketsystem.service.cinema;

import com.cinema.ticketsystem.entity.cinema.Settings;
import com.cinema.ticketsystem.repository.cinema.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepository;

    // Lấy cấu hình chính (ID = 1)
    public Settings getMainSettings() {
        Optional<Settings> settings = settingsRepository.findById(1L);
        if (settings.isPresent()) {
            return settings.get();
        } else {
            // Nếu chưa có, tạo cấu hình mặc định
            Settings defaultSettings = new Settings();
            defaultSettings.setCinemaName("Cinema Galaxy");
            defaultSettings.setEmail("contact@cinemagalaxy.com");
            defaultSettings.setPhoneNumber("1900 xxxx");
            defaultSettings.setAddress("123 Đường ABC, Quận XYZ, TP.HCM");
            defaultSettings.setIntroduction("Hệ thống rạp hiện đại nhất...");
            defaultSettings.setStudentDiscount(0.1); // 10%
            defaultSettings.setElderDiscount(0.15); // 15%
            defaultSettings.setChildDiscount(0.2); // 20%
            defaultSettings.setWeekendSurcharge(0.1); // 10%
            defaultSettings.setPeakHourSurcharge(0.2); // 20%
            defaultSettings.setVipSeatSurcharge(20000.0);
            return settingsRepository.save(defaultSettings);
        }
    }

    // Cập nhật cấu hình
    public Settings updateSettings(Settings settings) {
        return settingsRepository.save(settings);
    }

    // Lấy tất cả cấu hình
    public java.util.List<Settings> getAllSettings() {
        return settingsRepository.findAll();
    }
}
