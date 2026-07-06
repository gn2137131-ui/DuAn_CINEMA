import toast from 'react-hot-toast';
import { X, Loader2, CalendarClock, DollarSign, CalendarRange } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';

const daysOfWeek = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' }
];

export function AddShowtime({ isOpen, onClose, onRefresh, preselectedMovieId }) {
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTime, setNewTime] = useState('');

  const [formData, setFormData] = useState({
    movieId: '',
    startDate: '',
    endDate: '',
    roomId: '',
    selectedTimes: [],
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    format: '2D',
    basePrice: 0 // Sẽ lấy từ cấu hình chung
  });

  // Fetch settings để lấy giá vé cơ bản
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/settings');
        if (res.data && res.data.basePrice) {
          setFormData(prev => ({ ...prev, basePrice: res.data.basePrice }));
        }
      } catch (err) {
        console.error("Lỗi lấy cấu hình giá vé", err);
      }
    };
    fetchSettings();
  }, []);

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
      setFormData(prev => ({ ...prev, movieId: preselectedMovieId || '', startDate: '', endDate: '', roomId: '', selectedTimes: [], selectedDays: [0, 1, 2, 3, 4, 5, 6], format: '2D' }));
      setAvailableSlots([]);
      setNewTime('');
    }
  }, [isOpen]);

  // 2. Lấy khung giờ trống gợi ý (dựa vào startDate)
  useEffect(() => {
    if (formData.roomId && formData.startDate && formData.movieId) {
      const fetchAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const selectedMovie = movies.find(m => m.id === Number(formData.movieId));
          const duration = selectedMovie?.duration || 120;

          const res = await axiosClient.get('/showtimes/available', {
            params: {
              roomId: formData.roomId,
              date: formData.startDate,
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
  }, [formData.roomId, formData.startDate, formData.movieId, movies]);

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

  const handleDayToggle = (dayValue) => {
    const isSelected = formData.selectedDays.includes(dayValue);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedDays: formData.selectedDays.filter(d => d !== dayValue)
      });
    } else {
      setFormData({
        ...formData,
        selectedDays: [...formData.selectedDays, dayValue]
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
      selectedTimes: [...formData.selectedTimes, time]
    });
    setNewTime('');
  };

  // 4. GỬI REQUEST
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedTimes.length === 0) {
      toast.error("Vui lòng tích chọn ít nhất một khung giờ chiếu!");
      return;
    }
    if (formData.selectedDays.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thứ trong tuần!");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Vui lòng chọn Từ ngày và Đến ngày!");
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return;
    }

    setIsSubmitting(true);
    try {
      const rawToken = localStorage.getItem("token");
      const token = rawToken ? rawToken.trim().replace(/^"|"$/g, '') : '';
      if (!token) {
        toast.error('Bạn cần đăng nhập admin trước khi thêm suất chiếu.');
        return;
      }

      const getDatesInRange = (start, end, days) => {
        let dates = [];
        let currDate = new Date(start);
        const lastDate = new Date(end);
        while (currDate <= lastDate) {
          if (days.includes(currDate.getDay())) {
            const yyyy = currDate.getFullYear();
            const mm = String(currDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currDate.getDate()).padStart(2, '0');
            dates.push(`${yyyy}-${mm}-${dd}`);
          }
          currDate.setDate(currDate.getDate() + 1);
        }
        return dates;
      };

      const generatedDates = getDatesInRange(formData.startDate, formData.endDate, formData.selectedDays);
      if (generatedDates.length === 0) {
        toast.error("Không có ngày nào hợp lệ trong khoảng thời gian và các thứ đã chọn!");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        movie: { id: Number(formData.movieId) },
        room: { id: Number(formData.roomId) },
        showDate: formData.startDate, // Legacy fallback
        showDates: generatedDates,
        show_dates: generatedDates,
        start_times: formData.selectedTimes,
        basePrice: Number(formData.basePrice),
        format: formData.format
      };

      await axiosClient.post('/showtimes/batch', payload);
      onRefresh();
      onClose();
      toast.error(`Đã gửi yêu cầu tạo suất chiếu. Tổng số ngày: ${generatedDates.length}. Tổng khung giờ mỗi ngày: ${formData.selectedTimes.length}.`);
    } catch (err) {
      console.error("Lỗi Server chi tiết:", err.response);
      const serverError = err.response?.data;
      let errorMessage = "Lỗi hệ thống hoặc Token không hợp lệ!";

      if (serverError) {
        if (typeof serverError === 'string') errorMessage = serverError;
        else errorMessage = serverError.message || serverError.error || JSON.stringify(serverError);
      }
      toast.error(`Không thể tạo suất chiếu: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '896px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">Thêm suất chiếu hàng loạt</h2>
          <button type="button" onClick={onClose} className="btn btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
            <div className="grid-2" style={{ gap: '32px' }}>
              {/* Cột trái: Thông tin cơ bản */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Chọn phim *</label>
                  <select required value={formData.movieId} onChange={(e) => setFormData({ ...formData, movieId: e.target.value, selectedTimes: [] })} className="form-control">
                    <option value="">-- Chọn phim muốn lên lịch --</option>
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

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} />Giá vé cơ bản *</label>
                  <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="form-control" />
                </div>

                <div className="card">
                  <div className="card-pad">
                    <label className="form-label" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarRange size={16} /> Thời gian chiếu *
                    </label>
                    <div className="grid-2" style={{ gap: '12px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ textTransform: 'none', letterSpacing: 0 }}>Từ ngày</label>
                        <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={(e) => { const newVal = e.target.value; setFormData({ ...formData, startDate: newVal, endDate: (!formData.endDate || formData.endDate < newVal) ? newVal : formData.endDate, selectedTimes: [] }) }} style={{ colorScheme: 'dark' }} className="form-control" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ textTransform: 'none', letterSpacing: 0 }}>Đến ngày</label>
                        <input type="date" required min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={{ colorScheme: 'dark' }} className="form-control" />
                      </div>
                    </div>
                    
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Áp dụng thứ trong tuần:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {daysOfWeek.map(day => {
                        const isSelected = formData.selectedDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleDayToggle(day.value)}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải: Khung giờ */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarClock size={16} /> Các khung giờ mỗi ngày *
                  </label>
                  
                  {!loadingSlots && formData.movieId && formData.startDate && formData.roomId && (
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
                        <p>Đang lấy gợi ý...</p>
                      </div>
                    ) : (!formData.movieId || !formData.startDate || !formData.roomId) ? (
                      <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p>Vui lòng chọn Phim, Phòng và Ngày bắt đầu<br/>để xem khung giờ khả dụng</p>
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
                              <p>Không có khung giờ gợi ý trống.<br/>Vui lòng tự nhập giờ vào ô bên trên.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Chú thích */}
                    {!loadingSlots && formData.movieId && formData.startDate && formData.roomId && (
                      <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: '700', display: 'block', marginBottom: '2px' }}>Gợi ý thông minh</span>
                        Khung giờ được quét dựa trên thời lượng phim và lịch trống ngày bắt đầu. Hệ thống tự động bỏ qua nếu ngày khác trùng lịch.
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
            <button type="submit" disabled={isSubmitting || loadingData || loadingSlots || formData.selectedTimes.length === 0 || !formData.startDate || !formData.endDate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Tạo Lịch Hàng Loạt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}