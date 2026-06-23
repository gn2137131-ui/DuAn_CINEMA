package com.cinema.ticketsystem.controller.cinema;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.ticketsystem.dto.DashboardStatsResponse;
import com.cinema.ticketsystem.dto.RevenueStatsResponse;
import com.cinema.ticketsystem.service.cinema.StatService;

@RestController
@RequestMapping("/api/admin/stats")
@CrossOrigin(origins = "*")
public class StatController {

    @Autowired
    private StatService statService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(statService.getDashboardStats());
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueStatsResponse> getRevenueStats() {
        return ResponseEntity.ok(statService.getRevenueStats());
    }
}
