package com.cinema.ticketsystem.controller.cinema;

import com.cinema.ticketsystem.entity.cinema.Movie;
import com.cinema.ticketsystem.entity.cinema.MovieComment;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.MovieCommentRepository;
import com.cinema.ticketsystem.repository.cinema.MovieRepository;
import com.cinema.ticketsystem.service.jwt.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class MovieCommentController {

    @Autowired
    private MovieCommentRepository commentRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private AuthService authService;

    // Helper method to format a single comment and its replies recursively
    private Map<String, Object> formatComment(MovieComment c) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", c.getId());
        item.put("content", c.getContent());
        item.put("createdAt", c.getCreatedAt());
        
        String userName = "Ẩn danh";
        if (c.getUser() != null) {
            userName = c.getUser().getFullName() != null ? c.getUser().getFullName() : c.getUser().getUsername();
        }
        item.put("userName", userName);
        
        List<Map<String, Object>> replies = new ArrayList<>();
        if (c.getReplies() != null && !c.getReplies().isEmpty()) {
            replies = c.getReplies().stream().map(this::formatComment).collect(Collectors.toList());
        }
        item.put("replies", replies);
        return item;
    }

    // 1. Get all root comments for a movie
    @GetMapping("/movie/{movieId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getCommentsByMovie(@PathVariable Long movieId) {
        List<MovieComment> rootComments = commentRepository.findRootCommentsByMovieId(movieId);
        List<Map<String, Object>> result = rootComments.stream()
                .map(this::formatComment)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // 2. Post a new root comment for a movie
    @PostMapping("/movie/{movieId}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addComment(
            @PathVariable Long movieId,
            @RequestBody Map<String, String> body) {
        try {
            User user = authService.getCurrentUser();
            String content = body.get("content");

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Nội dung bình luận không được để trống!");
            }

            Movie movie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phim!"));

            MovieComment comment = new MovieComment();
            comment.setUser(user);
            comment.setMovie(movie);
            comment.setContent(content.trim());
            comment.setCreatedAt(LocalDateTime.now());
            
            MovieComment savedComment = commentRepository.save(comment);
            
            return ResponseEntity.ok(formatComment(savedComment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Post a reply to an existing comment
    @PostMapping("/{commentId}/reply")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addReply(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body) {
        try {
            User user = authService.getCurrentUser();
            String content = body.get("content");

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Nội dung trả lời không được để trống!");
            }

            MovieComment parent = commentRepository.findById(commentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận gốc!"));

            MovieComment reply = new MovieComment();
            reply.setUser(user);
            reply.setMovie(parent.getMovie()); // inherits movie from parent
            reply.setContent(content.trim());
            reply.setCreatedAt(LocalDateTime.now());
            reply.setParent(parent);
            
            MovieComment savedReply = commentRepository.save(reply);
            
            return ResponseEntity.ok(formatComment(savedReply));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Delete a comment
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            User user = authService.getCurrentUser();
            MovieComment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận!"));
                    
            if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != com.cinema.ticketsystem.entity.user.Role.ADMIN) {
                return ResponseEntity.status(403).body("Bạn không có quyền xóa bình luận này!");
            }
            
            commentRepository.delete(comment);
            return ResponseEntity.ok(Map.of("message", "Đã xóa bình luận thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
