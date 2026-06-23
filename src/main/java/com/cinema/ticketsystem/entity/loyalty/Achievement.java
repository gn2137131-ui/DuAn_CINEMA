package com.cinema.ticketsystem.entity.loyalty;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "achievements")
@Data
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "First Blood", "Popcorn Lover"

    @Column(nullable = false)
    private String description;

    private String iconUrl;

    @Column(nullable = false)
    private Integer rewardPoints; // Points given when achieved
}
