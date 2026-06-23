package com.cinema.ticketsystem.dto.loyalty;

import lombok.Data;

@Data
public class MembershipTierDTO {
    private Long id;
    private String name;
    private Integer minPoints;
    private Double discountPercentage;
}
