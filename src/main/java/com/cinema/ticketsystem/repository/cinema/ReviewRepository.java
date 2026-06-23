package com.cinema.ticketsystem.repository.cinema;

import com.cinema.ticketsystem.entity.cinema.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId);
    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId")
    Double findAverageRatingByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.movie.id = :movieId")
    Long countByMovieId(@Param("movieId") Long movieId);
}
