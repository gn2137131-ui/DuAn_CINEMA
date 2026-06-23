package com.cinema.ticketsystem.controller.cinema;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.entity.cinema.Review;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;
import com.cinema.ticketsystem.repository.cinema.ReviewRepository;
import com.cinema.ticketsystem.service.jwt.AuthService;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AuthService authService;

    // Lấy danh sách đánh giá theo phim
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<?> getReviewsByMovie(@PathVariable Long movieId) {
        List<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId);

        List<Map<String, Object>> result = reviews.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("rating", r.getRating());
            item.put("comment", r.getComment());
            item.put("createdAt", r.getCreatedAt());
            item.put("userName", r.getUser() != null ? (r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getUsername()) : "Ẩn danh");
            return item;
        }).collect(Collectors.toList());

        Double avg = reviewRepository.findAverageRatingByMovieId(movieId);
        Long count = reviewRepository.countByMovieId(movieId);

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", result);
        response.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        response.put("totalReviews", count);

        return ResponseEntity.ok(response);
    }

    // Kiểm tra người dùng đã đánh giá chưa
    @GetMapping("/movie/{movieId}/my-review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyReview(@PathVariable Long movieId) {
        User user = authService.getCurrentUser();
        return reviewRepository.findByUserIdAndMovieId(user.getId(), movieId)
                .map(r -> {
                    Map<String, Object> res = new HashMap<>();
                    res.put("id", r.getId());
                    res.put("rating", r.getRating());
                    res.put("comment", r.getComment());
                    res.put("createdAt", r.getCreatedAt());
                    return ResponseEntity.ok((Object) res);
                })
                .orElse(ResponseEntity.ok((Object) null));
    }

    // Tạo hoặc cập nhật đánh giá phim (chỉ khách hàng đã xem phim)
    @PostMapping("/movie/{movieId}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> submitReview(
            @PathVariable Long movieId,
            @RequestBody Map<String, Object> body) {
        try {
            User user = authService.getCurrentUser();

            // Kiểm tra xem người dùng đã xem phim chưa (đã có booking PAID/PRINTED của phim này)
            boolean hasSeen = bookingRepository.findByUserId(user.getId()).stream()
                    .filter(b -> "PAID".equals(b.getPaymentStatus()) || "PRINTED".equals(b.getPaymentStatus()))
                    .anyMatch(b -> b.getTickets().stream()
                            .anyMatch(t -> t.getShowtimeSeat() != null
                                    && t.getShowtimeSeat().getShowtime() != null
                                    && t.getShowtimeSeat().getShowtime().getMovie() != null
                                    && movieId.equals(t.getShowtimeSeat().getShowtime().getMovie().getId())));

            if (!hasSeen) {
                return ResponseEntity.badRequest().body("Bạn cần xem phim này trước khi đánh giá!");
            }

            Movie movie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phim!"));

            int rating = Integer.parseInt(String.valueOf(body.get("rating")));
            String comment = (String) body.getOrDefault("comment", "");

            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Điểm đánh giá phải từ 1 đến 5!");
            }

            // Nếu đã có review thì cập nhật, không tạo mới
            Review review = reviewRepository.findByUserIdAndMovieId(user.getId(), movieId)
                    .orElse(new Review());

            review.setUser(user);
            review.setMovie(movie);
            review.setRating(rating);
            review.setComment(comment);
            review.setCreatedAt(LocalDateTime.now());

            reviewRepository.save(review);

            // Cập nhật lại điểm đánh giá trung bình của phim
            Double avg = reviewRepository.findAverageRatingByMovieId(movieId);
            if (avg != null) {
                movie.setRating(String.format(java.util.Locale.US, "%.1f", avg));
            } else {
                movie.setRating("0");
            }
            movieRepository.save(movie);

            return ResponseEntity.ok(Map.of("message", "Đánh giá thành công!", "rating", rating));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xóa đánh giá (của mình)
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        User user = authService.getCurrentUser();
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá!"));
        if (!review.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Bạn không có quyền xóa đánh giá này!");
        }
        Movie movie = review.getMovie();
        reviewRepository.delete(review);

        // Cập nhật lại điểm đánh giá trung bình của phim
        Double avg = reviewRepository.findAverageRatingByMovieId(movie.getId());
        if (avg != null) {
            movie.setRating(String.format(java.util.Locale.US, "%.1f", avg));
        } else {
            movie.setRating("0");
        }
        movieRepository.save(movie);

        return ResponseEntity.ok(Map.of("message", "Đã xóa đánh giá!"));
    }
}
