package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.Combo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComboRepository extends JpaRepository<Combo, Long> {
    List<Combo> findByActiveTrue();
}
