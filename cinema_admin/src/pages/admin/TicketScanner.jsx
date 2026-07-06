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
        return <span className="badge badge-green"><CheckCircle size={14} /> Đã thanh toán</span>;
      case 'PENDING':
        return <span className="badge badge-yellow"><Clock size={14} /> Chờ thanh toán</span>;
      case 'PRINTED':
        return <span className="badge badge-blue"><Printer size={14} /> Đã in vé</span>;
      case 'CANCELLED':
        return <span className="badge badge-red"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="admin-page">
      {/* Header & Search */}
      <div className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        {/* Decor */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', background: 'var(--accent-info)', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.15', transform: 'translate(50%, -50%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '256px', height: '256px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.15', transform: 'translate(-50%, 50%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="flex items-start justify-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="page-title flex items-center gap-3" style={{ fontSize: '1.75rem' }}>
                <QrCode style={{ width: '32px', height: '32px', color: 'var(--accent-info)' }} />
                Soát vé & In vé
              </h2>
              <p className="page-subtitle">Nhập mã đơn hàng hoặc quét mã QR từ khách hàng để kiểm tra và in vé cứng.</p>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="search-wrap" style={{ width: '320px' }}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Nhập mã đơn (VD: CINE-123)"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '38px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? 'Đang tìm...' : 'Tìm vé'}
              </button>
              <button
                type="button"
                onClick={() => setIsScanning(!isScanning)}
                className={`btn btn-lg ${isScanning ? 'btn-danger' : 'btn-secondary'}`}
              >
                {isScanning ? <><X size={20} /> Đóng Camera</> : <><QrCode size={20} /> Quét QR</>}
              </button>
            </form>
          </div>

          {isScanning && (
            <div className="card" style={{ maxWidth: '400px', margin: '0 auto', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
              <div id="qr-reader" className="w-full" style={{ '--div-border': 'none' }}></div>
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Hãy đưa mã QR vào khung hình
              </div>
            </div>
          )}
        </div>
      </div>

      {bookingInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Cột thông tin vé */}
          <div className="flex flex-col gap-6">
            <div className="card card-pad">
              <div className="flex items-start justify-between mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Thông tin suất chiếu</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={14} /> Mã đơn: <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>{bookingInfo.bookingCode}</span>
                  </p>
                </div>
                {getStatusBadge(bookingInfo.status)}
              </div>

              <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                {bookingInfo.movie?.posterUrl ? (
                  <img src={bookingInfo.movie.posterUrl} alt={bookingInfo.movie.title} className="poster-card" style={{ width: '128px', height: '192px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div className="poster-card" style={{ width: '128px', height: '192px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Film size={40} />
                  </div>
                )}
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  <div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingInfo.movie?.title || 'Đang cập nhật'}</h4>
                    <span className="badge badge-blue">{bookingInfo.showtime?.format || '2D'}</span>
                  </div>

                  <div className="grid-2">
                    <div className="stat-card" style={{ flexDirection: 'column', gap: '4px', padding: '16px' }}>
                      <div className="flex items-center gap-2 stat-label" style={{ textTransform: 'none' }}>
                        <Calendar size={16} /> Suất chiếu
                      </div>
                      <div className="stat-value" style={{ fontSize: '1rem' }}>{bookingInfo.showtime?.date} • {bookingInfo.showtime?.time}</div>
                    </div>
                    <div className="stat-card" style={{ flexDirection: 'column', gap: '4px', padding: '16px' }}>
                      <div className="flex items-center gap-2 stat-label" style={{ textTransform: 'none' }}>
                        <MapPin size={16} /> Phòng chiếu
                      </div>
                      <div className="stat-value" style={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookingInfo.showtime?.theater || 'Đang cập nhật'}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                    <Ticket style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--accent-warning)', fontWeight: '500', marginBottom: '4px' }}>Ghế đã đặt ({bookingInfo.seats?.length || 0})</div>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.125rem', wordBreak: 'break-word' }}>
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
            <div className="card card-pad">
              <h3 className="card-head" style={{ margin: '-24px -24px 16px -24px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
                <div className="flex items-center gap-2">
                  <Printer size={20} style={{ color: 'var(--accent-info)' }} /> Hành động
                </div>
              </h3>

              <div className="stat-card" style={{ flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                <div className="stat-label">Tổng tiền thanh toán</div>
                <div className="stat-value">
                  {bookingInfo.totalAmount?.toLocaleString('vi-VN')} <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>đ</span>
                </div>
              </div>

              {bookingInfo.status === 'PAID' ? (
                <button
                  onClick={handlePrint}
                  className="btn btn-success btn-lg"
                  style={{ width: '100%', fontSize: '1rem', padding: '16px 24px' }}
                >
                  <Printer size={20} />
                  Xác nhận & In vé
                </button>
              ) : bookingInfo.status === 'PRINTED' ? (
                <div className="flex flex-col gap-3">
                  <div className="card" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
                    <div className="flex items-center justify-center gap-2" style={{ fontSize: '0.875rem', color: 'var(--accent-info)' }}>
                      <CheckCircle size={18} />
                      Đơn hàng này đã được in vé.
                    </div>
                  </div>
                  <button
                    onClick={() => printTicketToPDF(bookingInfo)}
                    className="btn btn-secondary btn-lg"
                    style={{ width: '100%' }}
                  >
                    <Printer size={18} />
                    In lại vé (Bản sao)
                  </button>
                </div>
              ) : (
                <div className="card" style={{ padding: '16px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Chỉ có thể in vé với đơn hàng <strong style={{ color: 'var(--text-primary)' }}>Đã thanh toán (PAID)</strong>.
                </div>
              )}
            </div>

            <div className="card card-pad">
              <h3 className="card-head" style={{ margin: '-24px -24px 16px -24px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
                <div className="flex items-center gap-2">
                  <User size={20} style={{ color: '#6366f1' }} />
                  Thông tin khách hàng
                </div>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex flex-col gap-1">
                  <span className="stat-label">Họ tên</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{bookingInfo.customerInfo?.name || 'Khách vãng lai'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="stat-label">Số điện thoại</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{bookingInfo.customerInfo?.phone || 'Không có'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="stat-label">Email</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookingInfo.customerInfo?.email || 'Không có'}</span>
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
