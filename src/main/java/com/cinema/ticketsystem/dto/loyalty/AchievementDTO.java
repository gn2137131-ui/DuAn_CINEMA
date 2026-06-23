package com.cinema.ticketsystem.dto.loyalty;

import lombok.Data;

@Data
public class AchievementDTO {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private Integer rewardPoints;
}
