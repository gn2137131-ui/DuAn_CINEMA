import toast from 'react-hot-toast';
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
      toast.error('Khung giờ này đã được chọn rồi.');
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
      toast.error("Vui lòng tích chọn ít nhất một khung giờ chiếu!");
      return;
    }

    setIsSubmitting(true);
    try {
      const rawToken = localStorage.getItem("token");
      const token = rawToken ? rawToken.trim().replace(/^"|"$/g, '') : '';
      if (!token) {
        toast.error('Bạn cần đăng nhập admin trước khi thực hiện.');
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
      toast.success("Cập nhật thông tin suất chiếu thành công!");
    } catch (err) {
      console.error("Lỗi Server chi tiết:", err.response);
      const serverError = err.response?.data;
      let errorMessage = "Lỗi hệ thống hoặc xảy ra xung đột lịch chiếu!";

      if (serverError) {
        if (typeof serverError === 'string') errorMessage = serverError;
        else errorMessage = serverError.message || serverError.error || JSON.stringify(serverError);
      }
      toast.success(`Không thể cập nhật suất chiếu: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '896px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">Chỉnh sửa suất chiếu</h2>
          <button type="button" onClick={onClose} className="btn btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
            <div className="grid-2" style={{ gap: '32px' }}>
              {/* Cột trái */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Chọn phim *</label>
                  <select required value={formData.movieId} onChange={(e) => setFormData({ ...formData, movieId: e.target.value, selectedTimes: [] })} className="form-control">
                    <option value="">-- Chọn phim --</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>{movie.title} ({movie.duration || 120} phút)</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Phòng chiếu *</label>
                    <select required value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value, selectedTimes: [] })} className="form-control">
                      <option value="">-- Phòng --</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Định dạng *</label>
                    <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className="form-control">
                      <option value="2D">2D Standard</option>
                      <option value="3D">3D Movie</option>
                      <option value="IMAX">IMAX Cinema</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày chiếu *</label>
                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.showDate} onChange={(e) => setFormData({ ...formData, showDate: e.target.value, selectedTimes: [] })} style={{ colorScheme: 'dark' }} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} />Giá vé sàn *</label>
                    <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="form-control" />
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarClock size={16} /> Các khung giờ được chọn *
                  </label>
                  
                  {!loadingSlots && formData.movieId && formData.showDate && formData.roomId && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
                      <input
                        type="time"
                        style={{ colorScheme: 'dark' }}
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="form-control"
                        placeholder="Thêm giờ chiếu"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualTime}
                        className="btn btn-secondary"
                      >
                        Thêm
                      </button>
                    </div>
                  )}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '250px' }}>
                    {loadingSlots ? (
                      <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', marginBottom: '12px', color: 'var(--accent-primary)' }} />
                        <p>Đang tính toán...</p>
                      </div>
                    ) : (!formData.movieId || !formData.showDate || !formData.roomId) ? (
                      <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p>Vui lòng chọn Phim, Phòng và Ngày chiếu<br/>để xem khung giờ khả dụng</p>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {formData.selectedTimes.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                            {formData.selectedTimes.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleTimeCheckboxChange(time)}
                                className="btn btn-sm btn-primary"
                                title="Xóa giờ này"
                              >
                                {time} <span style={{ marginLeft: '4px', opacity: 0.7 }}>×</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                          {availableSlots.length > 0 ? (
                            <div className="grid-2" style={{ gap: '8px' }}>
                              {availableSlots.map((slot, index) => {
                                const timeValue = slot.startTime.substring(0, 5);
                                const isChecked = formData.selectedTimes.includes(timeValue);
                                return (
                                  <label key={index} className={`card card-pad`} style={{ cursor: 'pointer', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', border: isChecked ? '1px solid var(--accent-primary)' : undefined }}>
                                    <input type="checkbox" checked={isChecked} onChange={() => handleTimeCheckboxChange(timeValue)} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{timeValue}</span>
                                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '500' }}>Đến {slot.endTime?.substring(0, 5)}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <p>Không có khung giờ gợi ý trống.<br/>Bạn vẫn có thể tự nhập giờ vào ô bên trên.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Hủy bỏ</button>
            <button type="submit" disabled={isSubmitting || loadingData || loadingSlots || formData.selectedTimes.length === 0} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : (
                <>
                  <Save size={16} />
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