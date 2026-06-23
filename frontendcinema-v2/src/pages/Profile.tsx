import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Award, Ticket, Gift,
  Settings, LogOut, Edit, Camera, Loader2, X, Info
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SavedPaymentMethods from '../components/SavedPaymentMethods';
import LevelUpModal from '../components/LevelUpModal';
import CatchPopcornGame from '../components/CatchPopcornGame';
import AchievementsShowcase from '../components/AchievementsShowcase';
import axiosClient from '../api/axiosClient';

export default function Profile() {
  const navigate = useNavigate();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái cho modal chỉnh sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch thông tin profile và danh sách đặt vé gần đây
  const fetchProfileAndBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Gọi API lấy thông tin Profile thực tế từ Backend
      const profileResponse = await axiosClient.get('/users/profile') as any;
      const parsedProfile = profileResponse?.data ?? profileResponse;

      if (parsedProfile) {
        setProfile(parsedProfile);

        // Đồng bộ lại localStorage để Header hiển thị đúng tên/avatar mới
        localStorage.setItem('user', JSON.stringify({
          id: parsedProfile.id,
          username: parsedProfile.username,
          fullName: parsedProfile.fullName,
          email: parsedProfile.email,
          phone: parsedProfile.phone,
          avatar: parsedProfile.avatar,
          role: parsedProfile.role,
          membershipLevel: parsedProfile.membershipLevel,
          points: parsedProfile.points
        }));

        // Thiết lập dữ liệu mặc định cho form chỉnh sửa
        setEditForm({
          fullName: parsedProfile.fullName || '',
          email: parsedProfile.email || '',
          phone: parsedProfile.phone || '',
          avatar: parsedProfile.avatar || ''
        });
        setAvatarPreview(parsedProfile.avatar || '');
      }

      // 2. Gọi API lấy danh sách đặt vé gần đây
      const bookingsResponse = await axiosClient.get('/bookings/my') as any;
      const rawBookings = Array.isArray(bookingsResponse)
        ? bookingsResponse
        : (bookingsResponse?.data || []);
      
      setAllBookings(rawBookings);

      // Định dạng 3 đơn đặt vé gần đây nhất
      const formattedRecent = rawBookings.slice(0, 3).map((b: any) => {
        const firstTicket = b.tickets?.[0];
        const showtime = firstTicket?.showtimeSeat?.showtime;
        const movie = showtime?.movie;
        const seatNames = b.tickets?.map((t: any) => {
          const s = t.showtimeSeat?.seat;
          return s ? `${s.rowName}${s.colIndex}` : 'Unknown';
        }).join(', ') || 'N/A';

        let showtimeStatus = 'Đã xem';
        const validStartTime = showtime?.startTime || showtime?.start_time || '';

        if (showtime && showtime.showDate && validStartTime) {
          let timeStr = validStartTime;
          if (Array.isArray(timeStr)) {
            timeStr = `${String(timeStr[0]).padStart(2, '0')}:${String(timeStr[1]).padStart(2, '0')}`;
          }
          const showStart = new Date(`${showtime.showDate}T${timeStr}`);
          if (showStart > new Date()) {
            showtimeStatus = 'Sắp chiếu';
          }
        }

        let displayTime = validStartTime;
        if (Array.isArray(displayTime)) {
          displayTime = `${String(displayTime[0]).padStart(2, '0')}:${String(displayTime[1]).padStart(2, '0')}`;
        } else if (typeof displayTime === 'string' && displayTime.length >= 5) {
          displayTime = displayTime.substring(0, 5);
        }

        return {
          movie: movie?.title || 'Phim đã ẩn',
          date: showtime?.showDate || '',
          time: displayTime,
          seats: seatNames,
          status: showtimeStatus
        };
      });

      setRecentBookings(formattedRecent);
    } catch (err: any) {
      console.error('Lỗi khi lấy thông tin tài khoản:', err);
      setError('Phiên làm việc đã hết hạn hoặc kết nối thất bại. Vui lòng đăng nhập lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchProfileAndBookings();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      let finalAvatarUrl = editForm.avatar;
      // Nếu người dùng chọn file ảnh mới
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await axiosClient.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }) as any;
        finalAvatarUrl = uploadRes?.data?.avatar ?? uploadRes?.avatar;
      }

      const payload = { ...editForm, avatar: finalAvatarUrl };
      const updateResponse = await axiosClient.put('/users/profile', payload) as any;
      const parsedUpdate = updateResponse?.data ?? updateResponse;

      if (parsedUpdate) {
        setProfile(parsedUpdate);
        setIsEditModalOpen(false);
        // Tải lại toàn bộ thông tin để đồng bộ điểm, hạng
        fetchProfileAndBookings();
        // Phát một event storage để các component khác như Header biết để cập nhật
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật profile:', err);
      alert('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-gray-600 font-medium">Đang tải thông tin tài khoản của bạn...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-600 font-bold text-xl mb-2">Đăng Nhập Thất Bại hoặc Hết Hạn</p>
        <p className="text-gray-500 text-sm mb-6 bg-red-50 p-3 rounded font-mono border border-red-100 max-w-md break-all">
          {error || "Vui lòng đăng nhập để xem thông tin tài khoản."}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Đến Trang Đăng Nhập
        </button>
      </div>
    );
  }

  const membershipColorMap: Record<string, string> = {
    Silver: 'from-gray-400 to-gray-600',
    Gold: 'from-amber-400 to-amber-600',
    Platinum: 'from-purple-500 to-indigo-600',
  };

  const membershipColor = membershipColorMap[profile.membershipLevel] || 'from-gray-400 to-gray-600';
  const nextTierPoints = 5000;
  const currentPoints = profile.points || 0;
  const progressPercent = Math.min((currentPoints / nextTierPoints) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-[#0a0a0a] dark:to-[#111111] transition-colors duration-500">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111111] dark:border dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8"
          >
            <div
              className={`bg-gradient-to-r ${membershipColor} h-48 relative bg-cover bg-center`}
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')" }}
            >
              <div className="absolute inset-0 bg-black/50"></div>
              <div className={`absolute inset-0 opacity-60 bg-gradient-to-r ${membershipColor} mix-blend-multiply`}></div>
            </div>

            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 text-red-600 font-bold text-4xl">
                        {profile.fullName ? profile.fullName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">{profile.fullName || profile.username}</h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`bg-gradient-to-r ${membershipColor} text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm`}>
                          {profile.membershipLevel} Member
                        </span>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="text-gray-500 text-sm flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Tham gia: {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN') : '01/01/2026'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa thông tin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Contact & Fast Info */}
            <div className="lg:col-span-1 space-y-6">

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-6 border border-orange-50 dark:border-gray-800"
              >
                <h2 className="font-bold text-xl text-gray-800 dark:text-white mb-5 border-b border-gray-100 dark:border-gray-800 pb-2">Thông tin liên hệ</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Email</p>
                      <p className="font-semibold text-gray-700 text-sm truncate">{profile.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                      <p className="font-semibold text-gray-700 text-sm">{profile.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Tên tài khoản</p>
                      <p className="font-semibold text-gray-700 text-sm">@{profile.username}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Reward Points */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 transform rotate-12">
                  <Gift className="w-36 h-36" />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">CinePoints</h2>
                  <Gift className="w-6 h-6 text-white/90" />
                </div>
                <div className="text-5xl font-black mb-2">
                  {currentPoints.toLocaleString('vi-VN')}
                </div>
                <p className="text-white/80 text-sm mb-4">Điểm tích lũy khả dụng</p>
                <button
                  onClick={() => navigate('/membership')}
                  className="w-full bg-white/20 hover:bg-white/30 active:scale-[0.98] transition-all backdrop-blur-sm text-white py-3 rounded-xl font-bold text-sm"
                >
                  Đổi Quà & Vouchers
                </button>
              </motion.div>

              {/* Quick Actions - Lưới tiện lợi */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-6 border border-orange-50 dark:border-gray-800"
              >
                <h2 className="font-bold text-xl text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Hành động nhanh</h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => navigate('/booking-history')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all group border border-gray-100 dark:border-gray-700 hover:border-red-200"
                  >
                    <Ticket className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Lịch sử</span>
                  </button>

                  <button
                    onClick={() => navigate('/membership')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-all group border border-gray-100 dark:border-gray-700 hover:border-orange-200"
                  >
                    <Award className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Đổi thưởng</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all group border border-gray-100 dark:border-gray-700 hover:border-red-200"
                  >
                    <LogOut className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-red-600 text-center">Đăng xuất</span>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats & History */}
            <div className="lg:col-span-2 space-y-6">

              {/* Stats Widgets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-4"
              >
                <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-5 border border-orange-50 dark:border-gray-800 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                    <Ticket className="w-8 h-8 text-red-600 mb-2 sm:mb-0" />
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{profile.ticketsCount || 0}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold">Vé đã đặt</p>
                </div>

                <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-5 border border-orange-50 dark:border-gray-800 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-orange-600 mb-2 sm:mb-0" />
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{profile.moviesCount || 0}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold">Phim đã xem</p>
                </div>

                <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-5 border border-orange-50 dark:border-gray-800 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                    <Award className="w-8 h-8 text-yellow-600 mb-2 sm:mb-0" />
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{profile.vouchersCount || 0}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold">Ưu đãi độc quyền</p>
                </div>
              </motion.div>

              {/* Badges & Achievements Showcase */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <AchievementsShowcase profile={profile} bookings={allBookings} />
              </motion.div>

              {/* Recent Bookings List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-6 border border-orange-50 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-black text-xl text-gray-800 dark:text-white">Giao dịch gần đây</h2>
                  <button
                    onClick={() => navigate('/booking-history')}
                    className="text-red-600 hover:text-red-700 font-bold text-sm transition-colors"
                  >
                    Xem tất cả lịch sử
                  </button>
                </div>

                <div className="space-y-4">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50/50 to-yellow-50/30 hover:from-orange-50 hover:to-yellow-50 rounded-2xl border border-orange-100/50 transition-all"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate mb-1">{booking.movie}</h3>
                          <p className="text-xs text-gray-500 font-medium mb-2">
                            {new Date(booking.date).toLocaleDateString('vi-VN')} • {booking.time.substring(0, 5)} • Ghế {booking.seats}
                          </p>
                          <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold ${booking.status === 'Sắp chiếu'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm font-semibold">Bạn chưa có đơn đặt vé nào.</p>
                      <button
                        onClick={() => navigate('/')}
                        className="mt-3 text-red-600 hover:text-red-700 font-bold text-sm"
                      >
                        Mua vé phim ngay ➜
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Membership Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#111111] rounded-2xl shadow-lg p-6 border border-orange-50 dark:border-gray-800"
              >
                <h2 className="font-bold text-xl text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Tiến trình thành viên</h2>

                {profile.membershipLevel === 'Platinum' ? (
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
                    <Award className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-purple-900 text-sm">Hạng thành viên tối đa (Platinum)</h4>
                      <p className="text-xs text-purple-700">Chúc mừng bạn đã đạt cấp độ cao nhất! Tận hưởng những đặc quyền VIP tại rạp.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 font-medium">
                        Điểm lên hạng tiếp theo: <strong className="text-gray-900">{profile.membershipLevel === 'Silver' ? 'Gold' : 'Platinum'}</strong>
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        {currentPoints} / {profile.membershipLevel === 'Silver' ? '1,000' : '3,000'}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${profile.membershipLevel === 'Silver' ? (currentPoints / 1000) * 100 : (currentPoints / 3000) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p>
                        Bạn cần thêm{' '}
                        <strong className="text-red-600">
                          {profile.membershipLevel === 'Silver'
                            ? Math.max(1000 - currentPoints, 0).toLocaleString('vi-VN')
                            : Math.max(3000 - currentPoints, 0).toLocaleString('vi-VN')} điểm
                        </strong>{' '}
                        để thăng hạng thành viên. Tích lũy điểm khi mua vé hoặc bắp nước tại CineVerse.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowGame(true)}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                      >
                        🍿 Chơi Game Hứng Bắp
                      </button>

                      <button
                        onClick={() => setShowLevelUp(true)}
                        className="flex-1 py-3 border-2 border-dashed border-orange-300 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors text-sm"
                      >
                        🧪 Test Thăng Hạng
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Saved Payment Methods Simulation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SavedPaymentMethods />
              </motion.div>

            </div>
          </div>

        </div>
      </div>

      <CatchPopcornGame
        isOpen={showGame}
        onClose={() => setShowGame(false)}
        onWin={(coins) => {
          alert(`Chúc mừng! Bạn nhận được ${coins} CineCoins!`);
          setShowGame(false);
        }}
      />

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel="Platinum"
        pointsEarned={5000}
      />

      {/* Edit Profile Modal Dialog */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) {
                  setIsEditModalOpen(false);
                  setAvatarFile(null);
                  setAvatarPreview(profile?.avatar || '');
                }
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            ></motion.div>

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-gray-100"
            >

              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Chỉnh sửa thông tin</h3>
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setAvatarFile(null);
                    setAvatarPreview(profile?.avatar || '');
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và Tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      disabled={isSubmitting}
                      required
                      placeholder="Nhập họ tên đầy đủ"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email cá nhân</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={isSubmitting}
                      required
                      placeholder="email@example.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={isSubmitting}
                      required
                      placeholder="0987xxxxxx"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện (Tùy chọn)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors text-sm font-semibold text-gray-600">
                        <Camera className="w-5 h-5" />
                        <span>Tải ảnh từ máy</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          disabled={isSubmitting}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setAvatarFile(null);
                      setAvatarPreview(profile?.avatar || '');
                    }}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
