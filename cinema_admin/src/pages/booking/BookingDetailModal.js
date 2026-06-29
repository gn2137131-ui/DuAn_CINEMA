import { X, User, Mail, Phone, Clock, MapPin, Ticket, CreditCard, Banknote } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function BookingDetailModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  // Hàm để đóng modal khi click ra ngoài vùng xám
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCancelBooking = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Khách hàng sẽ được hoàn tiền nếu đã thanh toán.')) {
      try {
        await axiosClient.put(`/bookings/${booking.rawId}/cancel`);
        toast.success('Hủy đơn hàng thành công!');
        onClose(); // This will trigger fetchBookings in the parent
      } catch (err) {
        toast.error(err.response?.data || 'Không thể hủy đơn hàng!');
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold">Chi tiết vé: {booking.id}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Box Phim & Trạng thái */}
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Tên phim</p>
              <p className="font-semibold text-lg">{booking.movie}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Trạng thái</p>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {booking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cột trái: Thông tin khách hàng */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">Thông tin khách hàng</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{booking.customer}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{booking.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{booking.phone}</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin suất chiếu & Thanh toán */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">Thông tin suất chiếu & Thanh toán</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{booking.showtime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{booking.room}</span>
                </div>
                <div className="flex items-center gap-3">
                  {booking.paymentMethod === 'CASH' ? (
                    <Banknote className="w-4 h-4 text-green-500" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-blue-500" />
                  )}
                  <span>
                    Phương thức: 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${booking.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'QR Code'}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-3 mt-2">
                  <Ticket className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-gray-500 block mb-1">Ghế đã chọn:</span>
                    <div className="flex flex-wrap gap-1">
                      {booking.seats.map((seat, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-800 gap-4">
          <div className="text-sm text-gray-500">
            Ngày đặt vé: {booking.bookingDate}
            {booking.rawStatus === 'PENDING' && (
              <button 
                onClick={handleCancelBooking}
                className="mt-3 block px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-semibold transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
          <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end">
            <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
            <p className="text-2xl font-bold text-red-600">{booking.total.toLocaleString()} VNĐ</p>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}