package com.cinema.ticketsystem.service.cinema;

import com.cinema.ticketsystem.entity.cinema.Booking;
import com.cinema.ticketsystem.entity.cinema.BookingFood;
import com.cinema.ticketsystem.entity.cinema.Ticket;
import com.cinema.ticketsystem.entity.cinema.Seat;
import com.cinema.ticketsystem.entity.cinema.ShowtimeSeat;
import com.cinema.ticketsystem.entity.cinema.Showtime;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.UnsupportedEncodingException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    /**
     * Gửi email xác nhận vé điện tử cho khách hàng
     */
    @org.springframework.scheduling.annotation.Async
    public void sendBookingConfirmationEmail(Booking booking) throws MessagingException, UnsupportedEncodingException {
        String toEmail = booking.getUser() != null ? booking.getUser().getEmail() : null;
        if (toEmail == null || toEmail.isBlank()) {
            throw new RuntimeException("Không tìm thấy email của khách hàng!");
        }

        String customerName = booking.getUser().getFullName() != null
                ? booking.getUser().getFullName() : "Quý khách";

        // Lấy thông tin phim & suất chiếu từ vé đầu tiên
        Ticket firstTicket = booking.getTickets().isEmpty() ? null : booking.getTickets().get(0);
        ShowtimeSeat firstShowtimeSeat = firstTicket != null ? firstTicket.getShowtimeSeat() : null;
        Showtime showtime = firstShowtimeSeat != null ? firstShowtimeSeat.getShowtime() : null;

        String movieTitle = showtime != null && showtime.getMovie() != null
                ? showtime.getMovie().getTitle() : "N/A";
        String moviePoster = showtime != null && showtime.getMovie() != null
                ? showtime.getMovie().getPosterUrl() : null;
        String roomName = showtime != null && showtime.getRoom() != null
                ? showtime.getRoom().getName() : "N/A";
        String format = showtime != null ? (showtime.getFormat() != null ? showtime.getFormat() : "2D") : "N/A";
        String showDate = showtime != null && showtime.getShowDate() != null
                ? showtime.getShowDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A";
        String startTime = showtime != null && showtime.getStartTime() != null
                ? showtime.getStartTime().toString() : "N/A";

        // Danh sách ghế
        String seatsList = booking.getTickets().stream()
                .map(t -> {
                    ShowtimeSeat ss = t.getShowtimeSeat();
                    Seat seat = ss != null ? ss.getSeat() : null;
                    return seat != null ? seat.getSeatNumber() : "?";
                })
                .collect(Collectors.joining(", "));

        // Combo bắp nước
        StringBuilder comboHtml = new StringBuilder();
        if (booking.getBookingFoods() != null && !booking.getBookingFoods().isEmpty()) {
            comboHtml.append("<tr><td colspan=\"2\" style=\"padding: 12px 0 4px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;\">Combo Bắp Nước</td></tr>");
            for (BookingFood food : booking.getBookingFoods()) {
                String foodName = food.getConcession() != null ? food.getConcession().getName() : "Combo";
                BigDecimal price = food.getPriceAtBooking() != null ? food.getPriceAtBooking() : BigDecimal.ZERO;
                int qty = food.getQuantity();
                comboHtml.append(String.format(
                        "<tr><td style=\"padding: 4px 0; color: #374151;\">%s x%d</td><td style=\"text-align:right; color: #374151;\">%,.0fđ</td></tr>",
                        foodName, qty, price.multiply(BigDecimal.valueOf(qty)).doubleValue()
                ));
            }
        }

        String bookingCode = booking.getOrderCode() != null ? booking.getOrderCode() : String.valueOf(booking.getId());
        String totalStr = booking.getTotalPrice() != null
                ? String.format("%,.0f", booking.getTotalPrice().doubleValue()) : "0";
        String bookingTime = booking.getBookingTime() != null
                ? booking.getBookingTime().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy")) : "N/A";

        // Poster image block
        String posterBlock = (moviePoster != null && !moviePoster.isBlank())
                ? String.format("<img src=\"%s\" alt=\"%s\" style=\"width:100%%;max-height:300px;object-fit:cover;border-radius:12px 12px 0 0;\"/>", moviePoster, movieTitle)
                : "<div style=\"height:8px;background:linear-gradient(90deg,#dc2626,#f97316,#fbbf24);border-radius:12px 12px 0 0;\"></div>";

        String htmlBody = buildEmailHtml(
                customerName, bookingCode, movieTitle, posterBlock,
                roomName, format, showDate, startTime,
                seatsList, comboHtml.toString(), totalStr, bookingTime
        );

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(senderEmail, "CineVerse 🎬");
        helper.setTo(toEmail);
        helper.setSubject("🎟️ Xác nhận đặt vé - " + movieTitle + " | Mã: " + bookingCode);
        helper.setText(htmlBody, true);

        mailSender.send(message);
        System.out.println("✅ Đã gửi email xác nhận vé tới: " + toEmail);
    }

    private String buildEmailHtml(
            String customerName, String bookingCode, String movieTitle, String posterBlock,
            String roomName, String format, String showDate, String startTime,
            String seatsList, String comboHtml, String totalStr, String bookingTime) {

        return "<!DOCTYPE html>" +
                "<html lang=\"vi\"><head><meta charset=\"UTF-8\"/>" +
                "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"/>" +
                "<title>Vé Điện Tử CineVerse</title></head>" +
                "<body style=\"margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;\">" +

                // Wrapper
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f3f4f6;padding:32px 16px;\">" +
                "<tr><td align=\"center\">" +
                "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;\">" +

                // Header logo
                "<tr><td style=\"text-align:center;padding-bottom:24px;\">" +
                "<span style=\"font-size:28px;font-weight:800;color:#dc2626;letter-spacing:-1px;\">🎬 CineVerse</span>" +
                "</td></tr>" +

                // Card
                "<tr><td style=\"background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);\">" +

                // Poster / gradient bar
                "<table width=\"100%\"><tr><td>" + posterBlock + "</td></tr>" +

                // Gradient header
                "<tr><td style=\"background:linear-gradient(135deg,#dc2626 0%,#f97316 50%,#fbbf24 100%);padding:28px 32px;\">" +
                "<p style=\"margin:0 0 4px;color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;\">Mã Đặt Vé</p>" +
                "<p style=\"margin:0;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:3px;\">" + bookingCode + "</p>" +
                "</td></tr>" +

                // Greeting
                "<tr><td style=\"padding:28px 32px 0;\">" +
                "<p style=\"margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;\">Xin chào, " + customerName + "! 🎉</p>" +
                "<p style=\"margin:0;color:#6b7280;font-size:14px;line-height:1.6;\">Đặt vé của bạn đã được xác nhận thành công. Chúc bạn có buổi xem phim thật vui vẻ!</p>" +
                "</td></tr>" +

                // Divider
                "<tr><td style=\"padding:20px 32px;\"><hr style=\"border:none;border-top:1px solid #e5e7eb;\"/></td></tr>" +

                // Movie info table
                "<tr><td style=\"padding:0 32px;\">" +
                "<p style=\"margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;\">" + movieTitle + "</p>" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">" +
                "<tr>" +
                "<td style=\"width:50%;padding-bottom:14px;\">" +
                "<p style=\"margin:0 0 2px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;\">Rạp</p>" +
                "<p style=\"margin:0;color:#111827;font-size:15px;font-weight:600;\">" + roomName + "</p>" +
                "</td>" +
                "<td style=\"width:50%;padding-bottom:14px;\">" +
                "<p style=\"margin:0 0 2px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;\">Định dạng</p>" +
                "<p style=\"margin:0;color:#111827;font-size:15px;font-weight:600;\">" + format + "</p>" +
                "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding-bottom:14px;\">" +
                "<p style=\"margin:0 0 2px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;\">Ngày chiếu</p>" +
                "<p style=\"margin:0;color:#111827;font-size:15px;font-weight:600;\">" + showDate + "</p>" +
                "</td>" +
                "<td style=\"padding-bottom:14px;\">" +
                "<p style=\"margin:0 0 2px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;\">Giờ chiếu</p>" +
                "<p style=\"margin:0;color:#111827;font-size:15px;font-weight:600;\">" + startTime + "</p>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</td></tr>" +

                // Seats
                "<tr><td style=\"padding:0 32px 20px;\">" +
                "<p style=\"margin:0 0 10px;color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;\">Ghế ngồi</p>" +
                "<div style=\"display:inline-block;\">" +
                buildSeatBadges(seatsList) +
                "</div>" +
                "</td></tr>" +

                // Combos + Total
                "<tr><td style=\"padding:0 32px 28px;\">" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f9fafb;border-radius:12px;padding:16px;\">" +
                comboHtml +
                "<tr><td colspan=\"2\" style=\"padding-top:12px;border-top:1px solid #e5e7eb;\"></td></tr>" +
                "<tr>" +
                "<td style=\"font-size:16px;font-weight:700;color:#111827;\">Tổng thanh toán</td>" +
                "<td style=\"text-align:right;font-size:20px;font-weight:800;color:#dc2626;\">" + totalStr + "đ</td>" +
                "</tr>" +
                "</table>" +
                "</td></tr>" +

                // Notice box
                "<tr><td style=\"padding:0 32px 28px;\">" +
                "<div style=\"background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;\">" +
                "<p style=\"margin:0 0 8px;font-weight:700;color:#92400e;font-size:14px;\">⚠️ Lưu ý quan trọng</p>" +
                "<ul style=\"margin:0;padding-left:20px;color:#78350f;font-size:13px;line-height:2;\">" +
                "<li>Vui lòng có mặt tại rạp trước giờ chiếu <strong>15 phút</strong></li>" +
                "<li>Xuất trình <strong>mã đặt vé</strong> hoặc email này tại quầy để nhận vé</li>" +
                "<li>Vé đã mua <strong>không thể đổi hoặc hoàn trả</strong></li>" +
                "<li>Combo bắp nước sẽ được nhận tại quầy</li>" +
                "</ul>" +
                "</div>" +
                "</td></tr>" +

                "</table>" + // end card inner table
                "</td></tr>" + // end card

                // Footer
                "<tr><td style=\"text-align:center;padding-top:24px;\">" +
                "<p style=\"margin:0 0 4px;color:#9ca3af;font-size:13px;\">Email đặt vé lúc " + bookingTime + "</p>" +
                "<p style=\"margin:0;color:#9ca3af;font-size:12px;\">© 2026 CineVerse. Cảm ơn bạn đã tin dùng dịch vụ!</p>" +
                "</td></tr>" +

                "</table>" + // end wrapper inner table
                "</td></tr></table>" + // end wrapper

                "</body></html>";
    }

    private String buildSeatBadges(String seatsList) {
        if (seatsList == null || seatsList.isBlank()) return "<span style=\"color:#6b7280;\">N/A</span>";
        StringBuilder sb = new StringBuilder();
        for (String seat : seatsList.split(",")) {
            sb.append(String.format(
                    "<span style=\"display:inline-block;background:linear-gradient(135deg,#fee2e2,#ffedd5);color:#b91c1c;" +
                    "font-weight:700;font-size:14px;padding:6px 14px;border-radius:8px;margin:3px;border:1px solid #fca5a5;\">%s</span>",
                    seat.trim()
            ));
        }
        return sb.toString();
    }
}
