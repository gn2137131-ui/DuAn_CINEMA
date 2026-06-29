import React, { useState, useEffect } from 'react';
import { Search, Printer, CheckCircle, Clock, MapPin, XCircle, Film, Calendar, Hash, Ticket, User, QrCode, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
export function TicketScanner() {
  const [orderCode, setOrderCode] = useState('');
  const [bookingInfo, setBookingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          setOrderCode(decodedText);
          toast.success('Quét mã QR thành công!');
          searchBooking(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [isScanning]);

  const searchBooking = async (codeToSearch) => {
    if (!codeToSearch.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng!');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.get(`/bookings/code/${codeToSearch}`);
      setBookingInfo(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Không tìm thấy đơn hàng hoặc mã không hợp lệ!');
      setBookingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchBooking(orderCode);
  };

  const handlePrint = async () => {
    if (!bookingInfo) return;

    try {
      await axiosClient.put(`/bookings/code/${bookingInfo.bookingCode}/print`);
      toast.success('Xác nhận thành công! Đang in vé...');
      const updated = { ...bookingInfo, status: 'PRINTED' };
      setBookingInfo(updated);
      // Mở cửa sổ in sau khi API xác nhận thành công
      printTicketToPDF(updated);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || 'Không thể in vé. Vui lòng thử lại!');
    }
  };

  const printTicketToPDF = (info) => {
    const seats = info.seats?.map(s => s.name || s.seatNumber).filter(Boolean).join(', ') || 'Không có dữ liệu';
    const movieTitle = info.movie?.title || 'Không rõ';
    const showDate = info.showtime?.date || '';
    const showTime = info.showtime?.time || '';
    const room = info.showtime?.theater || 'Không rõ';
    const format = info.showtime?.format || '2D';
    const customerName = info.customerInfo?.name || 'Khách vãng lai';
    const customerPhone = info.customerInfo?.phone || 'Không có';
    const customerEmail = info.customerInfo?.email || 'Không có';
    const totalAmount = info.totalAmount?.toLocaleString('vi-VN') + ' đ' || '0 đ';
    const seatCount = info.seats?.length || 0;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>VÉ XEM PHIM - ${info.bookingCode}</title>
        <style>
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            padding: 20px;
          }
          .ticket {
            width: 520px;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }
          .ticket-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            padding: 24px;
            color: white;
            text-align: center;
          }
          .cinema-name {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 4px;
            text-transform: uppercase;
            background: linear-gradient(to right, #e94560, #f5a623);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .cinema-sub {
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .movie-section {
            background: linear-gradient(135deg, #e94560, #c62a47);
            padding: 20px 24px;
            color: white;
          }
          .movie-title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 6px;
          }
          .format-badge {
            display: inline-block;
            background: rgba(255,255,255,0.25);
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }
          .info-item {
            padding: 14px 20px;
            border-bottom: 1px solid #f0f0f0;
            border-right: 1px solid #f0f0f0;
          }
          .info-item:nth-child(even) { border-right: none; }
          .info-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
          }
          .seat-section {
            padding: 16px 24px;
            background: #fffbeb;
            border-top: 2px dashed #fcd34d;
            border-bottom: 2px dashed #fcd34d;
            margin: 0;
          }
          .seat-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #92400e;
            margin-bottom: 6px;
          }
          .seat-value {
            font-size: 22px;
            font-weight: 900;
            color: #78350f;
            letter-spacing: 2px;
          }
          .seat-count {
            font-size: 12px;
            color: #a16207;
            margin-top: 2px;
          }
          .customer-section {
            padding: 14px 24px;
            border-bottom: 1px solid #f0f0f0;
          }
          .customer-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 8px;
          }
          .customer-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 13px;
            color: #374151;
          }
          .total-section {
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
          }
          .total-amount {
            font-size: 22px;
            font-weight: 900;
            color: #e94560;
          }
          .ticket-footer {
            background: #1a1a2e;
            padding: 16px 24px;
            text-align: center;
          }
          .code-label {
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .code-value {
            font-size: 18px;
            font-weight: 900;
            font-family: monospace;
            letter-spacing: 4px;
            color: #f5a623;
          }
          .printed-badge {
            display: inline-block;
            margin-top: 8px;
            background: rgba(34,197,94,0.2);
            color: #4ade80;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
          }
          .barcode-area {
            margin: 8px auto 0;
            height: 40px;
            background: repeating-linear-gradient(
              to right,
              #fff 0px,
              #fff 2px,
              #1a1a2e 2px,
              #1a1a2e 4px
            );
            width: 200px;
            border-radius: 2px;
          }
          @media print {
            body { background: white; padding: 0; }
            .ticket { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <div class="cinema-name">CineVerse</div>
            <div class="cinema-sub">Cinema Ticket</div>
          </div>

          <div class="movie-section">
            <div class="movie-title">${movieTitle}</div>
            <span class="format-badge">${format}</span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📅 Ngày chiếu</div>
              <div class="info-value">${showDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏰ Giờ chiếu</div>
              <div class="info-value">${showTime}</div>
            </div>
            <div class="info-item" style="border-bottom: none;">
              <div class="info-label">🏛️ Phòng</div>
              <div class="info-value">${room}</div>
            </div>
            <div class="info-item" style="border-bottom: none;">
              <div class="info-label">🎟️ Số vé</div>
              <div class="info-value">${seatCount} vé</div>
            </div>
          </div>

          <div class="seat-section">
            <div class="seat-label">🪑 Ghế đã đặt</div>
            <div class="seat-value">${seats}</div>
            <div class="seat-count">${seatCount} ghế</div>
          </div>

          <div class="customer-section">
            <div class="customer-title">👤 Thông tin khách hàng</div>
            <div class="customer-info">
              <span><strong>${customerName}</strong></span>
              <span>📞 ${customerPhone}</span>
              <span>✉️ ${customerEmail}</span>
            </div>
          </div>

          <div class="total-section">
            <span class="total-label">Tổng thanh toán</span>
            <span class="total-amount">${totalAmount}</span>
          </div>

          <div class="ticket-footer">
            <div class="code-label">Mã đơn hàng</div>
            <div class="code-value">${info.bookingCode}</div>
            <div class="barcode-area"></div>
            <div class="printed-badge">✓ ĐÃ XÁC NHẬN & IN VÉ</div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"><CheckCircle size={14} /> Đã thanh toán</span>;
      case 'PENDING':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"><Clock size={14} /> Chờ thanh toán</span>;
      case 'PRINTED':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"><Printer size={14} /> Đã in vé</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{status}</span>;
    }
  };

  return (
    <div className="admin-page p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-2xl border border-slate-800">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <QrCode className="text-blue-400 w-8 h-8" />
              Soát vé & In vé
            </h2>
            <p className="text-slate-400">Nhập mã đơn hàng hoặc quét mã QR từ khách hàng để kiểm tra và in vé cứng.</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Nhập mã đơn (VD: CINE-123)"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase placeholder:normal-case font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? 'Đang tìm...' : 'Tìm vé'}
            </button>
            <button
              type="button"
              onClick={() => setIsScanning(!isScanning)}
              className={`px-5 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border shrink-0 ${
                isScanning 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isScanning ? <><X size={20} /> Đóng Camera</> : <><QrCode size={20} /> Quét QR</>}
            </button>
          </form>
        </div>

        {isScanning && (
          <div className="mt-8 relative z-10 bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden max-w-sm mx-auto border border-slate-700 shadow-2xl">
            <div id="qr-reader" className="w-full [&>div]:!border-none"></div>
            <div className="p-3 text-center text-sm text-slate-400 bg-slate-800/80 border-t border-slate-700">
              Hãy đưa mã QR vào khung hình
            </div>
          </div>
        )}
      </div>

      {bookingInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột thông tin vé */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Thông tin suất chiếu</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Hash size={14} /> Mã đơn: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{bookingInfo.bookingCode}</span>
                  </p>
                </div>
                {getStatusBadge(bookingInfo.status)}
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                {bookingInfo.movie?.posterUrl ? (
                  <img src={bookingInfo.movie.posterUrl} alt={bookingInfo.movie.title} className="w-32 sm:w-40 h-48 sm:h-60 object-cover rounded-xl shadow-md shrink-0" />
                ) : (
                  <div className="w-32 sm:w-40 h-48 sm:h-60 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                    <Film size={40} />
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-between gap-5 min-w-0">
                  <div>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 truncate">{bookingInfo.movie?.title || 'Đang cập nhật'}</h4>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full text-xs font-bold tracking-wider">{bookingInfo.showtime?.format || '2D'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Calendar size={16} /> Suất chiếu
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white">{bookingInfo.showtime?.date} • {bookingInfo.showtime?.time}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <MapPin size={16} /> Phòng chiếu
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white truncate">{bookingInfo.showtime?.theater || 'Đang cập nhật'}</div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Ticket className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Ghế đã đặt ({bookingInfo.seats?.length || 0})</div>
                      <div className="font-black text-orange-900 dark:text-orange-100 text-lg tracking-wide break-words">
                        {bookingInfo.seats?.map(s => s.name || s.seatNumber).filter(Boolean).join(', ') || 'Không có dữ liệu ghế'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột thao tác & Khách hàng */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Printer size={20} className="text-blue-500" /> Hành động
              </h3>

              <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Tổng tiền thanh toán</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {bookingInfo.totalAmount?.toLocaleString('vi-VN')} <span className="text-xl text-slate-500">đ</span>
                </div>
              </div>

              {bookingInfo.status === 'PAID' ? (
                <button
                  onClick={handlePrint}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                  <Printer size={20} />
                  Xác nhận & In vé
                </button>
              ) : bookingInfo.status === 'PRINTED' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-sm text-blue-700 dark:text-blue-400 text-center flex items-center justify-center gap-2 font-medium">
                    <CheckCircle size={18} />
                    Đơn hàng này đã được in vé.
                  </div>
                  <button
                    onClick={() => printTicketToPDF(bookingInfo)}
                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded-xl font-bold flex justify-center items-center gap-2 transition-all"
                  >
                    <Printer size={18} />
                    In lại vé (Bản sao)
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 text-center border border-slate-200 dark:border-slate-700">
                  Chỉ có thể in vé với đơn hàng <strong className="text-slate-700 dark:text-slate-300">Đã thanh toán (PAID)</strong>.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <User size={20} className="text-indigo-500" />
                Thông tin khách hàng
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ tên</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{bookingInfo.customerInfo?.name || 'Khách vãng lai'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{bookingInfo.customerInfo?.phone || 'Không có'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{bookingInfo.customerInfo?.email || 'Không có'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketScanner;
