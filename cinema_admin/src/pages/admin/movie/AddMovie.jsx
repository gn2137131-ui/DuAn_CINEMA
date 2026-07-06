import React, { useState } from 'react';
import { X, Loader2, Film, Upload, DownloadCloud } from 'lucide-react';
import axiosClient from '../../../api/axiosClient'; // Bạn chỉnh lại đường dẫn import cho đúng cấu trúc folders nhé

export function AddMovie({ isOpen, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(''); // Để hiển thị ảnh xem trước khi chọn

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');

  const [tmdbId, setTmdbId] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('tmdb_api_key') || '');
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);

  // Khởi tạo formData (Bỏ trường posterUrl vì sẽ lấy từ file upload)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    genre: '',
    language: '',
    rating: '',
    age_restriction: 'P',
    release_date: '',
    director: '',
    production_company: '',
    cast: '',
    trailerUrl: '',
    end_date: '',
    formats: '2D'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Tạo link tạm thời để hiển thị ảnh xem trước trên giao diện
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBanner(file);
      setBannerPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fetchTmdbData = async () => {
    if (!apiKey) {
      alert("Vui lòng nhập TMDB API Key! Bạn có thể tạo miễn phí tại themoviedb.org");
      return;
    }
    if (!tmdbId) {
      alert("Vui lòng nhập ID phim trên TMDB (Ví dụ: 76600)");
      return;
    }
    
    // Lưu API Key lại để lần sau không phải nhập
    localStorage.setItem('tmdb_api_key', apiKey);
    
    setIsFetchingTmdb(true);
    try {
      // Gọi API TMDB (Lấy thông tin phim + Credits + Videos + Release Dates)
      const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=vi-VN&append_to_response=credits,videos,release_dates`);
      if (res.status === 401) throw new Error("API Key không hợp lệ hoặc đã hết hạn! Vui lòng kiểm tra lại.");
      if (!res.ok) throw new Error("Không tìm thấy phim với ID này!");
      const data = await res.json();

      // Phân tích Chứng nhận độ tuổi (Certification) và Ngày chiếu tại VN
      let cert = '';
      let localReleaseDate = data.release_date;
      
      const releaseDates = data.release_dates?.results || [];
      const vnRelease = releaseDates.find(r => r.iso_3166_1 === 'VN');
      const usRelease = releaseDates.find(r => r.iso_3166_1 === 'US');
      
      if (vnRelease && vnRelease.release_dates.length > 0) {
        cert = vnRelease.release_dates[0].certification;
        // Thử lấy ngày chiếu tại VN nếu có (Cắt lấy chuỗi YYYY-MM-DD)
        if (vnRelease.release_dates[0].release_date) {
            localReleaseDate = vnRelease.release_dates[0].release_date.substring(0, 10);
        }
      } else if (usRelease && usRelease.release_dates.length > 0) {
        cert = usRelease.release_dates[0].certification;
      }

      // Map Certification của Mỹ/VN sang Hệ thống của rạp Việt Nam
      let ageRes = 'P';
      const upperCert = cert.toUpperCase();
      if (upperCert.includes('18') || upperCert === 'NC-17' || upperCert === 'R') ageRes = 'T18';
      else if (upperCert.includes('16')) ageRes = 'T16';
      else if (upperCert.includes('13') || upperCert === 'PG-13') ageRes = 'T13';
      else if (upperCert === 'K' || upperCert === 'PG') ageRes = 'K';
      else if (upperCert === 'C') ageRes = 'C';

      // Cập nhật FormData
      const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || '';
      const cast = data.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
      
      // Tìm Trailer (Ưu tiên Trailer, nếu không có thì lấy Teaser/Clip bất kỳ trên YouTube)
      let trailerVideo = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (!trailerVideo && data.videos?.results?.length > 0) {
          trailerVideo = data.videos?.results?.find(v => v.site === 'YouTube');
      }
      const trailer = trailerVideo?.key;
      
      setFormData(prev => ({
        ...prev,
        title: data.title || '',
        description: data.overview || '',
        duration: data.runtime || '',
        genre: data.genres?.map(g => g.name).join(', ') || '',
        language: data.original_language || '',
        rating: data.vote_average ? data.vote_average.toFixed(1) + '/10' : '',
        release_date: localReleaseDate || '',
        age_restriction: ageRes,
        director: director,
        production_company: data.production_companies?.[0]?.name || '',
        cast: cast,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer}` : '',
        end_date: '',
        formats: '2D'
      }));

      // Xử lý Poster: Download ảnh từ TMDB về dạng File
      if (data.poster_path) {
        const imageUrl = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        const imageRes = await fetch(imageUrl);
        const imageBlob = await imageRes.blob();
        const file = new File([imageBlob], `${tmdbId}_poster.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
      
      alert("Lấy dữ liệu thành công!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi lấy dữ liệu từ TMDB!");
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Vui lòng chọn ảnh poster cho bộ phim!");
      return;
    }

    setIsSubmitting(true);

    // 1. Chuẩn hóa dữ liệu phim trước khi đóng gói
    const movieData = {
      ...formData,
      duration: parseInt(formData.duration, 10),
      productionCompany: formData.production_company // map correctly for Backend (Movie entity uses productionCompany)
    };

    // 2. Tạo đối tượng FormData để chứa cả Object JSON và File
    const bodyFormData = new FormData();

    // Điểm mấu chốt: Để Spring Boot hiểu được @RequestPart("movie"), ta cần biến Object thành một Blob định dạng JSON
    bodyFormData.append(
      'movie',
      new Blob([JSON.stringify(movieData)], { type: 'application/json' })
    );
    
    // Khớp chính xác với @RequestPart("file") phía Backend
    bodyFormData.append('file', selectedFile);

    if (selectedBanner) {
      bodyFormData.append('bannerFile', selectedBanner);
    }

    try {
      // 3. Gọi API POST tới endpoint /add của bạn với header multipart/form-data
      await axiosClient.post('/movies/add', bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      alert("Thêm phim và upload ảnh thành công!");
      onRefresh(); // Tải lại danh sách phim
      handleCloseAndReset();
    } catch (err) {
      console.error("Lỗi khi thêm phim:", err);
      alert(err.response?.data?.message || "Không thể thêm phim. Vui lòng kiểm tra lại kết nối!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setSelectedBanner(null);
    setBannerPreviewUrl('');
    setFormData({
      title: '', description: '', duration: '', genre: '', language: '',
      rating: '', age_restriction: 'P', release_date: '', end_date: '',
      director: '', production_company: '', cast: '', trailerUrl: '', formats: '2D'
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '960px' }}>

        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} style={{ color: 'var(--accent-primary)' }} />
            Thêm phim mới
          </div>
          <button onClick={handleCloseAndReset} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* TMDB Auto-fill */}
        <div className="card-pad" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <DownloadCloud size={14} /> Tự động điền từ TheMovieDB
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <input type="text" placeholder="TMDB API Key (miễn phí tại themoviedb.org)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="form-control" style={{ fontSize: '0.8rem' }} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" placeholder="TMDB ID (VD: 76600)" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} className="form-control" style={{ fontSize: '0.8rem' }} />
                  <button type="button" onClick={fetchTmdbData} disabled={isFetchingTmdb} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', padding: '8px 14px' }}>
                    {isFetchingTmdb ? <Loader2 size={14} className="spinner" style={{ width: '14px', height: '14px', margin: 0 }} /> : <DownloadCloud size={14} />}
                    {isFetchingTmdb ? 'Đang lấy...' : 'Lấy dữ liệu'}
                  </button>
                </div>
              </div>
            </div>
            {!apiKey && (
              <p style={{ fontSize: '0.7rem', color: 'var(--accent-info)', fontStyle: 'italic', margin: 0 }}>
                * Đăng nhập TheMovieDB.org {'>'} Cài đặt {'>'} API để tạo key miễn phí (chỉ cần nhập 1 lần)
              </p>
            )}
          </div>
        </div>

        {/* Form Body - Horizontal Layout */}
        <form onSubmit={handleSubmit} className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '75vh' }}>
          
          <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
            
            {/* Cột Trái */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tên phim *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước" className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh Poster phim *</label>
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
                      <Upload size={14} /> Chọn ảnh
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', margin: 0 }}>{selectedFile ? selectedFile.name : 'JPG, PNG, WEBP...'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh Banner ngang (Tùy chọn)</label>
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
                      <Upload size={14} /> Chọn banner
                      <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedBanner ? selectedBanner.name : 'Nên dùng ảnh 16:9'}</p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label">Mô tả phim</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Nội dung tóm tắt của bộ phim..." className="form-control" style={{ resize: 'none', flex: 1, minHeight: '80px' }} />
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
                  <input type="text" name="language" value={formData.language} onChange={handleChange} placeholder="Tiếng Nhật" className="form-control" />
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
            <button type="button" onClick={handleCloseAndReset} className="btn btn-secondary" style={{ width: '120px' }}>Hủy</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '150px' }}>
              {isSubmitting ? (
                <><Loader2 size={16} className="spinner" style={{ width: '16px', height: '16px', margin: 0 }} /> Tải lên...</>
              ) : 'Thêm phim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}