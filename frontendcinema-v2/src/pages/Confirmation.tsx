import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
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

  // Guard confetti to run only once
  const confettiFiredRef = useRef(false);

  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }
    const printContents = printRef.current.innerHTML;
    const popup = window.open('', '_blank', 'width=800,height=600');
    if (!popup) {
      window.print();
      return;
    }
    popup.document.open();
    popup.document.write(`<html><head><title>Vé điện tử</title><style>body{font-family: sans-serif;}</style></head><body>${printContents}</body></html>`);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 500);
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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-gray-600">Đang xác nhận đặt vé...</p>
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
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
            <p className="text-gray-600">
              Mã đặt vé của bạn đã được gửi qua email
            </p>
          </div>

          {/* Booking Details */}
          <div ref={printRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                <h2 className="font-bold text-xl mb-3 text-gray-800">{movie.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Rạp</p>
                    <p className="font-semibold">{showtime.theater}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Định dạng</p>
                    <p className="font-semibold">{showtime.format}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ngày chiếu</p>
                    <p className="font-semibold">{showtime.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Giờ chiếu</p>
                    <p className="font-semibold">{showtime.time}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500 text-sm mb-2">Ghế ngồi</p>
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
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-500 text-sm mb-2">Combo bắp nước</p>
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
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500 text-sm mb-2">Thông tin khách hàng</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Họ tên:</span> <span className="font-semibold">{customerInfoData?.name}</span></p>
                  <p><span className="text-gray-600">Email:</span> <span className="font-semibold">{customerInfoData?.email}</span></p>
                  <p><span className="text-gray-600">Số điện thoại:</span> <span className="font-semibold">{customerInfoData?.phone}</span></p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
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
            <div className="bg-gray-50 p-6 space-y-3">
              <button onClick={handlePrint} className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Tải Vé Điện Tử
              </button>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button className="bg-white border-2 border-gray-300 py-3 rounded-xl font-semibold hover:border-red-500 transition-all flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Gửi Email
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-white border-2 border-gray-300 py-3 rounded-xl font-semibold hover:border-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Trang Chủ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button 
                  onClick={() => alert('Đã lưu vé vào Apple Wallet thành công!')}
                  className="bg-black text-white rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <span className="text-xs font-semibold leading-tight text-left">Add to<br/><span className="text-base">Apple Wallet</span></span>
                </button>
                <button 
                  onClick={() => alert('Đã lưu vé vào Google Wallet thành công!')}
                  className="bg-white border-2 border-gray-300 text-gray-800 rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-xs font-semibold leading-tight text-left">Add to<br/><span className="text-base text-gray-900">Google Wallet</span></span>
                </button>
              </div>
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
