package com.cinema.ticketsystem.entity.cinema;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "combos")
@Data
public class Combo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Double price;
    private Boolean active = true;

    // --- NEW RELATIONS ---

    // Fix #9: LAZY thay vì EAGER mặc định
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "popcorn_id")
    private Concession popcorn;

    private Integer popcornCount;

    // Fix #9: LAZY thay vì EAGER mặc định
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drink_id")
    private Concession drink;

    private Integer drinkCount;
}