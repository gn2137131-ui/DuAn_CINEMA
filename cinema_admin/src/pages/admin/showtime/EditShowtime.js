import { X, Loader2, CalendarClock, DollarSign, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';

export function EditShowtime({ isOpen, onClose, onRefresh, showtime }) {
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
    basePrice: 0
  });

  // 1. Tải danh sách Phim và Phòng khi mở Modal
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
    }
  }, [isOpen]);

  // 2. Đồng bộ dữ liệu của suất chiếu cần sửa vào Form (Chạy khi mở modal hoặc thay đổi dữ liệu gốc)
  useEffect(() => {
    if (showtime && isOpen) {
      const currentMovieId = showtime.movie?.id || showtime.movieId || '';
      const currentRoomId = showtime.room?.id || showtime.roomId || '';
      
      // Chuẩn hóa giờ cũ thành mảng để tương thích với giao diện checkbox hàng loạt
      let initialTimes = [];
      if (showtime.startTime) initialTimes = [showtime.startTime.substring(0, 5)];
      else if (showtime.start_time) initialTimes = [showtime.start_time.substring(0, 5)];
      else if (Array.isArray(showtime.startTimes)) initialTimes = showtime.startTimes.map(t => t.substring(0, 5));
      else if (Array.isArray(showtime.start_times)) initialTimes = showtime.start_times.map(t => t.substring(0, 5));

      setFormData({
        movieId: currentMovieId,
        showDate: showtime.showDate ? showtime.showDate.split('T')[0] : '',
        roomId: currentRoomId,
        selectedTimes: initialTimes,
        format: showtime.format || '2D',
        basePrice: showtime.basePrice || showtime.price || 0
      });
      setNewTime('');
    }
  }, [showtime, isOpen]);

  // 3. Lấy khung giờ trống tương tự như AddShowtime
  useEffect(() => {
    if (formData.roomId && formData.showDate && formData.movieId) {
      const fetchAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const selectedMovie = movies.find(m => m.id === Number(formData.movieId));
          const duration = selectedMovie?.duration || 120;

          // Gọi API lấy giờ trống của phòng trong ngày
          const res = await axiosClient.get('/showtimes/available', {
            params: {
              roomId: formData.roomId,
              date: formData.showDate,
              duration: duration
            }
          });
          setAvailableSlots(res.data || []);
        } catch (err) {
          console.error("Lỗi khi lấy khung giờ trống:", err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      
      const delayDebounce = setTimeout(() => {
        fetchAvailableSlots();
      }, 400);

      return () => clearTimeout(delayDebounce);
    } else {
      setAvailableSlots([]);
    }
  }, [formData.roomId, formData.showDate, formData.movieId, movies]);

  if (!isOpen) return null;

  // 4. Xử lý Checkbox tương đương AddShowtime
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
        selectedTimes: [...formData.selectedTimes, startTime].sort()
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
      selectedTimes: [...formData.selectedTimes, time].sort()
    });
    setNewTime('');
  };

  // 5. Gửi Request cập nhật thông tin suất chiếu
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
        alert('Bạn cần đăng nhập admin trước khi thực hiện.');
        return;
      }

      // Format lại giờ thành hh:mm:00 nếu server yêu cầu chuẩn khắt khe
      const processedTimes = formData.selectedTimes.map(t => t.length === 5 ? `${t}:00` : t);

      // Đóng gói cấu trúc Payload chuẩn JSON như AddShowtime
      const payload = {
        id: showtime.id,
        movie: { id: Number(formData.movieId) },
        room: { id: Number(formData.roomId) },
        showDate: formData.showDate,
        start_times: processedTimes, 
        startTime: processedTimes[0], // Dự phòng cho API đơn
        basePrice: Number(formData.basePrice),
        format: formData.format
      };

      console.log('EditShowtime request payload:', payload);

      // Gọi API cập nhật theo ID của suất chiếu hiện tại
      await axiosClient.put(`/showtimes/${showtime.id}`, payload);
      
      onRefresh();
      onClose();
      alert("Cập nhật thông tin suất chiếu thành công!");
    } catch (err) {
      console.error("Lỗi Server chi tiết:", err.response);
      const serverError = err.response?.data;
      let errorMessage = "Lỗi hệ thống hoặc xảy ra xung đột lịch chiếu!";

      if (serverError) {
        if (typeof serverError === 'string') errorMessage = serverError;
        else errorMessage = serverError.message || serverError.error || JSON.stringify(serverError);
      }
      alert(`Không thể cập nhật suất chiếu: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Chỉnh sửa suất chiếu</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
            {/* Cột trái */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn phim *</label>
                <select required value={formData.movieId} onChange={(e) => setFormData({ ...formData, movieId: e.target.value, selectedTimes: [] })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all">
                  <option value="">-- Chọn phim --</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title} ({movie.duration || 120} phút)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phòng chiếu *</label>
                  <select required value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value, selectedTimes: [] })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all">
                    <option value="">-- Phòng --</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Định dạng *</label>
                  <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all">
                    <option value="2D">2D Standard</option>
                    <option value="3D">3D Movie</option>
                    <option value="IMAX">IMAX Cinema</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày chiếu *</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.showDate} onChange={(e) => setFormData({ ...formData, showDate: e.target.value, selectedTimes: [] })} style={{ colorScheme: 'light' }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><DollarSign className="w-4 h-4 text-slate-400" />Giá vé sàn *</label>
                  <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            {/* Cột phải */}
            <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-blue-500" /> Các khung giờ được chọn *
              </label>
              
              {!loadingSlots && formData.movieId && formData.showDate && formData.roomId && (
                <div className="mb-5 grid grid-cols-[1fr_auto] gap-3 items-center">
                  <input
                    type="time"
                    style={{ colorScheme: 'light' }}
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    placeholder="Thêm giờ chiếu"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualTime}
                    className="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    Thêm
                  </button>
                </div>
              )}
              
              <div className="flex-1 flex flex-col min-h-[250px]">
                {loadingSlots ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 p-8 border border-dashed border-slate-300 rounded-xl bg-white"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" /> Đang tính toán...</div>
                ) : (!formData.movieId || !formData.showDate || !formData.roomId) ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-slate-400 italic p-8 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                    Vui lòng chọn Phim, Phòng và Ngày chiếu<br/>để xem khung giờ khả dụng
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    {formData.selectedTimes.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-slate-100 flex flex-wrap gap-2 shrink-0">
                        {formData.selectedTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleTimeCheckboxChange(time)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors group"
                            title="Xóa giờ này"
                          >
                            <span>{time}</span>
                            <span className="text-red-400 group-hover:text-red-600">×</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {availableSlots.map((slot, index) => {
                            const timeValue = slot.startTime.substring(0, 5);
                            const isChecked = formData.selectedTimes.includes(timeValue);
                            return (
                              <label key={index} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all select-none ${isChecked ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={isChecked} onChange={() => handleTimeCheckboxChange(timeValue)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                <div className="flex flex-col">
                                  <span className={`text-sm font-bold ${isChecked ? 'text-blue-700' : 'text-slate-700'}`}>{timeValue}</span>
                                  <span className="text-[11px] text-slate-500 font-medium">Đến {slot.endTime?.substring(0, 5)}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 py-6 text-center h-full flex items-center justify-center">
                          Không có khung giờ gợi ý trống.<br/>Bạn vẫn có thể tự nhập giờ vào ô bên trên.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-5 bg-slate-50 shrink-0 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSubmitting || loadingData || loadingSlots || formData.selectedTimes.length === 0} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md shadow-blue-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu {formData.selectedTimes.length} suất chiếu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}