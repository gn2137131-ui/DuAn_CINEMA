import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Wallet, ShoppingBag, Plus, Minus, Tag, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentMethods, { PAYMENT_LABELS } from '../components/PaymentMethods';
import axiosClient from '../api/axiosClient';
import * as QRCode from 'react-qr-code';

interface SnackDisplayItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'combo' | 'popcorn' | 'drink' | 'snack';
}

interface DiscountCode {
  id: number;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  expirationDate?: string;
  maxUsage?: number;
  usedCount?: number;
  active: boolean;
}

export default function Checkout() {
  interface QrInfo {
    bookingId: number;
    amount: number;
    qrUrl?: string;
    qrData?: string;
    orderCode?: string;
    description?: string;
  }

  const [qrInfo, setQrInfo] = useState<QrInfo | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, showtime, seats, totalPrice } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      toast.error('Đã hết thời gian giữ ghế. Giao dịch bị hủy!');
      navigate('/');
    }
  }, [timeLeft, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!user || !token) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán!');
      navigate('/login');
    }
  }, [navigate]);

  const [allItems, setAllItems] = useState<SnackDisplayItem[]>([]);
  const [isSnacksLoading, setIsSnacksLoading] = useState(true);

  const [selectedCombos, setSelectedCombos] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('international_card');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // State quản lý Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<DiscountCode | null>(null);
  const [publicVouchers, setPublicVouchers] = useState<DiscountCode[]>([]); // Danh sách mã gợi ý
  const [voucherError, setVoucherError] = useState('');
  const [isVoucherValidating, setIsVoucherValidating] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'combo' | 'popcorn' | 'drink'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Khai báo state
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  // Định nghĩa kiểu dữ liệu cho Ghế dựa trên cấu trúc bạn đang có
  interface Seat {
    id: number | string;
    status: string;
    // Thêm các thuộc tính khác nếu trong dữ liệu của bạn có (ví dụ: row, column)
  }
  useEffect(() => {
    const fetchSnackData = async () => {
      setIsSnacksLoading(true);
      let items: SnackDisplayItem[] = [];

      // Do axiosClient interceptor của bạn trả thẳng về response.data, 
      // nên kết quả await chính là mảng dữ liệu thật. Mình dùng `|| []` để đề phòng rỗng.

      // 1. Lấy dữ liệu Combo
      try {
        const combosRes: any = await axiosClient.get('/snacks/combos');
        const comboList = Array.isArray(combosRes) ? combosRes : (combosRes?.data || []);
        const mappedCombos = comboList.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || 'Combo tiện lợi, tiết kiệm hơn',
          price: c.price,
          category: 'combo',
          image: c.image || 'https://images.unsplash.com/photo-1731004270604-78999bfc0bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        }));
        items = [...items, ...mappedCombos];
      } catch (err) {
        console.error('Lỗi tải danh sách combos:', err);
      }

      // 2. Lấy dữ liệu Nước Uống
      try {
        const drinksRes: any = await axiosClient.get('/snacks/drinks');
        const drinkList = Array.isArray(drinksRes) ? drinksRes : (drinksRes?.data || []);
        const mappedDrinks = drinkList.map((d: any) => ({
          id: d.id,
          name: d.name + (d.size ? ` (${d.size})` : ''),
          description: d.description || 'Thức uống mát lạnh mát lòng',
          price: d.price,
          category: 'drink',
          image: d.image || 'https://images.unsplash.com/photo-1554866585-cd94860890b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        }));
        items = [...items, ...mappedDrinks];
      } catch (err) {
        console.error('Lỗi tải danh sách nước uống:', err);
      }

      // 3. Lấy dữ liệu Bắp Rang
      try {
        const popcornsRes: any = await axiosClient.get('/snacks/popcorns');
        const popcornList = Array.isArray(popcornsRes) ? popcornsRes : (popcornsRes?.data || []);
        const mappedPopcorns = popcornList.map((p: any) => ({
          id: p.id,
          name: p.name + (p.size ? ` (${p.size})` : ''),
          description: p.description || 'Bắp rang bơ nóng hổi thơm ngon',
          price: p.price,
          category: 'popcorn',
          image: p.image || 'https://images.unsplash.com/photo-1731004270604-78999bfc0bf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        }));
        items = [...items, ...mappedPopcorns];
      } catch (err) {
        console.error('Lỗi tải danh sách bắp rang:', err);
      }

      // 4. Lấy dữ liệu Mã giảm giá công khai
      try {
        const discountCodesRes: any = await axiosClient.get('/discount-codes/public');
        const discountCodesList = Array.isArray(discountCodesRes) ? discountCodesRes : (discountCodesRes?.data || []);
        setPublicVouchers(discountCodesList);
      } catch (err) {
        console.error('Lỗi tải danh sách mã giảm giá công khai:', err);
      }

      setAllItems(items);
      setIsSnacksLoading(false);
    };

    fetchSnackData();
  }, []);


  useEffect(() => {
    if (!isChecking || !qrInfo?.bookingId) return;

    // Build absolute backend URL for SSE so dev server proxy issues don't route to Vite
    const backendBase = (axiosClient && axiosClient.defaults && typeof axiosClient.defaults.baseURL === 'string' && axiosClient.defaults.baseURL)
      ? String(axiosClient.defaults.baseURL).replace(/\/+$/, '')
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');

    const eventSourceUrl = `${backendBase}/notifications/subscribe/${qrInfo.bookingId}`;
    console.log('SSE connecting to', eventSourceUrl);

    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onopen = () => console.log('SSE Connected to:', eventSourceUrl);

    eventSource.addEventListener('payment-success', (event) => {
      console.log('Thanh toán thành công nhận được từ Backend!');
      setIsChecking(false);
      navigate(`/confirmation?bookingId=${qrInfo.bookingId}`);
      try { eventSource.close(); } catch(e) { }
    });

    eventSource.onerror = (err) => {
      console.error('SSE Connection Failed:', err, 'url=', eventSourceUrl);
      // Chỉ set error nếu chưa thanh toán thành công
      setNotificationError(`Mất kết nối với máy chủ thanh toán (${eventSourceUrl}). Vui lòng kiểm tra lại đơn hàng trong mục Lịch sử.`);
      try { eventSource.close(); } catch(e) { }
    };

    return () => { try { eventSource.close(); } catch(e) { } };
  }, [isChecking, qrInfo, navigate]);

  if (!movie || !showtime || !seats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Không có thông tin đặt vé</h1>
          <button onClick={() => navigate('/')} className="text-red-600 mt-4 inline-block font-semibold hover:underline">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const updateComboQuantity = (itemKey: string, change: number) => {
    setSelectedCombos(prev => {
      const current = prev[itemKey] || 0;
      const newValue = Math.max(0, current + change);
      if (newValue === 0) {
        const { [itemKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemKey]: newValue };
    });
  };

  const [usePoints, setUsePoints] = useState(false);
  const userPoints = 50000; // Demo points

  const comboTotal = Object.entries(selectedCombos).reduce((sum, [itemKey, quantity]) => {
    const item = allItems.find(i => `${i.category}-${i.id}` === itemKey);
    return sum + (item?.price || 0) * quantity;
  }, 0);

  const subtotal = totalPrice + comboTotal;

  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type.toUpperCase() === 'PERCENTAGE' || appliedVoucher.type.toUpperCase() === 'PERCENT') {
      discount = (subtotal * appliedVoucher.value) / 100;
    } else {
      discount = appliedVoucher.value;
    }
  }

  const pointDiscount = usePoints ? Math.min(userPoints, subtotal - discount) : 0;
  const grandTotal = Math.max(0, subtotal - discount - pointDiscount);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setIsVoucherValidating(true);
      setVoucherError('');

      // axiosClient trả về data trực tiếp
      const response: any = await axiosClient.get(`/discount-codes/validate/${encodeURIComponent(voucherCode.trim())}`);

      setAppliedVoucher(response);
      setVoucherError('');
    } catch (err: any) {
      setAppliedVoucher(null);
      if (err.response?.status === 404) {
        setVoucherError('Mã giảm giá không tồn tại hoặc đã bị tắt.');
      } else if (err.response?.status === 400) {
        setVoucherError('Mã giảm giá đã hết hạn hoặc không đủ điều kiện.');
      } else {
        setVoucherError('Không thể kiểm tra mã giảm giá vào lúc này.');
      }
    } finally {
      setIsVoucherValidating(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };


  const filteredCombos = selectedCategory === 'all'
    ? allItems
    : allItems.filter(c => c.category === selectedCategory);

  const handlePayment = async () => {
    // Seats are already held when selected on the seat map page.
    try {
      setIsLoading(true);
      setError(null);

      const seatIds = (seats as any[]).map(s => Number(s.id));

      // Seats are already held when selected on the seat map page.
      // Here we only submit the booking request using held showtimeSeat IDs.
      const bookingPayload = {
        showtimeSeatIds: seatIds,
        bookingFoods: [],
        customerInfo: {
          name: customerInfo.name || 'Khách hàng',
          email: customerInfo.email || 'email@test.com',
          phone: customerInfo.phone || '0987456776'
        },
        discountCode: appliedVoucher ? appliedVoucher.code : null,
        discountType: appliedVoucher ? appliedVoucher.type : null
      };

      console.log('PAYLOAD SẮP GỬI:', JSON.stringify(bookingPayload));

      // Chỉ giữ lại đoạn logic xử lý sau khi API trả về thành công
      const response: any = await axiosClient.post('/bookings/create', bookingPayload);
      console.log("Dữ liệu Backend trả về:", response);

      const booking = response.data || response;

      if (booking && booking.id) {
        // 1. Lưu thông tin QR vào state
        setQrInfo({ bookingId: booking.id, amount: grandTotal });

        // 2. Gọi API backend để lấy SePay QR Code
        try {
          const qrResponse: any = await axiosClient.get(`/bookings/${booking.id}/qr-payment`);
          console.log("QR Response từ Backend:", qrResponse);

          const qrData = qrResponse.data || qrResponse;

          if (qrData && (qrData.qrUrl || qrData.qrData)) {
            const url = qrData.qrUrl || qrData.qrData;
            setQrUrl(url);
            setQrInfo({
              bookingId: booking.id,
              amount: grandTotal,
              qrUrl: qrData.qrUrl,
              qrData: qrData.qrData,
              orderCode: qrData.orderCode,
              description: qrData.description,
            });
            console.log("QR Code URL:", url);
            console.log("Nội dung thanh toán:", qrData.description);
          } else {
            console.error("Lỗi: Server không trả về QR URL");
            setError("Lỗi tạo mã QR, vui lòng thử lại!");
          }
        } catch (qrErr: any) {
          console.error('Lỗi lấy QR code:', qrErr?.response?.data || qrErr.message);
          setError("Lỗi tạo mã QR: " + (qrErr?.response?.data?.message || qrErr.message));
        }

        // 3. Kích hoạt chế độ kiểm tra thanh toán qua SSE
        setIsChecking(true);
      } else {
        console.error("Lỗi: Server không trả về ID đơn hàng");
        setError("Lỗi tạo đơn hàng, vui lòng thử lại!");
      }
    } catch (err: any) {
      console.error('LỖI CHI TIẾT TỪ BACKEND:', err?.response?.data || err.message);
      setError(typeof err === 'string' ? err : (err?.response?.data || err.message || 'Đã xảy ra lỗi'));
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          
          <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border-2 border-orange-100 flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm hidden sm:inline">Thời gian giữ ghế:</span>
            <div className={`font-mono text-xl font-bold flex items-center gap-1 ${timeLeft < 180 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái */}
          <div className="lg:col-span-2 space-y-6">

            {/* THÔNG TIN KHÁCH HÀNG */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Thông Tin Khách Hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Nhập email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>
            </motion.div>

            {/* CHỌN ĐỒ ĂN */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold">Chọn Đồ Ăn & Nước Uống</h2>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'combo', label: 'Combo' },
                  { value: 'popcorn', label: 'Bỏng' },
                  { value: 'drink', label: 'Nước' },
                ].map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value as any)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.value
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {isSnacksLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    <p className="text-sm font-medium">Đang tải thực đơn rạp...</p>
                  </div>
                ) : filteredCombos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">Không tìm thấy sản phẩm phù hợp.</div>
                ) : (
                  filteredCombos.map(item => {
                    const itemKey = `${item.category}-${item.id}`;
                    return (
                      // SỬA CẤU TRÚC FLEX BỌC NGOÀI
                      <div key={itemKey} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-orange-300 transition-colors">

                        {/* Nhóm Ảnh và Chữ (Luôn nằm ngang) */}
                        <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                          <ImageWithFallback src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-bold text-base sm:text-lg leading-tight">{item.name}</h3>
                            {/* Dùng line-clamp-2 thay vì truncate-2-lines để CSS chuẩn Tailwind */}
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2 line-clamp-2">{item.description}</p>
                            <p className="font-semibold text-red-600">{item.price.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>

                        {/* Nhóm Nút Tăng/Giảm (Rớt xuống dưới và canh phải trên Mobile, ngang hàng trên PC) */}
                        <div className="flex items-center justify-end gap-3 sm:flex-shrink-0 mt-2 sm:mt-0">
                          <button onClick={() => updateComboQuantity(itemKey, -1)} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{selectedCombos[itemKey] || 0}</span>
                          <button onClick={() => updateComboQuantity(itemKey, 1)} className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* SỬ DỤNG ĐIỂM CINECOIN */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold font-serif text-lg">C</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Sử dụng điểm CineCoin</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bạn đang có <span className="font-bold text-yellow-600">{userPoints.toLocaleString('vi-VN')} điểm</span></p>
                </div>
              </div>
              
              <button 
                onClick={() => setUsePoints(!usePoints)}
                className={`w-14 h-8 rounded-full p-1 transition-colors relative ${usePoints ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <div className={`w-6 h-6 bg-white dark:bg-slate-900 rounded-full shadow-md transition-transform transform ${usePoints ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </motion.div>

            {/* MÃ GIẢM GIÁ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Tag className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold">Mã Giảm Giá</h2>
              </div>

              {appliedVoucher ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-900">{appliedVoucher.code}</span>
                      </div>
                      <p className="text-sm text-green-800">{appliedVoucher.description || 'Áp dụng thành công mã ưu đãi phim.'}</p>
                      <p className="text-sm font-semibold text-green-900 mt-2">
                        Giảm {appliedVoucher.type.toUpperCase() === 'PERCENT' ? `${appliedVoucher.value}%` : `${appliedVoucher.value.toLocaleString('vi-VN')}đ`}
                      </p>
                    </div>
                    <button onClick={removeVoucher} className="text-green-600 hover:text-green-700">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã ưu đãi của bạn"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                    />
                    <button onClick={applyVoucher} disabled={isVoucherValidating} className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50">
                      {isVoucherValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Áp dụng'}
                    </button>
                  </div>

                  {voucherError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                      <XCircle className="w-4 h-4" />
                      {voucherError}
                    </div>
                  )}

                  {/* Hiển thị danh sách Voucher Công Khai */}
                  {publicVouchers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Mã giảm giá khả dụng:</p>
                      <div className="space-y-2">
                        {publicVouchers.map(v => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setVoucherCode(v.code);
                              setVoucherError('');
                            }}
                            className="w-full text-left p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg hover:border-orange-400 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-red-700">{v.code}</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {v.description || `Giảm ${v.type === 'PERCENTAGE' ? v.value + '%' : v.value.toLocaleString('vi-VN') + 'đ'}`}
                                </p>
                              </div>
                              <Tag className="w-5 h-5 text-orange-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Phương Thức Thanh Toán</h2>
              <PaymentMethods
                selectedMethod={paymentMethod}
                onSelect={setPaymentMethod}
                amount={grandTotal}
              />
            </motion.div>
          </div>

          {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Thông Tin Đơn Hàng</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{movie.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{showtime.theater}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{showtime.date} - {showtime.time}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{showtime.format}</p>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Ghế đã chọn: {seats.map((s: any) => s.id).join(', ')}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tiền vé phim:</span>
                    <span className="font-semibold">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {Object.keys(selectedCombos).length > 0 && (
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                    <p className="font-semibold mb-2">Bắp nước đã chọn:</p>
                    {Object.entries(selectedCombos).map(([itemKey, quantity]) => {
                      const item = allItems.find(i => `${i.category}-${i.id}` === itemKey);
                      return (
                        <div key={itemKey} className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{item?.name} x{quantity}</span>
                          <span className="font-semibold">{((item?.price || 0) * quantity).toLocaleString('vi-VN')}đ</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {qrUrl && (
                  <div className="mt-6 border-t-2 border-dashed border-red-200 pt-6">
                    <div className="bg-gradient-to-b from-white to-orange-50 p-6 rounded-2xl text-center border border-red-100 shadow-[0_0_20px_rgba(220,38,38,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
                      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {paymentMethod === 'saved_card' 
                          ? 'Mô Phỏng Thẻ Liên Kết' 
                          : (isChecking ? 'Đang chờ thanh toán...' : 'Quét mã để thanh toán')}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-2">
                        {paymentMethod === 'saved_card'
                          ? 'Bạn đã chọn thẻ liên kết. Vì đây là mô phỏng, vui lòng quét mã MB Bank (tài khoản thực) bên dưới để hoàn tất thanh toán thật.'
                          : (isChecking
                              ? 'Vui lòng quét mã trên ứng dụng ngân hàng. Trang sẽ tự động chuyển khi thành công.'
                              : 'Quý khách vui lòng quét mã để hoàn tất đơn hàng.')}
                      </p>

                      <div className="bg-white dark:bg-slate-900 p-3 border-2 border-dashed border-red-200 rounded-xl inline-block mx-auto">
                        <img
                          src={qrUrl}
                          alt="QR Thanh toán"
                          className="w-48 h-auto object-contain mix-blend-multiply"
                        />
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nội dung chuyển khoản:</p>
                        <p className="font-mono font-bold text-lg text-red-600 tracking-wider bg-red-50 py-2 rounded-lg break-all px-2">
                          {qrInfo?.description || qrInfo?.orderCode || `DH${qrInfo?.bookingId}`}
                        </p>
                      </div>

                      {notificationError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                          {notificationError}
                        </div>
                      )}

                      <button
                        onClick={() => { setQrUrl(null); setIsChecking(false); setNotificationError(null); }}
                        className="mt-4 w-full py-2.5 text-gray-600 dark:text-gray-400 font-semibold hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Đổi phương thức thanh toán
                      </button>
                    </div>
                  </div>
                )}
                <div className="border-t-2 border-gray-200 dark:border-slate-700 pt-4">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-2">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {appliedVoucher && discount > 0 && (
                    <div className="flex justify-between text-green-600 mb-2">
                      <span>Giảm giá ({appliedVoucher.code}):</span>
                      <span className="font-semibold">-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  {usePoints && pointDiscount > 0 && (
                    <div className="flex justify-between text-yellow-600 mb-2">
                      <span>Sử dụng CineCoin:</span>
                      <span className="font-semibold">-{pointDiscount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <span className="font-bold text-lg">Tổng cộng:</span>
                    <span className="font-bold text-2xl text-red-600">{grandTotal.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {paymentMethod && (
                    <div className="flex items-center justify-between mb-4 bg-orange-50 rounded-xl px-3 py-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Thanh toán qua</span>
                      <span className="font-bold text-orange-700">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isLoading || isSnacksLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tạo đơn đặt vé...
                      </>
                    ) : (
                      'Thanh Toán Ngay'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}