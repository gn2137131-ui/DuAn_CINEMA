import React, { useState } from 'react';
import { X, Loader2, Film, Upload, DownloadCloud } from 'lucide-react';
import axiosClient from '../../../api/axiosClient'; // Bạn chỉnh lại đường dẫn import cho đúng cấu trúc folders nhé

export function AddMovie({ isOpen, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(''); // Để hiển thị ảnh xem trước khi chọn

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
    setFormData({
      title: '', description: '', duration: '', genre: '', language: '',
      rating: '', age_restriction: 'P', release_date: '', end_date: '',
      director: '', production_company: '', cast: '', trailerUrl: '', formats: '2D'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all">
        
        <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Thêm phim mới</h2>
          </div>
          <button onClick={handleCloseAndReset} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khối Tự động lấy dữ liệu TMDB */}
        <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex flex-col gap-3">
          <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide">Tự động điền từ TheMovieDB (Auto-fill)</label>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="TMDB API Key (Bắt buộc)" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              title="Lấy API Key miễn phí tại themoviedb.org/settings/api"
            />
            <div className="flex flex-1 gap-2">
              <input 
                type="text" 
                placeholder="Nhập TMDB ID (Ví dụ: 76600)" 
                value={tmdbId}
                onChange={(e) => setTmdbId(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
              <button 
                type="button" 
                onClick={fetchTmdbData}
                disabled={isFetchingTmdb}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isFetchingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                Lấy dữ liệu
              </button>
            </div>
          </div>
          {!apiKey && (
            <p className="text-xs text-blue-600 italic">
              * Bạn chưa có API Key? Hãy đăng nhập TheMovieDB.org {'>'} Cài đặt {'>'} API để tạo 1 key miễn phí nhé! (Chỉ cần nhập 1 lần)
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tên phim */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên phim *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
            />
          </div>

          {/* Hàng chọn ảnh Poster thực tế */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ảnh Poster phim *</label>
            <div className="mt-1 flex items-center gap-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-20 h-28 object-cover rounded shadow-md border" />
              ) : (
                <div className="w-20 h-28 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                  <Film className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-sm cursor-pointer w-fit shadow-sm">
                  <Upload className="w-4 h-4" />
                  Chọn file ảnh từ máy
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedFile ? `File đã chọn: ${selectedFile.name}` : "Hỗ trợ định dạng JPG, PNG, WEBP..."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thời lượng */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thời lượng (phút) *</label>
              <input
                type="number"
                name="duration"
                required
                min="1"
                value={formData.duration}
                onChange={handleChange}
                placeholder="120"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>

            {/* Thể loại */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thể loại *</label>
              <input
                type="text"
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                placeholder="Hành động, Gia đình"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>

            {/* Ngôn ngữ & Phụ đề */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngôn ngữ / Phụ đề</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="Tiếng Nhật - Phụ đề Tiếng Việt"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>


            {/* Giới hạn độ tuổi */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giới hạn độ tuổi *</label>
              <select
                name="age_restriction"
                value={formData.age_restriction}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-900"
              >
                <option value="P">P (Mọi lứa tuổi)</option>
                <option value="K">K (Dưới 13 tuổi cần cha mẹ kèm)</option>
                <option value="T13">T13 (Từ 13 tuổi trở lên)</option>
                <option value="T16">T16 (Từ 16 tuổi trở lên)</option>
                <option value="T18">T18 (Từ 18 tuổi trở lên)</option>
                <option value="C">C (Cấm phổ biến)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngày phát hành */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày phát hành *</label>
              <input
                type="date"
                name="release_date"
                required
                value={formData.release_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>

            {/* Ngày kết thúc */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc chiếu *</label>
              <input
                type="date"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>

            {/* Đánh giá / Điểm số */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đánh giá (Rating)</label>
              <input
                type="text"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="Ví dụ: 8.5/10 hoặc PG-13"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Đạo diễn */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đạo diễn</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Tên đạo diễn"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>
            
            {/* Nhà sản xuất */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nhà sản xuất</label>
              <input
                type="text"
                name="production_company"
                value={formData.production_company}
                onChange={handleChange}
                placeholder="Tên nhà sản xuất"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Diễn viên */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Danh sách diễn viên</label>
            <textarea
              name="cast"
              rows="2"
              value={formData.cast}
              onChange={handleChange}
              placeholder="Diễn viên A, Diễn viên B..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none text-slate-900 bg-white"
            />
          </div>

          {/* Trailer URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Link Trailer YouTube</label>
            <input
              type="text"
              name="trailerUrl"
              value={formData.trailerUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
            />
          </div>

          {/* Định dạng chiếu */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Định dạng chiếu (cách nhau bởi dấu phẩy)</label>
            <input
              type="text"
              name="formats"
              value={formData.formats}
              onChange={handleChange}
              placeholder="Ví dụ: 2D, 3D, IMAX"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 bg-white"
            />
          </div>

          {/* Mô tả nội dung phim */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả phim</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nội dung tóm tắt của bộ phim..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none text-slate-900 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md disabled:bg-blue-300 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải lên Cloudinary...
                </>
              ) : (
                'Thêm phim'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}