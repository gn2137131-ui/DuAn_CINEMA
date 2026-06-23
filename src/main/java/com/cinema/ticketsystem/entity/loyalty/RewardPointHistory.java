package com.cinema.ticketsystem.entity.loyalty;

import com.cinema.ticketsystem.entity.user.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "reward_point_history")
@Data
public class RewardPointHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer points; // Positive for earning, negative for spending

    @Column(nullable = false)
    private String transactionType; // e.g., EARNED_FROM_PURCHASE, REDEEMED_FOR_DISCOUNT

    private String description;

    @Column(nullable = false)
    private LocalDateTime date;
}
