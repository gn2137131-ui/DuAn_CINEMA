package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.service.cinema.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import com.cinema.ticketsystem.repository.cinema.MovieRepository;

@RestController
@RequestMapping("/api/movies")
// Fix #3: xóa @CrossOrigin("*") — CORS quản lý tập trung ở SecurityConfig
public class MovieController {

    @Autowired
    private MovieService movieService;

    @Autowired
    private MovieRepository movieRepository;

    // 1.2. Lấy danh sách phim đang chiếu
    @GetMapping("/now-showing")
    @org.springframework.cache.annotation.Cacheable("movies")
    public ResponseEntity<List<Movie>> getNowShowingMovies() {
        LocalDate now = LocalDate.now();
        return ResponseEntity.ok(movieRepository.findByReleaseDateLessThanEqualAndEndDateGreaterThanEqual(now, now));
    }

    // 1.3. Lấy danh sách phim mới ra mắt
    @GetMapping("/new-releases")
    @org.springframework.cache.annotation.Cacheable("movies")
    public ResponseEntity<List<Movie>> getNewReleases(@RequestParam(defaultValue = "7") int days) {
        LocalDate now = LocalDate.now();
        LocalDate from = now.minusDays(days);
        return ResponseEntity.ok(movieRepository.findByReleaseDateBetween(from, now));
    }

    // 1. Lấy tất cả danh sách phim
    // Endpoint: GET /api/movies
    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies() {
        return ResponseEntity.ok(movieService.getAllMovies());
    }

    // 1.1. Lấy chi tiết phim theo ID
    // Endpoint: GET /api/movies/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable("id") Long id) {
        return movieService.getMovieById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. Thêm phim mới (Xử lý dữ liệu đa phần Multipart từ AddMovie.jsx)
    // Endpoint: POST /api/movies/add
    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addMovie(
            @RequestPart("movie") Movie movie,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "bannerFile", required = false) MultipartFile bannerFile) {
        try {
            Movie savedMovie = movieService.addMovie(movie, file, bannerFile);
            return ResponseEntity.ok(savedMovie);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi trong quá trình upload ảnh poster lên Cloudinary: " + e.getMessage());
        }
    }

    // 3. Sửa phim (Hỗ trợ upload đè file ảnh mới hoặc giữ nguyên ảnh cũ từ EditMovie.jsx)
    // Endpoint: PUT /api/movies/edit/{id}
    @PutMapping(value = "/edit/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMovie(
            @PathVariable("id") Long id,
            @RequestPart("movie") Movie movieDetails,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "bannerFile", required = false) MultipartFile bannerFile) {
        try {
            Movie updatedMovie = movieService.updateMovie(id, movieDetails, file, bannerFile);
            return ResponseEntity.ok(updatedMovie);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tải dữ liệu hình ảnh mới lên hệ thống Cloudinary: " + e.getMessage());
        }
    }

    // 4. Xóa phim (Tự động xóa sạch showtimes nhờ CascadeType trong Entity của bạn)
    // Endpoint: DELETE /api/movies/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMovie(@PathVariable("id") Long id) {
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.ok("Xóa phim và các dữ liệu suất chiếu liên quan thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Giữ khối catch an toàn để bắt các lỗi nghiêm trọng về khóa ngoại (ví dụ: phim đã có khách mua vé lịch sử)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Không thể xóa phim này do ràng buộc dữ liệu lịch sử hóa đơn: " + e.getMessage());
        }
    }

    // 5. Bật/tắt trạng thái HOT của phim
    // Endpoint: PUT /api/movies/{id}/hot
    @PutMapping("/{id}/hot")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleHotStatus(@PathVariable("id") Long id) {
        try {
            movieService.toggleHotStatus(id);
            return ResponseEntity.ok().body(java.util.Collections.singletonMap("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}