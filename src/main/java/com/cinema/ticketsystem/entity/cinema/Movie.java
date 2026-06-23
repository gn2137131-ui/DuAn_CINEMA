package com.cinema.ticketsystem.entity.cinema;

import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.format.annotation.DateTimeFormat;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "movies")
@Data
// 🌟 THÊM DÒNG NÀY: Để Jackson bỏ qua các thuộc tính quản lý Lazy Loading của Hibernate
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title; 

    @Column(name = "description", columnDefinition = "TEXT") 
    private String description;

    private int duration; 
    private String genre; 
    
    @Column(name = "language")
    private String language;

    
    @Column(name = "rating")
    private String rating; 

    @JsonProperty("age_restriction")
    @Column(name = "age_restriction")
    private String ageRestriction; 

    @JsonProperty("release_date")
    @Column(name = "release_date")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
    @JsonFormat(pattern = "yyyy-MM-dd") 
    private LocalDate releaseDate; 

    @Column(name = "poster_url")
    private String posterUrl; 

    @Column(name = "trailer_url")
    private String trailerUrl; 

    private String director; 

    @Column(columnDefinition = "TEXT")
    private String cast; 

    @JsonProperty("production_company")
    private String productionCompany;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // 🌟 SỬA THÊM Ở ĐÂY (Cho chắc chắn): Gộp chung cả việc chặn vòng lặp lẫn chặn proxy
    @JsonIgnoreProperties({"movie", "hibernateLazyInitializer", "handler"}) 
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<Showtime> showtimes;
}