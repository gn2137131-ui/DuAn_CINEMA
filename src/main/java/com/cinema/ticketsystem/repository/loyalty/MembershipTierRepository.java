package com.cinema.ticketsystem.repository.loyalty;

import com.cinema.ticketsystem.entity.loyalty.MembershipTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembershipTierRepository extends JpaRepository<MembershipTier, Long> {
    List<MembershipTier> findAllByOrderByMinPointsAsc();
}
