package com.cinema.ticketsystem.service.cinema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cinema.ticketsystem.dto.ConcessionItemDTO;
import com.cinema.ticketsystem.dto.SePayWebhookRequest;
import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.BookingFood;
import com.cinema.ticketsystem.entity.cinema.Concession;
import com.cinema.ticketsystem.entity.cinema.DiscountCode;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.cinema.Ticket;
import com.cinema.ticketsystem.entity.user.User;
import com.cinema.ticketsystem.repository.cinema.BookingRepository;
import com.cinema.ticketsystem.repository.cinema.ConcessionRepository;
import com.cinema.ticketsystem.repository.cinema.DiscountCodeRepository;
import com.cinema.ticketsystem.repository.cinema.ShowtimeSeatRepository;
import com.cinema.ticketsystem.repository.user.UserRepository;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final ConcessionRepository concessionRepository;
    private final ShowtimeService showtimeService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @Transactional
    public Booking createBooking(User user, List<Long> showtimeSeatIds, String discountType, String discountCode,
            List<ConcessionItemDTO> bookingFoodRequests) {

        List<Booking> pendingBookings = bookingRepository.findByUserAndPaymentStatus(user, "PENDING");
        for (Booking b : pendingBookings) {
            cancelBooking(b.getId());
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBookingTime(LocalDateTime.now());
        booking.setPaymentStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;
        List<Ticket> tickets = new ArrayList<>();
        List<BookingFood> bookingFoods = new ArrayList<>();

        String effectiveDiscountType = (discountCode != null && !discountCode.isBlank()) ? null : discountType;

        for (Long showtimeSeatId : showtimeSeatIds) {
            // Dùng PESSIMISTIC_WRITE lock để đảm bảo chỉ 1 transaction được xử lý ghế này cùng lúc
            ShowtimeSeat showtimeSeat = showtimeSeatRepository.findByIdWithLock(showtimeSeatId)
                    .orElseThrow(() -> new RuntimeException("ID ghế " + showtimeSeatId + " không tồn tại!"));

            // ✅ FIX: Kiểm tra cả trạng thái BOOKED (2) và HOLDING (3)
            if (showtimeSeat.getStatus() == ShowtimeSeat.STATUS_BOOKED) {
                throw new RuntimeException("Ghế đã được bán!");
            }

            if (showtimeSeat.getStatus() == ShowtimeSeat.STATUS_HOLDING) {
                // Nếu đang HOLDING nhưng không phải của user này → từ chối
                if (!user.getId().equals(showtimeSeat.getHoldingUserId())) {
                    String seatName = showtimeSeat.getSeat() != null ? showtimeSeat.getSeat().getSeatNumber() : ("ID " + showtimeSeatId);
                    throw new RuntimeException("Ghế " + seatName + " đang được người khác giữ, vui lòng chọn ghế khác!");
                }
                // Nếu là của user này → cho phép tiếp tục (ghế đã hold đúng của họ)
            }

            double ticketPrice = showtimeService.calculateFinalTicketPrice(showtimeSeat.getShowtime(),
                    showtimeSeat.getSeat(), effectiveDiscountType);
            total = total.add(BigDecimal.valueOf(ticketPrice));

            Ticket ticket = new Ticket();
            ticket.setBooking(booking);
            ticket.setShowtimeSeat(showtimeSeat);
            ticket.setPrice(ticketPrice);
            ticket.setTicketCode(UUID.randomUUID().toString());
            ticket.setStatus("ACTIVE");
            tickets.add(ticket);

            showtimeSeat.setStatus(ShowtimeSeat.STATUS_HOLDING);
            showtimeSeat.setHoldingUserId(user.getId());
            showtimeSeatRepository.save(showtimeSeat);
        }

        // Xử lý đồ ăn kèm
        if (bookingFoodRequests != null) {
            for (ConcessionItemDTO foodRequest : bookingFoodRequests) {
                Concession concession = concessionRepository.findById(foodRequest.getConcessionId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

                BookingFood bookingFood = new BookingFood();
                bookingFood.setBooking(booking);
                bookingFood.setConcession(concession);
                bookingFood.setQuantity(foodRequest.getQuantity() <= 0 ? 1 : foodRequest.getQuantity());
                bookingFood.setPriceAtBooking(BigDecimal.valueOf(concession.getPrice()));
                bookingFoods.add(bookingFood);
                total = total
                        .add(bookingFood.getPriceAtBooking().multiply(BigDecimal.valueOf(bookingFood.getQuantity())));
            }
        }

        // Xử lý mã giảm giá
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (discountCode != null && !discountCode.isBlank()) {
            DiscountCode code = discountCodeRepository.findByCodeIgnoreCaseAndActiveTrue(discountCode)
                    .orElseThrow(() -> new RuntimeException("Mã không hợp lệ"));

            if (code.getExpirationDate() != null && code.getExpirationDate().isBefore(java.time.LocalDate.now())) {
                throw new RuntimeException("Mã giảm giá đã hết hạn");
            }
            if (code.getMaxUsage() != null && code.getUsedCount() >= code.getMaxUsage()) {
                throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
            }
            if (code.getMinOrderValue() != null && total.compareTo(BigDecimal.valueOf(code.getMinOrderValue())) < 0) {
                throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu (" + code.getMinOrderValue() + "đ) để áp dụng mã này");
            }
            if (code.getApplicableMovieId() != null) {
                boolean isApplicable = tickets.stream().allMatch(t ->
                    t.getShowtimeSeat().getShowtime().getMovie().getId().equals(code.getApplicableMovieId())
                );
                if (!isApplicable) {
                    throw new RuntimeException("Mã giảm giá này không áp dụng cho bộ phim bạn chọn");
                }
            }

            if ("PERCENT".equalsIgnoreCase(code.getType()) || "PERCENTAGE".equalsIgnoreCase(code.getType())) {
                discountAmount = total.multiply(BigDecimal.valueOf(code.getValue()).divide(BigDecimal.valueOf(100), 10, java.math.RoundingMode.HALF_UP));
            } else {
                discountAmount = BigDecimal.valueOf(code.getValue());
            }
            code.setUsedCount(code.getUsedCount() + 1);
            discountCodeRepository.save(code);
            booking.setDiscountCode(code.getCode());
        }

        booking.setDiscountAmount(discountAmount);
        booking.setTickets(tickets);
        booking.setBookingFoods(bookingFoods);

        // Làm tròn số tiền về phần nguyên để tránh lệch số thập phân giữa QR Code và Webhook SePay
        BigDecimal finalPrice = total.subtract(discountAmount).max(BigDecimal.ZERO);
        booking.setTotalPrice(finalPrice.setScale(0, java.math.RoundingMode.HALF_UP));

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại!"));

        booking.setPaymentStatus("PAID");
        booking.setPaymentTime(LocalDateTime.now());

        for (Ticket ticket : booking.getTickets()) {
            ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
            showtimeSeat.setStatus(ShowtimeSeat.STATUS_BOOKED);
            showtimeSeat.setHoldingUserId(null); // Xóa thông tin giữ ghế sau khi thanh toán xong
            showtimeSeat.setHoldTimestamp(null);
            showtimeSeatRepository.save(showtimeSeat);
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Bắn sự kiện qua WebSocket cho kênh Admin
        try {
            messagingTemplate.convertAndSend("/topic/admin/dashboard",
                Map.of("type", "NEW_BOOKING", "bookingId", savedBooking.getId(), "amount", savedBooking.getTotalPrice())
            );
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo WebSocket: " + e.getMessage());
        }

        return savedBooking;
    }

    @Transactional
    public String cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));

        if ("CANCELLED".equals(booking.getPaymentStatus())) {
            throw new RuntimeException("Đơn hàng đã bị hủy trước đó!");
        }

        boolean wasPaid = "PAID".equals(booking.getPaymentStatus()) || "PRINTED".equals(booking.getPaymentStatus());

        // Kiểm tra deadline (chỉ cho phép hủy trước 2 tiếng nếu đã thanh toán)
        if (wasPaid && booking.getTickets() != null && !booking.getTickets().isEmpty()) {
            Ticket firstTicket = booking.getTickets().get(0);
            if (firstTicket.getShowtimeSeat() != null && firstTicket.getShowtimeSeat().getShowtime() != null) {
                LocalDateTime showStart = LocalDateTime.of(
                        firstTicket.getShowtimeSeat().getShowtime().getShowDate(),
                        firstTicket.getShowtimeSeat().getShowtime().getStartTime()
                );
                if (LocalDateTime.now().plusHours(2).isAfter(showStart)) {
                    throw new RuntimeException("Không thể hủy vé vì chỉ còn ít hơn 2 tiếng đến giờ chiếu!");
                }
            }
        }

        booking.setPaymentStatus("CANCELLED");

        // Hủy từng vé và giải phóng ghế
        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                ticket.setStatus("CANCELLED");
                ShowtimeSeat showtimeSeat = ticket.getShowtimeSeat();
                if (showtimeSeat != null) {
                    showtimeSeat.setStatus(ShowtimeSeat.STATUS_AVAILABLE);
                    showtimeSeat.setHoldTimestamp(null);
                    showtimeSeat.setHoldingUserId(null);
                    showtimeSeatRepository.save(showtimeSeat);
                }
            }
        }

        // Hoàn mã giảm giá
        if (booking.getDiscountCode() != null && !booking.getDiscountCode().isBlank()) {
            discountCodeRepository.findByCodeIgnoreCaseAndActiveTrue(booking.getDiscountCode())
                .ifPresent(code -> {
                    if (code.getUsedCount() != null && code.getUsedCount() > 0) {
                        code.setUsedCount(code.getUsedCount() - 1);
                        discountCodeRepository.save(code);
                    }
                });
        }

        // ✅ FIX: Trừ lại điểm Loyalty nếu đơn đã được thanh toán (PAID/PRINTED)
        if (wasPaid && booking.getUser() != null) {
            User user = booking.getUser();
            // Mỗi 10.000đ = 1 điểm (phải khớp với cách cộng điểm khi PAID)
            int pointsToDeduct = booking.getTotalPrice().divide(BigDecimal.valueOf(10000), java.math.RoundingMode.DOWN).intValue();
            if (pointsToDeduct > 0 && user.getLoyaltyPoints() != null) {
                int newPoints = Math.max(0, user.getLoyaltyPoints() - pointsToDeduct);
                user.setLoyaltyPoints(newPoints);
                userRepository.save(user);
                System.out.println("Đã trừ " + pointsToDeduct + " điểm loyalty của user " + user.getUsername() + " khi hủy vé.");
            }
        }

        bookingRepository.save(booking);
        return "Đã hủy vé thành công!";
    }

    @Transactional
    public Long handleWebhookPayment(SePayWebhookRequest payload) {
        String codeFromSePay = payload.getCode();
        BigDecimal amountPaid = BigDecimal.valueOf(payload.getTransferAmount());
        String referenceCode = payload.getReferenceCode();

        // 1. Bộ lọc Demo cho mã SEPAYTEST
        if ("SEPAYTEST".equals(codeFromSePay)) {
            System.out.println(">>> MÔ PHỎNG TEST, BỎ QUA KIỂM TRA DB.");
            return 32L; // Trả về ID giả lập để demo SSE
        }

        // 2. Tìm đơn hàng — Fix #5: exact match thay vì prefix match
        Booking booking = bookingRepository.findByOrderCode(codeFromSePay)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + codeFromSePay));

        // 3. Idempotent: đã PAID rồi → bỏ qua, tránh xử lý 2 lần khi SePay retry
        if ("PAID".equals(booking.getPaymentStatus()))
            return booking.getId();

        // 4. Không cho phép confirm booking đã bị hủy (tránh vé ảo khi webhook đến muộn)
        if ("CANCELLED".equals(booking.getPaymentStatus()))
            throw new RuntimeException("Đơn hàng đã bị hủy, không thể xác nhận thanh toán.");

        // 5. Kiểm tra số tiền
        if (amountPaid.compareTo(booking.getTotalPrice()) < 0) {
            throw new RuntimeException("Số tiền thanh toán thiếu!");
        }

        // 6. Xác nhận thanh toán
        confirmBooking(booking.getId());
        booking.setTransactionReference(referenceCode);
        bookingRepository.save(booking);

        System.out.println("Gạch nợ thành công cho đơn: " + booking.getId());
        return booking.getId();
    }
}