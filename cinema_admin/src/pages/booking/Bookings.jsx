import React, { useEffect, useState } from 'react';
import { Search, Download, Eye, Loader2, Ticket } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { BookingDetailModal } from './BookingDetailModal';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Gọi API lấy danh sách hóa đơn từ Spring Boot
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/bookings');
      if (Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        console.error('Expected an array but got:', response.data);
        setBookings([]);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đặt vé:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 2. Thống kê số liệu động tự nhảy số theo ngày hiện tại
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const bookingsToday = bookings.filter(b => b.bookingTime?.startsWith(todayStr));

  const revenueToday = bookingsToday
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingCount = bookings.filter(b => b.paymentStatus === 'PENDING').length;

  // 3. Hàm map trạng thái sang Tiếng Việt và Màu sắc tương ứng
  const getStatusDetails = (status) => {
    switch (status) {
      case 'PAID':
        return { text: 'Đã thanh toán', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'PENDING':
        return { text: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'CANCELLED':
        return { text: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  // 4. Logic tìm kiếm và lọc trạng thái đơn hàng
  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === 'ALL' || booking.paymentStatus === statusFilter;

    const searchLower = searchTerm.toLowerCase();

    // Lấy thông tin phim từ tấm vé đầu tiên để hỗ trợ tìm kiếm theo tên phim
    const firstTicket = booking.tickets?.[0];
    const movieTitle = firstTicket?.showtimeSeat?.showtime?.movie?.title || '';

    const matchesSearch =
      String(booking.id).includes(searchLower) ||
      (booking.user?.fullName || '').toLowerCase().includes(searchLower) ||
      movieTitle.toLowerCase().includes(searchLower) ||
      (booking.user?.email || '').toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Mã đơn', 'Phim', 'Khách hàng', 'Email', 'SĐT', 'Suất chiếu', 'Phòng', 'Ghế', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'];
    const rows = filteredBookings.map(booking => {
      const firstTicket = booking.tickets?.[0];
      const showtimeObj = firstTicket?.showtimeSeat?.showtime;
      const movieTitle = showtimeObj?.movie?.title || '';
      const room = showtimeObj?.room?.name || '';
      const showtime = `${showtimeObj?.showtimeDate || ''} ${showtimeObj?.startTime || ''}`;
      const seats = (booking.tickets?.map(t => t.showtimeSeat?.seat?.seatNumber) || []).join(' ');
      return [
        booking.orderCode || booking.id,
        movieTitle,
        booking.user?.fullName || '',
        booking.user?.email || '',
        booking.user?.phone || '',
        showtime,
        room,
        seats,
        booking.totalPrice,
        booking.paymentStatus,
        booking.bookingTime
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(item => `"${item}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadgeMap = {
    PAID:      'badge-green',
    PENDING:   'badge-yellow',
    CANCELLED: 'badge-red',
    PRINTED:   'badge-blue',
  };
  const statusLabel = { PAID: 'Đã thanh toán', PENDING: 'Chờ thanh toán', CANCELLED: 'Đã hủy', PRINTED: 'Đã in vé' };

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Đơn Đặt Vé</h1>
          <p className="page-subtitle">Theo dõi và quản lý tất cả giao dịch trong hệ thống</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-primary">
          <Download size={15} />
          Xuất CSV
        </button>
      </div>

      {/* STATS */}
      <motion.div className="grid-3" style={{ marginBottom: '24px' }} variants={containerVariants} initial="hidden" animate="show">
        {[
          { label: 'Đặt vé hôm nay', value: isLoading ? '...' : bookingsToday.length, accent: 'var(--accent-secondary)', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Doanh thu hôm nay', value: isLoading ? '...' : revenueToday.toLocaleString('vi-VN') + 'đ', accent: 'var(--accent-success)', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Đơn chờ xử lý', value: isLoading ? '...' : pendingCount, accent: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }} style={{ border: `1px solid ${s.bg}`, background: `linear-gradient(135deg, ${s.bg} 0%, transparent 100%)` }}>
            <div>
              <p className="stat-label">{s.label}</p>
              <h3 className="stat-value" style={{ color: s.accent }}>{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* FILTER BAR */}
      <motion.div className="card" style={{ marginBottom: '20px' }} variants={itemVariants} initial="hidden" animate="show">
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex: '1', minWidth: '220px' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên phim, khách hàng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-control">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </motion.div>

      {/* TABLE */}
      {isLoading ? (
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p>Đang tải...</p>
        </div>
      ) : (
        <motion.div className="card" variants={itemVariants} initial="hidden" animate="show">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#Mã đơn</th>
                  <th>Phim</th>
                  <th>Khách hàng</th>
                  <th>Suất chiếu</th>
                  <th>Ghế</th>
                  <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Chi tiết</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                {filteredBookings.length === 0 ? (
                  <motion.tr variants={itemVariants}>
                    <td colSpan="8">
                      <div className="empty-state">
                        <Ticket size={40} />
                        <h4>Không tìm thấy đơn hàng nào</h4>
                        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : filteredBookings.map(booking => {
                  const firstTicket = booking.tickets?.[0];
                  const showtimeObj = firstTicket?.showtimeSeat?.showtime;
                  const movieTitle = showtimeObj?.movie?.title || 'Phim không rõ';
                  const roomName = showtimeObj?.room?.name || 'Phòng chiếu';
                  const showtimeDate = showtimeObj?.showtimeDate || '';
                  const startTime = showtimeObj?.startTime || '';
                  const seatsList = booking.tickets?.map(t => t.showtimeSeat?.seat?.seatNumber || 'N/A') || [];
                  const statusInfo = getStatusDetails(booking.paymentStatus);
                  const badgeCls = statusBadgeMap[booking.paymentStatus] || 'badge-gray';

                  return (
                    <motion.tr key={booking.id} variants={itemVariants}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-primary)' }}>
                          #{booking.orderCode || booking.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{movieTitle}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.72rem' }}>
                            {(booking.user?.fullName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {booking.user?.fullName || 'Ẩn danh'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {showtimeDate} {startTime}<br />
                        <span style={{ color: 'var(--text-muted)' }}>{roomName}</span>
                      </td>
                      <td>{seatsList.join(', ')}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-success)' }}>
                        {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${badgeCls}`}>{statusLabel[booking.paymentStatus] || booking.paymentStatus}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-icon"
                          onClick={() => {
                            setSelectedBooking({
                              rawId: booking.id,
                              id: booking.orderCode || booking.id,
                              movie: movieTitle,
                              status: statusInfo.text,
                              rawStatus: booking.paymentStatus,
                              customer: booking.user?.fullName || 'Khách ẩn danh',
                              email: booking.user?.email || 'Chưa cập nhật',
                              phone: booking.user?.phone || 'Chưa cập nhật',
                              showtime: `${showtimeDate} ${startTime}`,
                              room: roomName,
                              seats: seatsList,
                              bookingDate: new Date(booking.bookingTime).toLocaleString('vi-VN'),
                              total: booking.totalPrice,
                              paymentMethod: booking.paymentMethod || 'QR_PAY'
                            });
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      )}

      {isDetailModalOpen && selectedBooking && (
        <BookingDetailModal
          isOpen={isDetailModalOpen}
          booking={selectedBooking}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}