package com.cinema.ticketsystem.repository.loyalty;

import com.cinema.ticketsystem.entity.loyalty.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
}
