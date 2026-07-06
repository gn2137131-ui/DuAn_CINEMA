import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, Star, ArrowLeft, X, CheckCircle, MessageSquare, Tag, Copy, Scissors } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

interface Booking {
  id: string;
  movie: string;
  movieId?: number;
  poster: string;
  date: string;
  time: string;
  theater: string;
  format: string;
  seats: string[];
  total: number;
  status: 'upcoming' | 'past' | 'cancelled';
  bookingDate: string;
  rated?: boolean;
  rating?: number;
  orderCode?: string;
}

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const handleAddToWallet = (type: 'apple' | 'google') => {
    toast.success(`Đã lưu vé vào ${type === 'apple' ? 'Apple' : 'Google'} Wallet thành công!`);
  };

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get('/bookings/my') as any;
        const rawBookings = Array.isArray(response) ? response : response.data || [];
        
        const formattedBookings = rawBookings.map((b: any) => {
          const firstTicket = b.tickets?.[0];
          const showtime = firstTicket?.showtimeSeat?.showtime;
          const movie = showtime?.movie;
          const room = showtime?.room;
          
          const seatNames = b.tickets?.map((t: any) => {
            const s = t.showtimeSeat?.seat;
            return s ? `${s.rowName}${s.colIndex}` : 'Unknown';
          }) || [];
          
          let status: 'upcoming' | 'past' | 'cancelled' = 'past';
          const validStartTime = showtime?.startTime || showtime?.start_time || '';
          
          if (b.paymentStatus === 'CANCELLED') {
            status = 'cancelled';
          } else if (showtime && showtime.showDate && validStartTime) {
            let timeStr = validStartTime;
            if (Array.isArray(timeStr)) {
              timeStr = `${String(timeStr[0]).padStart(2, '0')}:${String(timeStr[1]).padStart(2, '0')}`;
            }
            const showStart = new Date(`${showtime.showDate}T${timeStr}`);
            if (showStart > new Date()) {
              status = 'upcoming';
            }
          }
          
          let displayTime = validStartTime;
          if (Array.isArray(displayTime)) {
            displayTime = `${String(displayTime[0]).padStart(2, '0')}:${String(displayTime[1]).padStart(2, '0')}`;
          } else if (typeof displayTime === 'string' && displayTime.length >= 5) {
            displayTime = displayTime.substring(0, 5);
          }

          return {
            id: String(b.id),
            movie: movie?.title || 'Phim đã ẩn',
            movieId: movie?.id,
            poster: movie?.posterUrl || '',
            date: showtime?.showDate || '',
            time: displayTime,
            theater: room?.name || 'Phòng chiếu',
            format: showtime?.format || '2D',
            seats: seatNames,
            total: Number(b.totalPrice || 0),
            status: status,
            bookingDate: b.bookingTime || '',
            orderCode: b.orderCode || String(b.id),
            rated: false,
          };
        });

        // Kiểm tra xem người dùng đã đánh giá những phim này chưa
        const uniqueMovieIds = Array.from(new Set(formattedBookings.map((b: any) => b.movieId).filter(Boolean)));
        const reviewsStatus = await Promise.all(
          uniqueMovieIds.map(async (mId) => {
            try {
              const res = await axiosClient.get(`/reviews/movie/${mId}/my-review`) as any;
              const reviewData = res?.data || res;
              const hasReviewed = !!(reviewData && reviewData.id);
              return { movieId: mId, hasReviewed, rating: reviewData?.rating || 0 };
            } catch {
              return { movieId: mId, hasReviewed: false, rating: 0 };
            }
          })
        );
        
        const reviewMap = new Map();
        reviewsStatus.forEach(s => {
           if (s.hasReviewed) reviewMap.set(s.movieId, s.rating);
        });

        const finalBookings = formattedBookings.map((b: any) => ({
          ...b,
          rated: reviewMap.has(b.movieId),
          rating: reviewMap.get(b.movieId) || 0
        }));

        setBookings(finalBookings);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError('Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.');
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const openReviewModal = (booking: Booking) => {
    setReviewTarget(booking);
    setReviewRating(booking.rating || 0);
    setReviewComment('');
    setReviewSuccess(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      await axiosClient.post(`/reviews/movie/${reviewTarget.movieId}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      // update local state
      setBookings(prev => prev.map(b =>
        b.id === reviewTarget.id ? { ...b, rated: true, rating: reviewRating } : b
      ));
      setTimeout(() => {
        setReviewTarget(null);
        setReviewSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMsg = typeof err?.response?.data === 'string' ? err.response.data : (err?.response?.data?.message || err?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại!');
      toast.error(errorMsg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelSubmitting(true);
    try {
      const res = await axiosClient.put(`/bookings/${cancelTarget.id}/cancel`) as any;
      toast.success(res?.message || 'Đã hủy vé thành công!');
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b
      ));
      setCancelTarget(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.response?.data || err?.message || 'Hủy vé thất bại. Vui lòng thử lại!';
      toast.error(errorMsg);
      setCancelTarget(null);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const getStarLabel = (star: number) => {
    const labels = ['', 'Tệ', 'Không hay', 'Bình thường', 'Hay', 'Xuất sắc'];
    return labels[star] || '';
  };

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại trang cá nhân
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">Lịch Sử Đặt Vé</h1>
                <p className="text-slate-400">Quản lý tất cả vé đã đặt của bạn</p>
              </div>

              {/* Filter */}
              <div className="flex gap-2 bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-800">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    filter === 'upcoming'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Sắp chiếu
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    filter === 'past'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Đã xem
                </button>
                <button
                  onClick={() => setFilter('cancelled' as any)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    filter === 'cancelled' as any
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Đã hủy
                </button>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-800 font-semibold">Đang tải lịch sử đặt vé...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Bookings List */}
          {!isLoading && !error && filteredBookings.length > 0 && (
          <div className="space-y-6">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Poster */}
                  <div className="md:w-48 h-64 md:h-auto bg-gray-200 flex-shrink-0">
                    <img
                      src={booking.poster}
                      alt={booking.movie}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2 text-white">{booking.movie}</h3>
                        <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                          booking.status === 'upcoming'
                            ? 'bg-green-900/40 text-green-400 border border-green-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-900/40 text-red-400 border border-red-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {booking.status === 'upcoming' ? '🎬 Sắp chiếu' : booking.status === 'cancelled' ? '❌ Đã hủy' : '✅ Đã xem'}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-red-400">
                        {booking.total.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Ngày chiếu</p>
                          <p className="font-semibold text-slate-200">{new Date(booking.date).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Giờ chiếu</p>
                          <p className="font-semibold text-slate-200">{booking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Rạp &amp; Định dạng</p>
                          <p className="font-semibold text-slate-200">{booking.theater} • {booking.format}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Ghế ngồi</p>
                          <p className="font-semibold text-slate-200">{booking.seats.join(', ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        <Ticket className="w-4 h-4" />
                        Xem vé
                      </button>

                      {booking.status === 'upcoming' && (
                        <button
                          onClick={() => setCancelTarget(booking)}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-400 rounded-xl font-semibold transition-all"
                        >
                          <X className="w-4 h-4" />
                          Hủy vé
                        </button>
                      )}

                      {booking.status === 'past' && !booking.rated && booking.movieId && (
                        <button
                          onClick={() => openReviewModal(booking)}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-slate-700 hover:border-yellow-500 text-slate-400 hover:text-yellow-400 rounded-xl font-semibold transition-all"
                        >
                          <Star className="w-4 h-4" />
                          Đánh giá phim
                        </button>
                      )}

                      {booking.status === 'past' && booking.rated && (
                        <button
                          onClick={() => openReviewModal(booking)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/50 hover:border-yellow-500 text-yellow-400 rounded-xl font-semibold transition-all cursor-pointer"
                        >
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= (booking.rating || 0) ? 'fill-current' : 'opacity-30'}`} />
                          ))}
                          <span className="ml-1 text-sm">{booking.rating}/5</span>
                        </button>
                      )}

                      <div className="ml-auto text-sm text-slate-500 flex items-center">
                        Mã: <span className="font-mono font-semibold ml-1 text-slate-300">{booking.orderCode || booking.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}

          {!isLoading && !error && filteredBookings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Ticket className="w-20 h-20 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400 mb-2">Chưa có vé nào</h3>
              <p className="text-slate-500 mb-6">
                {filter === 'upcoming' && 'Bạn chưa có vé sắp chiếu.'}
                {filter === 'past' && 'Bạn chưa có vé nào đã xem.'}
                {filter === 'all' && 'Bạn chưa đặt vé nào.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Đặt vé ngay
              </button>
            </motion.div>
          )}

        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setReviewTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="relative h-28 bg-slate-800">
                {reviewTarget.poster && (
                  <img src={reviewTarget.poster} alt="" className="w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
                <button
                  onClick={() => setReviewTarget(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-5">
                  <h2 className="text-lg font-bold text-white line-clamp-1">{reviewTarget.movie}</h2>
                  <p className="text-slate-400 text-sm">Chia sẻ cảm nhận của bạn về bộ phim này</p>
                </div>
              </div>

              <div className="p-6">
                {reviewSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Cảm ơn bạn!</h3>
                    <p className="text-slate-400">Đánh giá của bạn đã được gửi thành công.</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Star Rating */}
                    <div className="text-center mb-6">
                      <p className="text-slate-400 text-sm mb-3">Bạn đánh giá bộ phim này như thế nào?</p>
                      <div className="flex justify-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            className="transition-transform hover:scale-125"
                          >
                            <Star
                              className={`w-10 h-10 transition-colors ${
                                star <= (hoverRating || reviewRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {(hoverRating || reviewRating) > 0 && (
                        <p className="text-yellow-400 font-semibold text-sm">
                          {getStarLabel(hoverRating || reviewRating)}
                        </p>
                      )}
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        <label className="text-sm font-semibold text-slate-300">Nhận xét (không bắt buộc)</label>
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Chia sẻ cảm nhận của bạn về cốt truyện, diễn xuất, hình ảnh..."
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setReviewTarget(null)}
                        className="flex-1 py-3 rounded-xl font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0 || reviewSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Xác nhận hủy vé</h3>
              <p className="text-slate-400 mb-6">
                Bạn có chắc chắn muốn hủy vé phim <span className="font-semibold text-white">{cancelTarget.movie}</span> không?
                <br /><br />
                <span className="text-sm text-yellow-500">Lưu ý: Bạn chỉ có thể hủy vé trước giờ chiếu ít nhất 2 tiếng. Số điểm tích lũy và voucher sử dụng cho đơn hàng này sẽ được hoàn lại.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 py-3 rounded-xl font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Không, quay lại
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancelSubmitting ? 'Đang xử lý...' : 'Đồng ý hủy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
          >
            {/* Header / Poster area */}
            <div className="h-32 bg-gray-900 relative">
               <img src={selectedTicket.poster} alt="Poster" className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
               <div className="absolute bottom-4 left-6 right-6">
                 <h2 className="text-2xl font-bold text-white truncate">{selectedTicket.movie}</h2>
                 <p className="text-gray-300 text-sm">Mã Đơn: {selectedTicket.orderCode}</p>
               </div>
            </div>
            
            {/* Ticket Info */}
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-700 uppercase tracking-wider">Ngày chiếu</p>
                  <p className="font-bold text-lg">{new Date(selectedTicket.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                  <p className="text-xs text-gray-700 uppercase tracking-wider">Giờ chiếu</p>
                  <p className="font-bold text-lg text-red-600">{selectedTicket.time}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Rạp</span>
                  <span className="font-semibold">{selectedTicket.theater}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Định dạng</span>
                  <span className="font-semibold">{selectedTicket.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Ghế ngồi</span>
                  <span className="font-semibold text-red-600">{selectedTicket.seats.join(', ')}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-2">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedTicket.orderCode}`} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-xs text-gray-600 text-center mb-4">Đưa mã QR này cho nhân viên soát vé</p>

                {/* Digital Wallets */}
                <div className="flex gap-3 w-full max-w-[250px]">
                  <button 
                    onClick={() => handleAddToWallet('apple')}
                    className="flex-1 bg-black text-white rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] font-semibold leading-tight">Add to<br/><span className="text-sm">Apple Wallet</span></span>
                  </button>
                  <button 
                    onClick={() => handleAddToWallet('google')}
                    className="flex-1 bg-white border border-gray-300 text-gray-800 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] font-semibold leading-tight text-left">Add to<br/><span className="text-sm text-gray-900">Google Wallet</span></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-full py-3 rounded-xl font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
