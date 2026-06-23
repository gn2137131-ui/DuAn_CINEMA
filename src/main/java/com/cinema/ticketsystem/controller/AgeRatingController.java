package com.cinema.ticketsystem.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Provides age‑rating label data for the frontend.
 * The labels are the Vietnamese descriptions for each age restriction code.
 */
@RestController
public class AgeRatingController {

    /**
     * Returns a map of age‑restriction codes to their display labels.
     * Example: {"P":"Mọi lứa tuổi", "T13":"Từ 13 tuổi", "T16":"Từ 16 tuổi", "T18":"Từ 18 tuổi"}
     */
    @GetMapping("/api/age-ratings")
    public Map<String, String> getAgeRatings() {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("P", "Mọi lứa tuổi");
        labels.put("T13", "Từ 13 tuổi");
        labels.put("T16", "Từ 16 tuổi");
        labels.put("T18", "Từ 18 tuổi");
        return labels;
    }
}
