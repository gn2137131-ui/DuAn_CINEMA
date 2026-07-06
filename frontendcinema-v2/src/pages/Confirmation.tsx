import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Mail, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';
// Note: using a simple print fallback to avoid adding extra dependency; replace with `react-to-print` if desired

// Local types for better type-safety in this page
interface SeatDisplay {
  id: string | number;
  name: string;
}

interface ComboSelection {
  key?: string;
  combo?: { id?: number; name?: string; price?: number } | null;
  quantity: number;
}

interface BookingConfirmation {
  id: string | number;
  bookingCode?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  seats?: SeatDisplay[];
  combos?: ComboSelection[];
  customerInfo?: { name?: string; email?: string; phone?: string } | null;
  movie?: any;
  showtime?: any;
}

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');

  // data passed from Checkout (fallback)
  const { booking, movie: stateMovie, showtime: stateShowtime, seats: stateSeats, combos: stateCombos, customerInfo: stateCustomerInfo, totalPrice: stateTotalPrice, paymentMethod: statePaymentMethod } = location.state || {};

  const [bookingDetails, setBookingDetails] = useState<BookingConfirmation | null>(booking || null);
  const [isLoading, setIsLoading] = useState<boolean>(!!(booking || bookingIdParam));
  const [error, setError] = useState<string | null>(null);

  // Print ref
  const printRef = useRef<HTMLDivElement | null>(null);

  // Email sending state
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [emailNotification, setEmailNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Guard confetti to run only once
  const confettiFiredRef = useRef(false);

  const handlePrint = () => {
    const seatsStr = seatsToShow.map((s: SeatDisplay) => s?.name ?? String(s)).join(', ');
    const combosStr = combosArray.length > 0
      ? combosArray.map(item => `${item.combo?.name ?? 'Combo'} x${item.quantity}`).join(', ')
      : null;
    const totalStr = Number(totalPriceView).toLocaleString('vi-VN') + 'đ';
    const payLabel = paymentMethodView === 'card' ? 'Thẻ tín dụng'
      : paymentMethodView === 'momo' ? 'Ví MoMo'
      : paymentMethodView === 'wallet' ? 'Ví CineVerse' : paymentMethodView;
    const posterUrl = movie?.posterUrl || movie?.poster_url || movie?.poster || '';

    const seatBadges = seatsToShow.map((s: SeatDisplay) =>
      `<span style="display:inline-block;background:linear-gradient(135deg,#fee2e2,#ffedd5);color:#b91c1c;font-weight:700;font-size:14px;padding:6px 16px;border-radius:8px;margin:4px;border:1.5px solid #fca5a5;">${s?.name ?? String(s)}</span>`
    ).join('');

    const comboRows = combosArray.length > 0
      ? `<tr><td colspan="2" style="padding:12px 0 4px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Combo Bắp Nước</td></tr>` +
        combosArray.map(item =>
          `<tr><td style="padding:4px 0;color:#374151;">${item.combo?.name ?? 'Combo'} x${item.quantity}</td><td style="text-align:right;color:#374151;">${((item.combo?.price || 0) * item.quantity).toLocaleString('vi-VN')}đ</td></tr>`
        ).join('')
      : '';

    const posterBlock = posterUrl
      ? `<img src="${posterUrl}" alt="${movie?.title ?? ''}" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px 14px 0 0;display:block;"/>`
      : `<div style="height:8px;background:linear-gradient(90deg,#dc2626,#f97316,#fbbf24);border-radius:14px 14px 0 0;"></div>`;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Vé Điện Tử – ${movie?.title ?? 'CineVerse'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:#f3f4f6;font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    @media print{body{background:#f3f4f6;}}
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Logo -->
      <tr><td style="text-align:center;padding-bottom:22px;">
        <span style="font-size:28px;font-weight:900;color:#dc2626;letter-spacing:-1px;">🎬 CineVerse</span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.12);">
        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- Poster -->
          <tr><td>${posterBlock}</td></tr>

          <!-- Gradient header -->
          <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#f97316 50%,#fbbf24 100%);padding:28px 32px;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,.85);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Mã Đặt Vé</p>
            <p style="margin:0;color:#fff;font-size:32px;font-weight:900;letter-spacing:4px;">${bookingCode}</p>
          </td></tr>

          <!-- Movie title + greeting -->
          <tr><td style="padding:28px 32px 0;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;">${movie?.title ?? ''}</p>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">Cảm ơn bạn đã đặt vé tại CineVerse. Chúc bạn có buổi xem phim thật vui!</p>
          </td></tr>

          <!-- Divider -->
          <tr><td style="padding:18px 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>

          <!-- Showtime info grid -->
          <tr><td style="padding:0 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding-bottom:14px;">
                  <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Rạp</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:700;">${showtime?.theater ?? 'N/A'}</p>
                </td>
                <td style="width:50%;padding-bottom:14px;">
                  <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Định Dạng</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:700;">${showtime?.format ?? '2D'}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;">
                  <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Ngày Chiếu</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:700;">${showtime?.date ?? 'N/A'}</p>
                </td>
                <td style="padding-bottom:14px;">
                  <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Giờ Chiếu</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:700;">${showtime?.time ?? 'N/A'}</p>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Seats -->
          <tr><td style="padding:0 32px 20px;">
            <p style="margin:0 0 10px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Ghế Ngồi</p>
            <div>${seatBadges}</div>
          </td></tr>

          <!-- Combos + total -->
          <tr><td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:16px;">
              ${comboRows}
              <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #e5e7eb;"></td></tr>
              <tr>
                <td style="font-size:14px;font-weight:700;color:#111827;">Phương thức thanh toán</td>
                <td style="text-align:right;font-size:14px;color:#374151;">${payLabel}</td>
              </tr>
              <tr>
                <td style="padding-top:8px;font-size:16px;font-weight:800;color:#111827;">Tổng thanh toán</td>
                <td style="padding-top:8px;text-align:right;font-size:22px;font-weight:900;color:#dc2626;">${totalStr}</td>
              </tr>
            </table>
          </td></tr>

          <!-- Customer info -->
          <tr><td style="padding:0 32px 24px;">
            <p style="margin:0 0 10px;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Thông Tin Khách Hàng</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:3px 0;color:#6b7280;font-size:13px;width:110px;">Họ tên:</td><td style="color:#111827;font-size:13px;font-weight:600;">${customerInfoData?.name ?? ''}</td></tr>
              <tr><td style="padding:3px 0;color:#6b7280;font-size:13px;">Email:</td><td style="color:#111827;font-size:13px;font-weight:600;">${customerInfoData?.email ?? ''}</td></tr>
              <tr><td style="padding:3px 0;color:#6b7280;font-size:13px;">Số điện thoại:</td><td style="color:#111827;font-size:13px;font-weight:600;">${customerInfoData?.phone ?? ''}</td></tr>
            </table>
          </td></tr>

          <!-- Notice -->
          <tr><td style="padding:0 32px 28px;">
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:16px;">
              <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:13px;">⚠️ Lưu ý quan trọng</p>
              <ul style="margin:0;padding-left:20px;color:#78350f;font-size:12px;line-height:2;">
                <li>Vui lòng có mặt tại rạp trước giờ chiếu <strong>15 phút</strong></li>
                <li>Xuất trình <strong>mã đặt vé</strong> hoặc email này tại quầy để nhận vé</li>
                <li>Vé đã mua <strong>không thể đổi hoặc hoàn trả</strong></li>
                <li>Combo bắp nước sẽ được nhận tại quầy</li>
              </ul>
            </div>
          </td></tr>

        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="text-align:center;padding-top:22px;">
        <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Ngày đặt vé: ${new Date().toLocaleDateString('vi-VN')}</p>
        <p style="margin:0;color:#9ca3af;font-size:11px;">© 2026 CineVerse · Cảm ơn bạn đã tin dùng dịch vụ!</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=750,height=900');
    if (!popup) { window.print(); return; }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); }, 800);
  };

  const handleSendEmail = async () => {
    const bookingId = bookingDetails?.id ?? bookingIdParam;
    if (!bookingId) {
      setEmailNotification({ type: 'error', message: 'Không tìm thấy ID đặt vé!' });
      return;
    }
    try {
      setIsSendingEmail(true);
      setEmailNotification(null);
      const resp: any = await axiosClient.post(`/bookings/${bookingId}/send-email`);
      const data = resp?.data ?? resp;
      const destEmail = data?.email || customerInfoData?.email || '';
      setEmailSent(true);
      setEmailNotification({
        type: 'success',
        message: `✓ Email vé đã được gửi tới ${destEmail}`,
      });
    } catch (err: any) {
      const errMsg = err?.response?.data || err?.message || 'Gửi email thất bại!';
      setEmailNotification({ type: 'error', message: typeof errMsg === 'string' ? errMsg : 'Gửi email thất bại!' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Clear transient checkout cache once confirmation is shown
  useEffect(() => {
    if (bookingDetails) {
      try {
        localStorage.removeItem('checkout_data');
      } catch (err) {
        console.debug('Failed to clear checkout cache', err);
      }
    }
  }, [bookingDetails]);

  // Fetch booking by ID if URL contains bookingId, otherwise use state
  useEffect(() => {
    const idToFetch = bookingIdParam ?? booking?.id;
    if (!idToFetch) {
      // No booking id available — but if we have stateMovie, still show confetti once
      if (stateMovie && !confettiFiredRef.current) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#dc2626', '#f97316', '#fbbf24'] });
        confettiFiredRef.current = true;
      }
      return;
    }

    const fetchById = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching booking with ID: ${idToFetch}`);
        const resp: any = await axiosClient.get(`/bookings/${idToFetch}`);
        console.log('Booking response:', resp);
        const data = Array.isArray(resp) ? resp[0] : resp?.data ?? resp;
        console.log('Booking data after parsing:', data);
        setBookingDetails(data || null);

        if (!confettiFiredRef.current) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#dc2626', '#f97316', '#fbbf24'] });
          confettiFiredRef.current = true;
        }
      } catch (err) {
        console.error('Lỗi khi fetch booking by id', err);
        setError('Không thể tải chi tiết đặt vé');
      } finally {
        setIsLoading(false);
      }
    };

    // If we already have booking in location.state and it matches id, use it immediately
    if (booking && String(booking.id) === String(idToFetch)) {
      setBookingDetails(booking);
      if (!confettiFiredRef.current) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#dc2626', '#f97316', '#fbbf24'] });
        confettiFiredRef.current = true;
      }
      setIsLoading(false);
    } else {
      fetchById();
    }
  }, [bookingIdParam, booking]);

  // Derived view-models (placed early so page presence check below can use them)
  const movie = bookingDetails?.movie ?? stateMovie;
  const showtime = (() => {
    const st = bookingDetails?.showtime ?? stateShowtime;
    if (!st) return null;
    return {
      ...st,
      // Normalize field names - backend có thể trả về khác nhau
      theater: st.theater || st.room || `Phòng ${st.room_id || st.roomId || '1'}`,
      format: st.format || '2D',
      date: st.show_date || st.showDate || st.date || new Date().toISOString().split('T')[0],
      time: st.time || st.start_time || st.startTime || '00:00',
    };
  })();
  const seatsToShow = bookingDetails?.seats ?? stateSeats ?? [];
  const combosData = bookingDetails?.combos ?? stateCombos ?? [];
  const customerInfoData = bookingDetails?.customerInfo ?? stateCustomerInfo ?? { name: '', email: '', phone: '' };
  const totalPriceView = bookingDetails?.totalAmount ?? stateTotalPrice ?? 0;
  const paymentMethodView = (bookingDetails as any)?.paymentMethod ?? statePaymentMethod ?? 'card';

  // Normalize combos into uniform array
  const combosArray: ComboSelection[] = (() => {
    if (!combosData) return [];
    if (Array.isArray(combosData)) return combosData as ComboSelection[];
    if (typeof combosData === 'object') {
      return Object.entries(combosData).map(([key, val]) => {
        if (typeof val === 'number') return { key, combo: null, quantity: val };
        return { key, combo: (val as any).combo ?? null, quantity: (val as any).quantity ?? 0 };
      });
    }
    return [];
  })();

  // Booking code (fallback)
  const bookingCode = bookingDetails?.bookingCode || booking?.bookingCode || `CV${Date.now().toString().slice(-8)}`;

  if (!movie || !showtime) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-gray-600 dark:text-gray-400">Đang xác nhận đặt vé...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Quay lại trang chủ
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Không có thông tin đặt vé</h1>
              <button
                onClick={() => navigate('/')}
                className="text-red-600 mt-4 inline-block"
              >
                Quay lại trang chủ
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Success Message */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="inline-block"
            >
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2">Đặt Vé Thành Công!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mã đặt vé của bạn đã được gửi qua email
            </p>
          </div>

          {/* Booking Details */}
          <div ref={printRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Mã đặt vé</p>
                  <p className="text-3xl font-bold tracking-wider">{bookingCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Ngày đặt</p>
                  <p className="font-semibold">
                    {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Movie Info */}
              <div>
                <h2 className="font-bold text-xl mb-3 text-gray-800 dark:text-gray-200">{movie.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Rạp</p>
                    <p className="font-semibold">{showtime.theater}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Định dạng</p>
                    <p className="font-semibold">{showtime.format}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Ngày chiếu</p>
                    <p className="font-semibold">{showtime.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Giờ chiếu</p>
                    <p className="font-semibold">{showtime.time}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Ghế ngồi</p>
                <div className="flex flex-wrap gap-2">
                  {seatsToShow.map((seat: SeatDisplay) => (
                    <div
                      key={seat?.id ?? String(seat)}
                      className="bg-gradient-to-br from-red-100 to-orange-100 px-4 py-2 rounded-lg font-semibold text-red-700"
                    >
                      {seat?.name ?? String(seat)}
                    </div>
                  ))}
                </div>
              </div>

              {combosArray.length > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Combo bắp nước</p>
                  {combosArray.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{item.combo?.name ?? 'Combo'} x{item.quantity}</span>
                      <span className="font-semibold">
                        {((item.combo?.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Thông tin khách hàng</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600 dark:text-gray-400">Họ tên:</span> <span className="font-semibold">{customerInfoData?.name}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Email:</span> <span className="font-semibold">{customerInfoData?.email}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Số điện thoại:</span> <span className="font-semibold">{customerInfoData?.phone}</span></p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Phương thức thanh toán:</span>
                  <span className="font-semibold">
                    {paymentMethodView === 'card' && 'Thẻ tín dụng'}
                    {paymentMethodView === 'momo' && 'Ví MoMo'}
                    {paymentMethodView === 'wallet' && 'Ví CineVerse'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Tổng thanh toán:</span>
                  <span className="font-bold text-2xl text-red-600">
                    {Number(totalPriceView).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 dark:bg-slate-800 p-6 space-y-3">
              <button onClick={handlePrint} className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Tải Vé Điện Tử
              </button>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  id="btn-send-email"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || emailSent}
                  className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2 ${
                    emailSent
                      ? 'bg-green-50 border-green-400 text-green-700 cursor-default'
                      : isSendingEmail
                      ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 hover:border-red-500 hover:text-red-600'
                  }`}
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : emailSent ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Đã gửi ✓
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Gửi Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-700 py-3 rounded-xl font-semibold hover:border-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Trang Chủ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button 
                  onClick={() => toast.success('Đã lưu vé vào Apple Wallet thành công!')}
                  className="bg-black text-white rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <span className="text-xs font-semibold leading-tight text-left">Add to<br/><span className="text-base">Apple Wallet</span></span>
                </button>
                <button 
                  onClick={() => toast.success('Đã lưu vé vào Google Wallet thành công!')}
                  className="bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-slate-800 transition-colors shadow-sm"
                >
                  <span className="text-xs font-semibold leading-tight text-left">Add to<br/><span className="text-base text-gray-900 dark:text-gray-100">Google Wallet</span></span>
                </button>
              </div>

              {/* Email notification toast */}
              {emailNotification && (
                <div
                  className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                    emailNotification.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {emailNotification.type === 'success' ? (
                    <svg className="w-5 h-5 mt-0.5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{emailNotification.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6"
          >
            <h3 className="font-semibold mb-2 text-yellow-900">Lưu ý quan trọng:</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Vui lòng có mặt tại rạp trước giờ chiếu 15 phút</li>
              <li>• Xuất trình mã QR hoặc mã đặt vé tại quầy để nhận vé</li>
              <li>• Vé đã mua không thể đổi hoặc hoàn trả</li>
              <li>• Combo bắp nước sẽ được nhận tại quầy</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
