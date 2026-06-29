import { X, Loader2, CalendarClock, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';

export function AddShowtime({ isOpen, onClose, onRefresh }) {
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTime, setNewTime] = useState('');

  const [formData, setFormData] = useState({
    movieId: '',
    showDate: '',
    roomId: '',
    selectedTimes: [],
    format: '2D',
    basePrice: 56000   // Thêm trường giá vé mặc định
  });

  // 1. Tải danh sách Phim và Phòng
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [movieRes, roomRes] = await Promise.all([
            axiosClient.get('/movies'),
            axiosClient.get('/rooms')
          ]);
          setMovies(movieRes.data);
          setRooms(roomRes.data);
        } catch (err) {
          console.error("Lỗi khi tải dữ liệu bổ trợ:", err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
      setFormData({ movieId: '', showDate: '', roomId: '', selectedTimes: [], format: '2D', basePrice: 56000 });
      setAvailableSlots([]);
      setNewTime('');
    }
  }, [isOpen]);

  // 2. Lấy khung giờ trống
  useEffect(() => {
    if (formData.roomId && formData.showDate && formData.movieId) {
      const fetchAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const selectedMovie = movies.find(m => m.id === Number(formData.movieId));
          const duration = selectedMovie?.duration || 120;

          const res = await axiosClient.get('/showtimes/available', {
            params: {
              roomId: formData.roomId,
              date: formData.showDate,
              duration: duration
            }
          });
          setAvailableSlots(res.data);
        } catch (err) {
          console.error("Lỗi khi lấy khung giờ trống:", err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.roomId, formData.showDate, formData.movieId, movies]);

  if (!isOpen) return null;

  // 3. Xử lý Checkbox
  const handleTimeCheckboxChange = (startTime) => {
    const isSelected = formData.selectedTimes.includes(startTime);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedTimes: formData.selectedTimes.filter(t => t !== startTime)
      });
    } else {
      setFormData({
        ...formData,
        selectedTimes: [...formData.selectedTimes, startTime]
      });
    }
  };

  const handleAddManualTime = () => {
    const time = newTime.trim();
    if (!time) return;
    if (formData.selectedTimes.includes(time)) {
      alert('Khung giờ này đã được chọn rồi.');
      return;
    }

    setFormData({
      ...formData,
      selectedTimes: [...formData.selectedTimes, time]
    });
    setNewTime('');
  };

  // 4. GỬI 1 REQUEST DUY NHẤT VỚI MẢNG START_TIMES
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedTimes.length === 0) {
      alert("Vui lòng tích chọn ít nhất một khung giờ chiếu!");
      return;
    }

    setIsSubmitting(true);
    try {
      const rawToken = localStorage.getItem("token");
      const token = rawToken ? rawToken.trim().replace(/^"|"$/g, '') : '';
      if (!token) {
        alert('Bạn cần đăng nhập admin trước khi thêm suất chiếu.');
        return;
      }

      // ĐÓNG GÓI CHUẨN JSON BẠN YÊU CẦU:
      const payload = {
        movie: { id: Number(formData.movieId) },
        room: { id: Number(formData.roomId) },
        showDate: formData.showDate,
        start_times: formData.selectedTimes, // Đẩy thẳng mảng thời gian vào đây
        basePrice: Number(formData.basePrice),
        format: formData.format
      };

      console.log('AddShowtime request auth token:', token);
      console.log('AddShowtime request payload:', payload);

      // Gọi 1 lần duy nhất thay vì vòng lặp
      await axiosClient.post('/showtimes/batch', payload);
      onRefresh();
      onClose();
      alert(`Đã tạo thành công lịch chiếu cho ${formData.selectedTimes.length} khung giờ!`);
    } catch (err) {
      console.error("Lỗi Server chi tiết:", err.response);
      const serverError = err.response?.data;
      let errorMessage = "Lỗi hệ thống hoặc Token không hợp lệ!";

      if (serverError) {
        if (typeof serverError === 'string') errorMessage = serverError;
        else errorMessage = serverError.message || serverError.error || JSON.stringify(serverError);
      }
      alert(`Không thể tạo suất chiếu: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Thêm suất chiếu hàng loạt</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Chọn Phim */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn phim *</label>
            <select required value={formData.movieId} onChange={(e) => setFormData({ ...formData, movieId: e.target.value, selectedTimes: [] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn phim muốn lên lịch --</option>
              {movies.map(movie => (
                <option key={movie.id} value={movie.id}>{movie.title} ({movie.duration || 120} phút)</option>
              ))}
            </select>
          </div>

          {/* Chọn Định Dạng & Giá vé */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Định dạng *</label>
              <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="2D">2D Standard</option>
                <option value="3D">3D Movie</option>
                <option value="IMAX">IMAX Cinema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1"><DollarSign className="w-4 h-4" />Giá vé sàn *</label>
              <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Chọn Ngày & Phòng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày chiếu *</label>
              <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.showDate} onChange={(e) => setFormData({ ...formData, showDate: e.target.value, selectedTimes: [] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phòng chiếu *</label>
              <select required value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value, selectedTimes: [] })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Phòng --</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Khung giờ */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-blue-500" /> Tích chọn các khung giờ muốn tạo *</label>
            {!loadingSlots && formData.movieId && formData.showDate && formData.roomId && (
              <div className="mb-4 grid grid-cols-[1fr_auto] gap-2 items-center">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Thêm giờ chiếu"
                />
                <button
                  type="button"
                  onClick={handleAddManualTime}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Thêm
                </button>
              </div>
            )}
            {loadingSlots ? (
              <div className="text-sm text-slate-500 flex items-center gap-2 py-4 justify-center border rounded-lg bg-slate-50"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Đang tính toán...</div>
            ) : (!formData.movieId || !formData.showDate || !formData.roomId) ? (
              <div className="text-xs text-slate-400 italic py-4 text-center border border-dashed rounded-lg">Điền đủ Phim, Ngày và Phòng để quét lịch</div>
            ) : (
              <>
                {formData.selectedTimes.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {formData.selectedTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeCheckboxChange(time)}
                        className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm flex items-center gap-2"
                      >
                        <span>{time}</span>
                        <span className="text-xs">×</span>
                      </button>
                    ))}
                  </div>
                )}
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg bg-slate-50/30">
                    {availableSlots.map((slot, index) => {
                      const timeValue = slot.startTime;
                      return (
                        <label key={index} className={`flex items-center gap-2.5 p-2 border rounded-lg cursor-pointer transition-all select-none ${formData.selectedTimes.includes(timeValue) ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input type="checkbox" checked={formData.selectedTimes.includes(timeValue)} onChange={() => handleTimeCheckboxChange(timeValue)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{timeValue}</span>
                            <span className="text-[10px] text-slate-400">Đến: {slot.endTime}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 py-4 text-center border border-dashed rounded-lg bg-slate-50">Không có slot tự động. Bạn vẫn có thể thêm giờ chiếu bằng ô trên.</div>
                )}
              </>
            )}
          </div>

          {/* Nút Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm font-medium">Hủy</button>
            <button type="submit" disabled={isSubmitting || loadingData || loadingSlots || formData.selectedTimes.length === 0} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-semibold disabled:bg-slate-100 disabled:text-slate-400 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Tạo ${formData.selectedTimes.length} suất`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}