package com.cinema.ticketsystem.service.cinema;

import com.cinema.ticketsystem.entity.cinema.CinemaSettings;
import com.cinema.ticketsystem.repository.cinema.CinemaSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CinemaSettingsService {

    @Autowired
    private CinemaSettingsRepository settingsRepository;

    // Lấy cài đặt hiện tại (hoặc tạo mặc định nếu chưa có)
    public CinemaSettings getSettings() {
        return settingsRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            CinemaSettings defaults = new CinemaSettings();
            defaults.setCinemaName("CineVerse");
            defaults.setEmail("support@cineverse.vn");
            defaults.setPhone("1900-1234");
            defaults.setAddress("123 Đường Nguyễn Huệ, Q1, TP.HCM");
            defaults.setDescription("Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam.");
            return settingsRepository.save(defaults);
        });
    }

    // Lưu/cập nhật cài đặt
    public CinemaSettings saveSettings(CinemaSettings incoming) {
        CinemaSettings settings = settingsRepository.findFirstByOrderByIdAsc()
                .orElse(new CinemaSettings());

        settings.setCinemaName(incoming.getCinemaName());
        settings.setEmail(incoming.getEmail());
        settings.setPhone(incoming.getPhone());
        settings.setAddress(incoming.getAddress());
        settings.setDescription(incoming.getDescription());
        settings.setBasePrice(incoming.getBasePrice());
        settings.setVipPrice(incoming.getVipPrice());
        settings.setStudentDiscount(incoming.getStudentDiscount());
        settings.setSeniorDiscount(incoming.getSeniorDiscount());

        return settingsRepository.save(settings);
    }
}
