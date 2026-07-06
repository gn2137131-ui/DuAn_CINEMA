package com.cinema.ticketsystem.service.cinema;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

// Dịch vụ này sẽ chạy định kỳ để giải phóng các ghế đã giữ nhưng không được thanh toán sau 10 phút

@Service
@RequiredArgsConstructor
public class SeatCleanupService {

    private final ShowtimeSeatRepository showtimeSeatRepository;

    // Chạy mỗi 60 giây (60000 ms)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredSeats() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(10);
        
        // Tìm các ghế đang ở trạng thái Holding (3) và đã giữ quá 10 phút
        List<ShowtimeSeat> expiredSeats = showtimeSeatRepository
            .findByStatusAndHoldTimestampBefore(ShowtimeSeat.STATUS_HOLDING, threshold);

        if (!expiredSeats.isEmpty()) {
            for (ShowtimeSeat seat : expiredSeats) {
                seat.setStatus(ShowtimeSeat.STATUS_AVAILABLE); // Nhả về trạng thái Available
                seat.setHoldTimestamp(null); // Xóa dấu thời gian
            }
            showtimeSeatRepository.saveAll(expiredSeats);
            System.out.println("Đã giải phóng " + expiredSeats.size() + " ghế hết hạn.");
        }
    }
}