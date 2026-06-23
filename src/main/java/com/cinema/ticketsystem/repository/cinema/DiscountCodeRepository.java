package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {
    Optional<DiscountCode> findByCodeIgnoreCaseAndActiveTrue(String code);
    List<DiscountCode> findByActiveTrue();
}
