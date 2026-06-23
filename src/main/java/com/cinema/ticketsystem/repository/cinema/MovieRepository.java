package com.cinema.ticketsystem.repository.cinema;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinema.ticketsystem.entity.cinema.Movie;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    //lay tat ca danh sach phim
    List<Movie> findAll();
}