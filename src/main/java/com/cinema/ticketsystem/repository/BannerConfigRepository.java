package com.cinema.ticketsystem.repository;

import com.cinema.ticketsystem.entity.BannerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerConfigRepository extends JpaRepository<BannerConfig, Long> {

    /** Lấy danh sách banner đã sắp xếp theo thứ tự hiển thị */
    List<BannerConfig> findAllByOrderByDisplayOrderAsc();
}
