package com.cinema.ticketsystem.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "banner_config")
@Data
public class BannerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID của phim được chọn vào banner */
    @Column(name = "movie_id", nullable = false)
    private Long movieId;

    /** Thứ tự hiển thị (0, 1, 2, ...) */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
