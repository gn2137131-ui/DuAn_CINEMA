import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Film, Popcorn, ShoppingCart, CheckCircle, X, ChevronRight, ChevronLeft, CreditCard, Banknote, Smartphone, Printer, User, Phone, Check } from 'lucide-react';

export default function POS() {
  const [movies, setMovies] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [concessions, setConcessions] = useState([]);
  const [combos, setCombos] = useState([]);
  const [comboQuantities, setComboQuantities] = useState({});

  const [step, setStep] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Date filter state (Default to today)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Checkout states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bookingResult, setBookingResult] = useState(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  useEffect(() => {
    fetchMoviesAndShowtimes();
    fetchConcessions();
  }, []);

  const fetchMoviesAndShowtimes = async () => {
    try {
      const [moviesRes, showtimesRes] = await Promise.all([
        axiosClient.get('/movies'),
        axiosClient.get('/showtimes')
      ]);
      setMovies(moviesRes.data);
      
      const st = showtimesRes.data;
      st.sort((a, b) => {
        const dateA = new Date(`${a.showDate}T${a.startTime}`);
        const dateB = new Date(`${b.showDate}T${b.startTime}`);
        return dateA - dateB;
      });
      setAllShowtimes(st);
    } catch (e) {
      toast.error('Lỗi tải dữ liệu');
    }
  };

  const fetchConcessions = async () => {
    try {
      const [snacksRes, combosRes] = await Promise.all([
        axiosClient.get('/snacks/snacks'),
        axiosClient.get('/snacks/combos')
      ]);
      setConcessions(snacksRes.data.map(c => ({ ...c, quantity: 0 })));
      setCombos(combosRes.data);
    } catch (err) {
      toast.error('Lỗi tải bắp nước');
    }
  };

  const handleComboChange = (comboId, delta) => {
    setComboQuantities(prev => {
      const current = prev[comboId] || 0;
      const newQty = Math.max(0, current + delta);
      return { ...prev, [comboId]: newQty };
    });
  };

  const getShowtimesForMovieAndDate = (movieId, date) => {
    return allShowtimes.filter(s => 
      (s.movie?.id === movieId || s.movieId === movieId) && 
      s.showDate === date
    ).sort((a, b) => {
      const timeA = a.startTime || a.start_time || '00:00';
      const timeB = b.startTime || b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  const selectShowtime = async (movie, showtime) => {
    setSelectedMovie(movie);
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setStep(2);
    setLoadingSeats(true);
    try {
      const res = await axiosClient.get(`/showtime-seats/showtime/${showtime.id}`);
      
      const formattedSeats = res.data.map(ss => {
        const seatObj = ss.seat || {};
        let currentStatus = 'available';
        if (ss.status === 2 || ss.status === 3) currentStatus = 'taken';

        let currentType = 'standard';
        const backendType = String(seatObj.seatType || 'STANDARD').toLowerCase();
        if (backendType === 'vip') currentType = 'vip';
        if (backendType === 'couple') currentType = 'couple';
        if (backendType === 'reserved') currentStatus = 'taken';
        if (backendType === 'broken') currentStatus = 'taken';

        const basePrice = showtime.basePrice || 50000;
        const finalPrice = currentType === 'couple' ? basePrice * 2 : basePrice;

        return {
          id: ss.id,
          seatId: seatObj.id,
          row: seatObj.rowName || 'A',
          number: seatObj.colIndex || 1,
          type: currentType,
          status: currentStatus,
          price: finalPrice,
          seatNumber: seatObj.rowName + seatObj.colIndex
        };
      });

      setSeats(formattedSeats);
    } catch (err) {
      toast.error('Lỗi tải sơ đồ ghế');
      setStep(1);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'taken') return;
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const handleConcessionChange = (id, delta) => {
    setConcessions(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    try {
      setIsCheckingVoucher(true);
      const res = await axiosClient.get(`/discount-codes/validate/${voucherCode.trim().toUpperCase()}`);
      setAppliedVoucher(res.data || res);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (err) {
      toast.error(err.response?.data || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      setAppliedVoucher(null);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const individualFoods = concessions
        .filter(c => c.quantity > 0)
        .map(c => ({ concessionId: c.id, quantity: c.quantity }));

      const comboFoods = [];
      Object.entries(comboQuantities).forEach(([comboId, qty]) => {
        if (qty > 0) {
          const combo = combos.find(c => c.id === Number(comboId));
          if (combo) {
            if (combo.popcorn) {
              const idx = comboFoods.findIndex(f => f.concessionId === combo.popcorn.id);
              if (idx >= 0) comboFoods[idx].quantity += combo.popcornCount * qty;
              else comboFoods.push({ concessionId: combo.popcorn.id, quantity: combo.popcornCount * qty });
            }
            if (combo.drink) {
              const idx = comboFoods.findIndex(f => f.concessionId === combo.drink.id);
              if (idx >= 0) comboFoods[idx].quantity += combo.drinkCount * qty;
              else comboFoods.push({ concessionId: combo.drink.id, quantity: combo.drinkCount * qty });
            }
          }
        }
      });

      const bookingFoods = [...individualFoods];
      comboFoods.forEach(cf => {
        const existing = bookingFoods.find(f => f.concessionId === cf.concessionId);
        if (existing) existing.quantity += cf.quantity;
        else bookingFoods.push(cf);
      });

      const createRes = await axiosClient.post('/bookings/create', {
        showtimeSeatIds: selectedSeats.map(s => s.id),
        bookingFoods,
        customerInfo: {
          name: customerName || 'Khách vãng lai',
          email: 'guest@cinema.com',
          phone: customerPhone || '0000000000'
        },
        discountCode: appliedVoucher ? appliedVoucher.code : null,
        discountType: appliedVoucher ? appliedVoucher.type : null
      });

      const bookingId = createRes.data.id;
      const orderCode = createRes.data.orderCode;

      await axiosClient.put(`/bookings/${bookingId}/confirm`);

      toast.success('Thanh toán thành công!');
      
      setBookingResult({ orderCode, id: bookingId });
      setStep(5);
      // Removed automatic printTicket(orderCode) here to prevent popup blocker / browser freeze
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || 'Có lỗi xảy ra khi tạo đơn hàng!');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPOS = () => {
    setStep(1);
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setConcessions(prev => prev.map(c => ({ ...c, quantity: 0 })));
    setCombos([]);
    setComboQuantities({});
    setCustomerName('');
    setCustomerPhone('');
    setVoucherCode('');
    setAppliedVoucher(null);
    setPaymentMethod('cash');
    setBookingResult(null);
  };

  const printTicket = async (orderCode) => {
    try {
      await axiosClient.put(`/bookings/code/${orderCode}/print`);
      const res = await axiosClient.get(`/bookings/code/${orderCode}`);
      const info = res.data;
      
      const seatsStr = info.seats?.map(s => s.seatNumber).filter(Boolean).join(', ') || 'Không rõ';
      const movieTitle = info.movie?.title || 'Không rõ';
      const showDate = info.showtime?.date || '';
      const showTime = info.showtime?.time || '';
      const room = info.showtime?.theater || 'Không rõ';
      const totalAmount = info.totalAmount?.toLocaleString('vi-VN') + ' đ' || '0 đ';
      
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>VÉ MÁY POS - ${info.bookingCode}</title>
            <style>
              body { font-family: monospace; text-align: center; padding: 20px; }
              .ticket { border: 2px dashed #000; padding: 20px; max-width: 300px; margin: 0 auto; }
              h2 { margin: 0 0 10px; font-size: 24px; }
              .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
              .info { text-align: left; font-size: 14px; line-height: 1.5; }
              .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <h2>CINEVERSE</h2>
              <p style="margin:0;font-size:12px;">Vé Bán Tại Quầy</p>
              <div class="divider"></div>
              <div class="info">
                <strong>Phim:</strong> ${movieTitle}<br/>
                <strong>Ngày:</strong> ${showDate} - ${showTime}<br/>
                <strong>Rạp:</strong> ${room}<br/>
                <strong>Ghế:</strong> ${seatsStr}<br/>
              </div>
              <div class="divider"></div>
              <div class="total">Tổng tiền: ${totalAmount}</div>
              <div class="divider"></div>
              <p style="margin:0;font-size:12px;">Mã đơn: ${info.bookingCode}</p>
              <p style="margin:0;font-size:12px;">Cảm ơn quý khách!</p>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Không thể in vé tự động:', err);
    }
  };

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const totalTickets = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const totalCombos = concessions.reduce((sum, c) => sum + (c.price * c.quantity), 0)
    + combos.reduce((sum, c) => sum + (c.price * ((comboQuantities[c.id] || 0))), 0);
  const subtotal = totalTickets + totalCombos;
  
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'PERCENT' || appliedVoucher.type === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedVoucher.value) / 100;
    } else {
      discountAmount = appliedVoucher.value;
    }
  }
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Generate next 7 days for date selector
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      display: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
    };
  });

  const renderStep1 = () => (
    <div className="max-w-5xl">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-black text-[var(--text-primary)] m-0">Chọn suất chiếu</h2>
        <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1 gap-1 overflow-x-auto max-w-[500px] custom-scrollbar">
          {nextDays.map(day => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                selectedDate === day.date
                  ? 'bg-[var(--accent-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
              }`}
            >
              {day.display}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
         {movies.map(movie => {
            const mShowtimes = getShowtimesForMovieAndDate(movie.id, selectedDate);
            if (mShowtimes.length === 0) return null;
            return (
               <div key={movie.id} className="flex gap-5 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border)] shadow-lg hover:border-[var(--accent-primary)] transition-colors">
                  <img src={movie.posterUrl || movie.poster_url} alt="" className="w-20 h-28 object-cover rounded-lg shadow-sm" />
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-lg font-black m-0 mb-1 text-[var(--text-primary)]">{movie.title}</h3>
                           <p className="m-0 text-sm text-[var(--text-secondary)] font-medium">{movie.genre || 'Hành động'} • {movie.duration || 120} phút</p>
                        </div>
                        <div className="font-extrabold text-[var(--text-primary)] text-sm bg-[var(--bg-elevated)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                          {mShowtimes[0]?.basePrice?.toLocaleString() || '100,000'}đ / vé
                        </div>
                     </div>
                     
                     <div className="mt-4 flex gap-2.5 flex-wrap">
                        {mShowtimes.map(st => (
                           <button
                             key={st.id}
                             onClick={() => selectShowtime(movie, st)}
                             className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] cursor-pointer font-bold text-sm text-[var(--text-primary)] transition-all hover:bg-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:text-white"
                           >
                             {st.startTime || st.start_time}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            );
         })}
         {movies.every(movie => getShowtimesForMovieAndDate(movie.id, selectedDate).length === 0) && (
           <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] border-dashed">
             <p className="text-[var(--text-muted)] font-bold text-lg">Không có suất chiếu nào vào ngày này</p>
             <p className="text-[var(--text-secondary)] text-sm mt-2">Vui lòng chọn ngày khác ở bộ lọc phía trên</p>
           </div>
         )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    return (
      <div className="flex flex-col min-h-full">
         <h2 className="text-lg font-black mb-3 text-[var(--text-primary)]">Chọn ghế — {selectedMovie?.title} <span className="text-[var(--text-muted)] font-medium mx-1">•</span> {selectedShowtime?.startTime}</h2>
         
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col items-center shadow-lg relative">
            {loadingSeats ? (
               <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-bold">Đang tải sơ đồ...</div>
            ) : (
               <>
                   {/* Màn hình */}
                   <div className="w-full max-w-lg mb-6 relative">
                      <div className="h-2 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--accent-info)] to-[var(--bg-surface)] opacity-50 w-full rounded-t-full shadow-[0_-5px_15px_rgba(14,165,233,0.3)]"></div>
                      <p className="text-center text-[var(--accent-info)] opacity-70 text-[0.65rem] font-black uppercase tracking-[0.3em] mt-2">Màn hình</p>
                   </div>

                  {/* Sơ đồ ghế */}
                   <div className="flex flex-col gap-1.5">
                      {Object.keys(groupedSeats).sort().map(row => (
                         <div key={row} className="flex items-center gap-2">
                            <div className="w-5 text-center font-bold text-[var(--text-muted)] text-xs">{row}</div>
                            <div className="flex gap-1.5">
                               {groupedSeats[row].sort((a,b)=>a.number-b.number).map(seat => {
                                   let seatClasses = "h-7 rounded-md flex items-center justify-center text-[0.7rem] font-bold transition-all ";
                                   seatClasses += seat.type === 'couple' ? 'w-[60px] ' : 'w-7 ';
                                  
                                  if (seat.status === 'taken') {
                                      seatClasses += "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-50";
                                  } else if (selectedSeats.find(s=>s.id===seat.id)) {
                                      seatClasses += "bg-[var(--accent-warning)] text-white border border-[var(--accent-warning)] shadow-[var(--shadow-glow-orange)] transform scale-105";
                                  } else if (seat.type === 'vip') {
                                      seatClasses += "bg-[rgba(245,158,11,0.1)] text-[var(--accent-warning)] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.2)] cursor-pointer";
                                  } else if (seat.type === 'couple') {
                                      seatClasses += "bg-[rgba(236,72,153,0.1)] text-[#ec4899] border border-[rgba(236,72,153,0.3)] hover:bg-[rgba(236,72,153,0.2)] cursor-pointer";
                                  } else {
                                      seatClasses += "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-base)] hover:border-slate-500 cursor-pointer";
                                  }

                                  return (
                                    <button
                                       key={seat.id} onClick={() => handleSeatClick(seat)}
                                       className={seatClasses}
                                    >
                                       {seat.number}
                                    </button>
                                  );
                              })}
                           </div>
                           <div className="w-6"></div>
                        </div>
                     ))}
                  </div>

                  {/* Legend */}
                   <div className="mt-6 flex gap-4 bg-[var(--bg-elevated)] px-4 py-2 rounded-full border border-[var(--border)]">
                      <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded"></div><span className="text-[0.6rem] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Thường</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded"></div><span className="text-[0.6rem] text-[var(--text-secondary)] font-bold uppercase tracking-wider">VIP</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[var(--accent-warning)] border border-[var(--accent-warning)] rounded"></div><span className="text-[0.6rem] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Chọn</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded opacity-50"></div><span className="text-[0.6rem] text-[var(--text-muted)] font-bold uppercase tracking-wider">Đã bán</span></div>
                   </div>
               </>
            )}
         </div>

         {/* Footer Navigation */}
         <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] font-bold cursor-pointer flex items-center gap-2 text-[var(--text-primary)] text-sm hover:bg-[var(--bg-surface)] transition-colors"><ChevronLeft size={16}/> Quay lại</button>
            <button onClick={() => { if(selectedSeats.length===0) toast.error('Vui lòng chọn ít nhất 1 ghế'); else setStep(3); }} className="px-6 py-2.5 rounded-xl border-none bg-gradient-to-r from-orange-500 to-red-500 text-white font-black cursor-pointer flex items-center gap-2 shadow-[var(--shadow-glow-orange)] hover:from-orange-400 hover:to-red-400 transition-colors hover:-translate-y-0.5 transform text-sm">Tiếp theo <ChevronRight size={16}/></button>
         </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const hasCombos = combos.length > 0;
    const activeCombos = combos.filter(c => comboQuantities[c.id]);

    return (
    <div className="flex flex-col h-full">
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-[var(--text-primary)] m-0">Combo & Đồ ăn</h2>
          <span className="text-[var(--text-muted)] text-sm font-medium">Tùy chọn — có thể bỏ qua</span>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5">
          {hasCombos && (
            <div>
              <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">Combo</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {combos.map(combo => {
                  const qty = comboQuantities[combo.id] || 0;
                  return (
                    <div key={combo.id} className={`bg-[var(--bg-surface)] rounded-xl border p-4 flex flex-col transition-all shadow ${qty > 0 ? 'border-[var(--accent-warning)] bg-[rgba(245,158,11,0.05)]' : 'border-[var(--border)]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black">C</div>
                        <h3 className="text-base font-black text-[var(--text-primary)] m-0">{combo.name}</h3>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] m-0 mb-3 flex-1 leading-relaxed">
                        {combo.popcorn && `${combo.popcornCount}x ${combo.popcorn.name}`}
                        {combo.popcorn && combo.drink && ' + '}
                        {combo.drink && `${combo.drinkCount}x ${combo.drink.name}`}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-base text-[var(--text-primary)]">{combo.price.toLocaleString()}đ</span>
                        {qty === 0 ? (
                          <button onClick={() => handleComboChange(combo.id, 1)} className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer flex items-center justify-center hover:bg-[var(--accent-warning)] hover:text-white hover:border-[var(--accent-warning)] transition-colors text-lg font-bold">+</button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)]">
                            <button onClick={() => handleComboChange(combo.id, -1)} className="w-7 h-7 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer flex items-center justify-center text-[var(--text-primary)] hover:bg-slate-700 transition-colors font-bold text-base leading-none pb-0.5">-</button>
                            <span className="font-bold w-5 text-center text-sm text-[var(--text-primary)]">{qty}</span>
                            <button onClick={() => handleComboChange(combo.id, 1)} className="w-7 h-7 rounded-full bg-[var(--accent-warning)] text-white border-none cursor-pointer flex items-center justify-center shadow-[var(--shadow-glow-orange)] font-bold text-base leading-none pb-0.5">+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">Đồ uống & Bắp</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {concessions.map(c => (
                <div key={c.id} className={`bg-[var(--bg-surface)] rounded-xl border p-4 flex flex-col transition-all shadow ${c.quantity > 0 ? 'border-[var(--accent-warning)] bg-[rgba(245,158,11,0.05)]' : 'border-[var(--border)]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${c.category === 'DRINK' ? 'bg-[rgba(59,130,246,0.1)] text-blue-400' : 'bg-[rgba(245,158,11,0.1)] text-[var(--accent-warning)]'}`}>
                      {c.category === 'DRINK' ? 'N' : 'B'}
                    </div>
                    <h3 className="text-base font-black text-[var(--text-primary)] m-0">{c.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] m-0 mb-3 flex-1 leading-relaxed">{c.description || (c.category === 'DRINK' ? 'Nước giải khát' : 'Bắp rang bơ')}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-base text-[var(--text-primary)]">{c.price.toLocaleString()}đ</span>
                    {c.quantity === 0 ? (
                      <button onClick={() => handleConcessionChange(c.id, 1)} className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer flex items-center justify-center hover:bg-[var(--accent-warning)] hover:text-white hover:border-[var(--accent-warning)] transition-colors text-lg font-bold">+</button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)]">
                        <button onClick={() => handleConcessionChange(c.id, -1)} className="w-7 h-7 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer flex items-center justify-center text-[var(--text-primary)] hover:bg-slate-700 transition-colors font-bold text-base leading-none pb-0.5">-</button>
                        <span className="font-bold w-5 text-center text-sm text-[var(--text-primary)]">{c.quantity}</span>
                        <button onClick={() => handleConcessionChange(c.id, 1)} className="w-7 h-7 rounded-full bg-[var(--accent-warning)] text-white border-none cursor-pointer flex items-center justify-center shadow-[var(--shadow-glow-orange)] font-bold text-base leading-none pb-0.5">+</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
       </div>

       <div className="mt-4 flex justify-between">
          <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] font-bold cursor-pointer flex items-center gap-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"><ChevronLeft size={16}/> Quay lại</button>
          <button onClick={() => setStep(4)} className="px-6 py-2.5 rounded-xl border-none bg-gradient-to-r from-orange-500 to-red-500 text-white font-black cursor-pointer flex items-center gap-2 text-sm shadow-[var(--shadow-glow-orange)] hover:from-orange-400 hover:to-red-400 transition-colors hover:-translate-y-0.5 transform">Tiếp theo <ChevronRight size={16}/></button>
       </div>
    </div>
    );
  };

  const renderStep4 = () => (
    <div className="flex flex-col h-full">
       <h2 className="text-2xl font-black mb-6 text-[var(--text-primary)]">Thanh toán</h2>
       
       <div className="flex-1 flex flex-col gap-6 max-w-3xl">
          <div className="bg-[var(--bg-surface)] p-7 rounded-2xl border border-[var(--border)] shadow-lg">
             <h4 className="text-[1.05rem] font-black text-[var(--text-primary)] mb-4">Thông tin khách hàng <span className="font-medium text-[var(--text-muted)]">(tùy chọn)</span></h4>
             <div className="flex gap-4">
                <div className="flex-1 relative">
                   <User size={18} className="absolute left-4 top-3.5 text-[var(--text-muted)]" />
                   <input type="text" placeholder="Tên khách hàng" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium" />
                </div>
                <div className="flex-1 relative">
                   <Phone size={18} className="absolute left-4 top-3.5 text-[var(--text-muted)]" />
                   <input type="text" placeholder="Số điện thoại" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium" />
                </div>
             </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-7 rounded-2xl border border-[var(--border)] shadow-lg">
             <h4 className="text-[1.05rem] font-black text-[var(--text-primary)] mb-4">Mã khuyến mãi</h4>
             {appliedVoucher ? (
                <div className="flex items-center justify-between bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] px-5 py-4 rounded-xl">
                   <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-[0.95rem]">
                      <CheckCircle size={20} /> Đã áp dụng mã: {appliedVoucher.code}
                   </div>
                   <button onClick={() => setAppliedVoucher(null)} className="border-none bg-transparent cursor-pointer text-emerald-400 hover:text-emerald-300 transition-colors"><X size={20}/></button>
                </div>
             ) : (
                <div className="flex gap-3">
                   <input type="text" placeholder="Nhập mã (VD: CINEMA10)" value={voucherCode} onChange={e=>setVoucherCode(e.target.value.toUpperCase())} className="flex-1 px-5 py-3.5 rounded-xl border border-[var(--border)] text-[0.95rem] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:font-medium placeholder:normal-case placeholder:text-[var(--text-muted)]" />
                   <button onClick={applyVoucher} disabled={isCheckingVoucher || !voucherCode} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-colors shadow-sm">Áp dụng</button>
                </div>
             )}
          </div>

          <div className="bg-[var(--bg-surface)] p-7 rounded-2xl border border-[var(--border)] shadow-lg">
             <h4 className="text-[1.05rem] font-black text-[var(--text-primary)] mb-4">Phương thức thanh toán</h4>
             <div className="flex flex-col gap-3">
                {[
                   { id: 'cash', label: 'Tiền mặt', sub: 'Thanh toán tại quầy', icon: Banknote },
                   { id: 'card', label: 'Thẻ ngân hàng', sub: 'Visa / MasterCard / ATM', icon: CreditCard },
                   { id: 'ewallet', label: 'Ví điện tử', sub: 'MoMo / ZaloPay / VNPay', icon: Smartphone }
                ].map(method => (
                   <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.05)]' : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-slate-500'}`}>
                      <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer" />
                      <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg text-[var(--text-secondary)] border border-[var(--border)]"><method.icon size={24} /></div>
                      <div>
                         <div className="font-black text-[var(--text-primary)] text-[0.95rem]">{method.label}</div>
                         <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">{method.sub}</div>
                      </div>
                   </label>
                ))}
             </div>
          </div>
       </div>

       <div className="mt-auto pt-6 flex justify-between">
          <button onClick={() => setStep(3)} className="px-6 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] font-bold cursor-pointer flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"><ChevronLeft size={18}/> Quay lại</button>
          <button onClick={handleCheckout} disabled={isProcessing} className="px-8 py-3.5 rounded-xl border-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black cursor-pointer flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-colors hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
             {isProcessing ? 'Đang xử lý...' : 'Hoàn tất thanh toán'} <CheckCircle size={20}/>
          </button>
       </div>
    </div>
  );

  const renderStep5 = () => {
    if (!bookingResult) return null;
    return (
      <div className="flex flex-col min-h-full items-center pt-5 pb-10">
         <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-700 pb-4">
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-8 text-center text-white relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:20px_20px]"></div>
               <h2 className="m-0 mb-3 text-2xl flex items-center justify-center gap-2.5 font-black relative z-10"><Film size={24} className="text-orange-400"/> Cine Admin</h2>
               <div className="text-sm opacity-80 uppercase tracking-[0.2em] font-bold relative z-10">Hóa đơn bán vé</div>
               <div className="text-xs opacity-60 mt-2 relative z-10">#{bookingResult.orderCode}</div>
            </div>
            <div className="p-7 text-slate-900">
               <div className="flex justify-between mb-3 text-[0.95rem]">
                  <span className="text-slate-500 font-medium">Khách hàng</span>
                  <span className="font-black">{customerName || 'Khách vãng lai'}</span>
               </div>
               {customerPhone && (
                 <div className="flex justify-between mb-5 text-[0.95rem]">
                    <span className="text-slate-500 font-medium">SĐT</span>
                    <span className="font-black">{customerPhone}</span>
                 </div>
               )}
               <div className="border-t border-dashed border-slate-300 my-5"></div>
               <div className="mb-5">
                  <div className="font-black text-xl mb-1.5">{selectedMovie?.title}</div>
                  <div className="flex justify-between text-sm text-slate-500 font-medium">
                     <span>{selectedShowtime?.showDate} • {selectedShowtime?.startTime || selectedShowtime?.start_time}</span>
                     <span>Phòng {selectedShowtime?.room?.name}</span>
                  </div>
               </div>
               <div className="flex justify-between mb-4 text-[0.95rem]">
                  <span className="text-slate-500 font-medium">Ghế ({selectedSeats.length})</span>
                  <span className="font-black">{selectedSeats.map(s=>s.seatNumber).join(', ')}</span>
               </div>
               {concessions.some(c=>c.quantity>0) && (
                 <div className="flex justify-between mb-4 text-[0.95rem] items-start">
                    <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Bắp nước</span>
                    <span className="font-black text-right">{concessions.filter(c=>c.quantity>0).map(c=>`${c.quantity}x ${c.name}`).join(', ')}</span>
                 </div>
               )}
               <div className="border-t border-dashed border-slate-300 my-5"></div>
               <div className="flex justify-between mb-3 text-[1.35rem] font-black items-end">
                  <span>TỔNG CỘNG</span>
                  <span className="text-red-600">{finalTotal.toLocaleString()}đ</span>
               </div>
               <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Thanh toán</span>
                  <span>{paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ ngân hàng' : 'Ví điện tử'}</span>
               </div>
  
               <div className="mt-10 text-center flex flex-col items-center">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-[0.2em] font-bold">Mã vé</div>
                  <div className="text-xl font-black tracking-[0.2em]">{bookingResult.orderCode}</div>
                  {/* Barcode mockup */}
                  <div className="h-12 w-full max-w-[280px] bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_4px,#0f172a_4px,#0f172a_6px,transparent_6px,transparent_10px,#0f172a_10px,#0f172a_14px,transparent_14px,transparent_16px)] mt-4 opacity-90"></div>
               </div>
            </div>
         </div>
  
         <div className="flex gap-4 mt-8">
            <button onClick={() => printTicket(bookingResult.orderCode)} className="px-7 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] font-black cursor-pointer flex items-center gap-2.5 text-[var(--text-primary)] text-[0.95rem] hover:bg-[var(--bg-elevated)] transition-all shadow-sm">
               <Printer size={20}/> In hóa đơn
            </button>
            <button onClick={resetPOS} className="px-9 py-3.5 rounded-xl border-none bg-gradient-to-r from-orange-500 to-red-500 text-white font-black cursor-pointer flex items-center gap-2.5 text-[0.95rem] shadow-[var(--shadow-glow-orange)] hover:from-orange-400 hover:to-red-400 transition-all hover:-translate-y-0.5 transform">
               Bán vé mới
            </button>
         </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--bg-base)] -m-6 font-sans text-[var(--text-primary)]">
       {/* LEFT COLUMN: CART */}
       <div className="w-[360px] min-w-[360px] bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col z-10 shadow-lg">
          <div className="p-6 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--bg-surface)]">
             <ShoppingCart size={24} className="text-[var(--accent-warning)]" />
             <h2 className="text-xl font-black text-[var(--text-primary)] m-0 tracking-tight">Đơn hàng</h2>
          </div>
  
          <div className="custom-scrollbar p-6 flex-1 overflow-y-auto">
             {/* Movie Info */}
             {selectedShowtime && (
               <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-4 rounded-2xl mb-6 shadow-sm">
                  <div className="flex items-center gap-2.5 font-black mb-2 text-[var(--text-primary)] text-[0.95rem]">
                     <Film size={18} className="text-[var(--accent-primary)]"/> {selectedMovie?.title}
                  </div>
                  <div className="text-[0.85rem] text-[var(--text-secondary)] flex flex-col gap-1.5 pl-7 font-medium">
                     <span>Hôm nay {selectedShowtime.showDate} • {selectedShowtime.startTime || selectedShowtime.start_time}</span>
                     <span className="text-[var(--accent-info)]">Phòng {selectedShowtime.room?.name || selectedShowtime.room}</span>
                  </div>
               </div>
             )}
  
             {/* Seats */}
             {selectedSeats.length > 0 && (
               <div className="mb-6">
                  <div className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-3 tracking-[0.1em]">Ghế đã chọn</div>
                  {selectedSeats.map(s => (
                    <div key={s.id} className="flex justify-between items-center mb-3 text-[0.9rem] text-[var(--text-primary)]">
                      <span className="flex items-center font-bold">
                        <span className={`border px-2 py-0.5 rounded text-[0.65rem] mr-2.5 font-black tracking-wider ${s.type==='vip'?'bg-[rgba(245,158,11,0.1)] text-[var(--accent-warning)] border-[rgba(245,158,11,0.3)]': s.type==='couple'?'bg-[rgba(236,72,153,0.1)] text-pink-500 border-pink-500/30' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'}`}>
                          {s.type === 'vip' ? 'VIP' : s.type==='couple'?'CPL':'STD'}
                        </span> 
                        Ghế {s.seatNumber}
                      </span>
                      <span className="font-black text-[var(--accent-warning)]">{s.price.toLocaleString()}đ</span>
                    </div>
                  ))}
               </div>
             )}
  
              {/* Combos */}
              {Object.values(comboQuantities).some(q => q > 0) && combos.length > 0 && (
                 <div className="mb-6">
                   <div className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-3 tracking-[0.1em]">Combo</div>
                   {combos.filter(c => comboQuantities[c.id] > 0).map(c => (
                     <div key={c.id} className="flex justify-between items-center mb-3 text-[0.9rem] text-[var(--text-primary)]">
                       <span className="font-bold"><span className="font-black text-[var(--accent-warning)] mr-2">{comboQuantities[c.id]}x</span> {c.name}</span>
                       <span className="font-black">{(c.price * comboQuantities[c.id]).toLocaleString()}đ</span>
                     </div>
                   ))}
                 </div>
              )}

              {/* Concessions */}
              {concessions.some(c => c.quantity > 0) && (
                 <div className="mb-6">
                   <div className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-3 tracking-[0.1em]">Bắp & Nước</div>
                   {concessions.filter(c => c.quantity > 0).map(c => (
                     <div key={c.id} className="flex justify-between items-center mb-3 text-[0.9rem] text-[var(--text-primary)]">
                       <span className="font-bold"><span className="font-black text-[var(--accent-warning)] mr-2">{c.quantity}x</span> {c.name}</span>
                       <span className="font-black">{(c.price * c.quantity).toLocaleString()}đ</span>
                     </div>
                   ))}
                 </div>
              )}
          </div>
  
          {/* Cart Footer */}
          <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-surface)]">
             <div className="flex justify-between mb-3 text-[0.9rem] text-[var(--text-secondary)] font-medium">
                <span>Vé ({selectedSeats.length} ghế)</span>
                <span className="font-black text-[var(--text-primary)]">{totalTickets.toLocaleString()}đ</span>
             </div>
              <div className="flex justify-between mb-3 text-[0.9rem] text-[var(--text-secondary)] font-medium">
                 <span>Đồ ăn ({concessions.reduce((s,c)=>s+c.quantity, 0) + Object.values(comboQuantities).reduce((s,v)=>s+v, 0)})</span>
                 <span className="font-black text-[var(--text-primary)]">{totalCombos.toLocaleString()}đ</span>
              </div>
             {appliedVoucher && (
               <div className="flex justify-between mb-3 text-[0.9rem] text-emerald-400 font-bold">
                  <span>Giảm giá ({appliedVoucher.code})</span>
                  <span className="font-black">-{discountAmount.toLocaleString()}đ</span>
               </div>
             )}
             <div className="border-t border-[var(--border)] my-4"></div>
             <div className="flex justify-between items-end">
                <span className="font-black text-[var(--text-secondary)] text-base">Tổng cộng</span>
                <span className="text-2xl font-black text-[var(--accent-warning)] tracking-tight">{finalTotal.toLocaleString()}đ</span>
             </div>
          </div>
       </div>
  
       {/* RIGHT COLUMN: WIZARD */}
       <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)]">
          {/* Stepper Header */}
          <div className="flex items-center px-10 py-6 border-b border-[var(--border)] bg-[var(--bg-surface)] shadow-sm z-10">
             {[
                { id: 1, label: 'Suất chiếu' },
                { id: 2, label: 'Chọn ghế' },
                { id: 3, label: 'Combo' },
                { id: 4, label: 'Thanh toán' },
                { id: 5, label: 'Hóa đơn' }
             ].map((s, idx) => (
                <React.Fragment key={s.id}>
                   <div className={`flex items-center gap-2.5 transition-colors ${step === s.id ? 'text-[var(--accent-warning)] font-black' : (step > s.id ? 'text-emerald-500 font-bold' : 'text-[var(--text-muted)] font-bold')}`}>
                      {step > s.id ? (
                         <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20"><Check size={16} strokeWidth={3}/></div>
                      ) : (
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.8rem] font-black ${step === s.id ? 'bg-[var(--accent-warning)] text-white shadow-[var(--shadow-glow-orange)]' : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'}`}>{s.id}</div>
                      )}
                      <span>{s.label}</span>
                   </div>
                   {idx < 4 && <ChevronRight size={18} className="text-[var(--border)] mx-5" />}
                </React.Fragment>
             ))}
          </div>
  
          {/* Main Content Area */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-10">
             {step === 1 && renderStep1()}
             {step === 2 && renderStep2()}
             {step === 3 && renderStep3()}
             {step === 4 && renderStep4()}
             {step === 5 && renderStep5()}
          </div>
       </div>
    </div>
  );
}
