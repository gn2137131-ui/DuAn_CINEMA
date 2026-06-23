package com.cinema.ticketsystem.repository.loyalty;

import com.cinema.ticketsystem.entity.loyalty.RewardPointHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RewardPointHistoryRepository extends JpaRepository<RewardPointHistory, Long> {
    List<RewardPointHistory> findByUserIdOrderByDateDesc(Long userId);
}
