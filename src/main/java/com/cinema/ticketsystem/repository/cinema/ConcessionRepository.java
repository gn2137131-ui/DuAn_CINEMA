package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.Concession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcessionRepository extends JpaRepository<Concession, Long> {
    List<Concession> findByActiveTrue();
    List<Concession> findByCategoryAndActiveTrue(String category);
}
