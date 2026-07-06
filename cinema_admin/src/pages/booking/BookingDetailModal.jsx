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
        className="modal-overlay"
        onClick={handleOverlayClick}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="modal-box"
          style={{ maxWidth: '640px' }}
        >
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">Chi tiết vé: {booking.id}</h3>
            <button onClick={onClose} className="btn btn-icon">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Box Phim & Trạng thái */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-info)', marginBottom: '4px' }}>Tên phim</p>
                <p style={{ fontWeight: '700', fontSize: '1rem' }}>{booking.movie}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-info)', marginBottom: '4px' }}>Trạng thái</p>
                <span className="badge badge-green">{booking.status}</span>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '24px' }}>
              {/* Cột trái: Thông tin khách hàng */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontWeight: '600', color: 'var(--text-secondary)', paddingBottom: '8px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Thông tin khách hàng</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{booking.customer}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{booking.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{booking.phone}</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Thông tin suất chiếu & Thanh toán */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontWeight: '600', color: 'var(--text-secondary)', paddingBottom: '8px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Thông tin suất chiếu & Thanh toán</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{booking.showtime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>{booking.room}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {booking.paymentMethod === 'CASH' ? (
                      <Banknote size={15} style={{ color: 'var(--accent-success)' }} />
                    ) : (
                      <CreditCard size={15} style={{ color: 'var(--accent-info)' }} />
                    )}
                    <span>
                      Phương thức: 
                      <span className={`badge ${booking.paymentMethod === 'CASH' ? 'badge-green' : 'badge-blue'}`} style={{ marginLeft: '8px' }}>
                        {booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'QR Code'}
                      </span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Ticket size={15} style={{ color: 'var(--text-muted)', marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ghế đã chọn:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {booking.seats.map((seat, idx) => (
                          <span key={idx} className="badge badge-gray">{seat}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ngày đặt vé: {booking.bookingDate}</span>
              {booking.rawStatus === 'PENDING' && (
                <button 
                  onClick={handleCancelBooking}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: '8px', display: 'block' }}
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Tổng thanh toán</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-danger)' }}>{booking.total.toLocaleString()} VNĐ</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}