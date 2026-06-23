package com.cinema.ticketsystem.repository.cinema;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cinema.ticketsystem.entity.cinema.Showtime;
import com.cinema.ticketsystem.entity.cinema.roles.ShowtimeStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

        // Tìm các suất chiếu của một phòng mà thời gian diễn ra nằm trong khoảng dự
        // kiến
        // Kiểm tra: showDate giống AND (startTime < endTime_compare AND endTime >
        // startTime_compare)
        @Query("SELECT s FROM Showtime s WHERE s.room.id = :roomId " +
                        "AND s.showDate = :showDate " +
                        "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
        List<Showtime> findOverlappingShowtimes(Long roomId, LocalDate showDate, LocalTime startTime,
                        LocalTime endTime);

        List<Showtime> findByMovieId(Long movieId);

        // Tìm đến khoảng dòng 31 trong file của bạn và thêm @EntityGraph vào:

        @EntityGraph(attributePaths = { "movie", "room" })
        List<Showtime> findByShowDate(LocalDate showDate);

        @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.showDate = :showDate")
        List<Showtime> findByMovieIdAndDate(Long movieId, LocalDate showDate);

        List<Showtime> findByRoomIdAndShowDate(Long roomId, LocalDate showDate);

        List<Showtime> findByRoomIdAndShowDateOrderByStartTimeAsc(Long roomId, LocalDate showDate);

        List<Showtime> findByStatus(ShowtimeStatus status);

        List<Showtime> findByMovieIdAndStatus(Long movieId, ShowtimeStatus status);

        // Lấy suất chiếu theo ngày và trạng thái
        List<Showtime> findByShowDateAndStatus(LocalDate showDate, ShowtimeStatus status);

        // Lấy suất chiếu của một phim cụ thể trong một ngày cụ thể
        List<Showtime> findByMovieIdAndShowDateAndStatus(Long movieId, LocalDate showDate, ShowtimeStatus status);

        // Lấy suất chiếu của một phim cụ thể trong khoảng ngày (Tuần hiện tại)
        List<Showtime> findByShowDateOrderByStartTimeAsc(LocalDate showDate);

        // Lấy suất chiếu của một phim cụ thể trong một ngày cụ thể, sắp xếp theo giờ
        // bắt đầu
        List<Showtime> findByMovieIdAndShowDateOrderByStartTimeAsc(Long movieId, LocalDate showDate);

        // Lấy lịch chiếu của một phim cụ thể trong khoảng ngày (Tuần hiện tại)
        @Query("SELECT s FROM Showtime s WHERE (:movieId IS NULL OR s.movie.id = :movieId) " +
                        "AND s.showDate >= :startOfWeek AND s.showDate <= :endOfWeek " +
                        "AND s.status = 'ACTIVE'")
        List<Showtime> findShowtimesInWeek(@Param("movieId") Long movieId,
                        @Param("startOfWeek") LocalDate startOfWeek,
                        @Param("endOfWeek") LocalDate endOfWeek);

        List<Showtime> findByRoomIdAndShowDateAndStatusOrderByStartTimeAsc(Long roomId, LocalDate date,
                        ShowtimeStatus active);

}