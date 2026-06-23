package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.MovieComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MovieCommentRepository extends JpaRepository<MovieComment, Long> {
    
    // Lấy các bình luận gốc (không có parent) của một phim, sắp xếp mới nhất lên đầu
    @Query("SELECT c FROM MovieComment c WHERE c.movie.id = :movieId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<MovieComment> findRootCommentsByMovieId(@Param("movieId") Long movieId);
}
