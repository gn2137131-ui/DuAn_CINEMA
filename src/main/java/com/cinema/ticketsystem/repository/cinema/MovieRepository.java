package com.cinema.ticketsystem.repository.cinema;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.ticketsystem.entity.cinema.Movie;

import java.time.LocalDate;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    //lay tat ca danh sach phim
    List<Movie> findAll();

    List<Movie> findByReleaseDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate now1, LocalDate now2);
    List<Movie> findByReleaseDateAfter(LocalDate now);
    List<Movie> findByReleaseDateBetween(LocalDate from, LocalDate to);
}