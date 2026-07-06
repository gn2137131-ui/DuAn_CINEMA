import React, { useEffect, useState } from 'react';
import { X, Loader2, Film, Upload } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function EditMovie({ isOpen, onClose, onRefresh, movie }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    genre: '',
    language: '',
    rating: '',
    age_restriction: 'P',
    release_date: '',
    posterUrl: '',
    bannerUrl: '',
    director: '',
    production_company: '', // Đồng bộ tên trường nhất quán
    cast: '',
    trailerUrl: '',
    end_date: '',
    formats: '2D'
  });

  useEffect(() => {
    if (isOpen && movie) {
      setFormData({
        title: movie.title || '',
        description: movie.description || '',
        duration: movie.duration != null ? String(movie.duration) : '',
        genre: movie.genre || '',
        language: movie.language || '',
        rating: movie.rating || '',
        age_restriction: movie.age_restriction || 'P',
        release_date: movie.release_date || '',
        posterUrl: movie.posterUrl || movie.poster_url || '',
        director: movie.director || '',
        production_company: movie.production_company || movie.producer || '', // Quét cả 2 key phòng hờ backend
        cast: movie.cast || '',
        trailerUrl: movie.trailerUrl || movie.trailer_url || '',
        end_date: movie.end_date || movie.endDate || '',
        formats: movie.formats || '2D'
      });
      setPreviewUrl(movie.posterUrl || movie.poster_url || '');
      setSelectedFile(null);
      setBannerPreviewUrl(movie.bannerUrl || movie.banner_url || '');
      setSelectedBanner(null);
    }
  }, [isOpen, movie]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBanner(file);
      setBannerPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movie || !movie.id) {
      alert('Không xác định được phim cần sửa.');
      return;
    }

    setIsSubmitting(true);

    // 1. Sao chép thông tin từ formData
    const movieData = {
      id: movie.id,
      title: formData.title,
      description: formData.description,
      duration: parseInt(formData.duration, 10) || 0,
      genre: formData.genre,
      language: formData.language,
      rating: formData.rating,
      age_restriction: formData.age_restriction,
      release_date: formData.release_date || null,
      posterUrl: formData.posterUrl,
      director: formData.director,
      production_company: formData.production_company,
      cast: formData.cast,
      trailerUrl: formData.trailerUrl,
      end_date: formData.end_date || null,
      formats: formData.formats
    };

    // ĐẢM BẢO AN TOÀN: Xóa bỏ hoàn toàn thuộc tính showtimes nếu vô tình lọt lưới
    delete movieData.showtimes;

    const multipartData = new FormData();
    multipartData.append(
      'movie',
      new Blob([JSON.stringify(movieData)], { type: 'application/json' })
    );

    if (selectedFile) {
      multipartData.append('file', selectedFile);
    } else {
      // Backend có thể yêu cầu field 'file' dù rỗng
      multipartData.append('file', new Blob([], { type: 'application/octet-stream' }));
    }

    if (selectedBanner) {
      multipartData.append('bannerFile', selectedBanner);
    }

    try {
      await axiosClient.put(`/movies/edit/${movie.id}`, multipartData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Cập nhật phim thành công!');
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật phim:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Lỗi hệ thống (500)';
      alert(typeof errorMsg === 'string' ? errorMsg : 'Vui lòng kiểm tra lại định dạng dữ liệu!');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column' }}>

        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} style={{ color: 'var(--accent-primary)' }} />
            Sửa thông tin phim
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '75vh' }}>

          <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
            
            {/* Cột Trái */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tên phim *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Nhập tên phim" className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh Poster</label>
                <div className="card-pad" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }} />
                  ) : (
                    <div style={{ width: '70px', height: '100px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Film size={28} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', width: 'fit-content' }}>
                      <Upload size={14} /> Chọn ảnh mới
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile ? selectedFile.name : 'JPG, PNG. Chọn file mới để thay'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh Banner (Tùy chọn)</label>
                <div className="card-pad" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {bannerPreviewUrl ? (
                    <img src={bannerPreviewUrl} alt="Banner Preview" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }} />
                  ) : (
                    <div style={{ width: '120px', height: '70px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Film size={28} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', width: 'fit-content' }}>
                      <Upload size={14} /> Chọn banner mới
                      <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedBanner ? selectedBanner.name : 'Nên dùng ảnh 16:9'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label">Mô tả phim</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Nội dung cốt truyện..." className="form-control" style={{ resize: 'none', flex: 1, minHeight: '80px' }} />
              </div>
            </div>

            {/* Cột Phải */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label">Thời lượng (ph) *</label>
                  <input type="number" name="duration" required min="1" value={formData.duration} onChange={handleChange} placeholder="120" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Thể loại *</label>
                  <input type="text" name="genre" required value={formData.genre} onChange={handleChange} placeholder="Hành động" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngôn ngữ</label>
                  <input type="text" name="language" value={formData.language} onChange={handleChange} placeholder="Tiếng Anh - Phụ đề Việt" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Độ tuổi *</label>
                  <select name="age_restriction" value={formData.age_restriction} onChange={handleChange} className="form-control">
                    <option value="P">P (Mọi lứa tuổi)</option>
                    <option value="K">K (Dưới 13 cần PH)</option>
                    <option value="T13">T13 (Từ 13+)</option>
                    <option value="T16">T16 (Từ 16+)</option>
                    <option value="T18">T18 (Từ 18+)</option>
                    <option value="C">C (Cấm)</option>
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Ngày phát hành *</label>
                  <input type="date" name="release_date" required value={formData.release_date} onChange={handleChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input type="date" name="end_date" required value={formData.end_date} onChange={handleChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Đánh giá</label>
                  <input type="text" name="rating" value={formData.rating} onChange={handleChange} placeholder="VD: 8.5/10" className="form-control" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Đạo diễn</label>
                  <input type="text" name="director" value={formData.director} onChange={handleChange} placeholder="Tên đạo diễn" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nhà sản xuất</label>
                  <input type="text" name="production_company" value={formData.production_company} onChange={handleChange} placeholder="Tên nhà sản xuất" className="form-control" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Diễn viên</label>
                <textarea name="cast" rows="2" value={formData.cast} onChange={handleChange} placeholder="Diễn viên A, Diễn viên B..." className="form-control" style={{ resize: 'none' }} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Link Trailer YouTube</label>
                  <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Định dạng chiếu</label>
                  <input type="text" name="formats" value={formData.formats} onChange={handleChange} placeholder="2D, 3D, IMAX" className="form-control" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="card-pad" style={{ borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'var(--bg-card)', zIndex: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: '120px' }}>Hủy</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '150px' }}>
              {isSubmitting ? <><Loader2 size={16} className="spinner" style={{ width: '16px', height: '16px', margin: 0 }} /> Đang lưu...</> : 'Lưu thay đổi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}