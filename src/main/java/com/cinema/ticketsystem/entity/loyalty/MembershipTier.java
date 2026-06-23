package com.cinema.ticketsystem.entity.loyalty;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "membership_tiers")
@Data
public class MembershipTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., Bronze, Silver, Gold, Diamond

    @Column(nullable = false)
    private Integer minPoints;

    @Column(nullable = false)
    private Double discountPercentage; // e.g., 5.0 for 5%
}
