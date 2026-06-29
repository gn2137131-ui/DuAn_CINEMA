import React, { useEffect, useState } from 'react';
import { X, Loader2, Film, Upload } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function EditMovie({ isOpen, onClose, onRefresh, movie }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
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
    // Đảm bảo phần nền bao trùm và căn giữa chuẩn xác
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-x-hidden animate-fade-in">
      {/* Khối Modal - Ép cứng min-width trên PC và co giãn an toàn trên Mobile */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header cố định */}
        <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Sửa thông tin phim</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Form cuộn mượt nội dung bên trong */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên phim *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tên phim"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thể loại *</label>
              <input
                type="text"
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                placeholder="Hành động, Kinh dị"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngôn ngữ / Phụ đề</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="Tiếng Anh - Phụ đề Tiếng Việt"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giới hạn tuổi *</label>
              <select
                name="age_restriction"
                value={formData.age_restriction}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-800"
              >
                <option value="P">P (Mọi lứa tuổi)</option>
                <option value="K">K (Dưới 13 tuổi cần phụ huynh)</option>
                <option value="T13">T13 (Từ 13 tuổi trở lên)</option>
                <option value="T16">T16 (Từ 16 tuổi trở lên)</option>
                <option value="T18">T18 (Từ 18 tuổi trở lên)</option>
                <option value="C">C (Cấm phổ biến)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày phát hành *</label>
              <input
                type="date"
                name="release_date"
                required
                value={formData.release_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc chiếu *</label>
              <input
                type="date"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đánh giá (Rating)</label>
              <input
                type="text"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="8.5/10"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ảnh Poster phim</label>
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
                  {selectedFile ? `File đã chọn: ${selectedFile.name}` : "Hỗ trợ định dạng JPG, PNG, WEBP. Chọn file mới để thay thế ảnh cũ."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Link Trailer YouTube</label>
            <input
              type="text"
              name="trailerUrl"
              value={formData.trailerUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Định dạng chiếu (cách nhau bởi dấu phẩy)</label>
            <input
              type="text"
              name="formats"
              value={formData.formats}
              onChange={handleChange}
              placeholder="Ví dụ: 2D, 3D, IMAX"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đạo diễn</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Tên đạo diễn"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nhà sản xuất</label>
              <input
                type="text"
                name="production_company" // Đồng bộ khớp hoàn toàn với state ở trên
                value={formData.production_company}
                onChange={handleChange}
                placeholder="Tên nhà sản xuất"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Danh sách diễn viên</label>
            <textarea
              name="cast"
              rows="2"
              value={formData.cast}
              onChange={handleChange}
              placeholder="Diễn viên A, Diễn viên B..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tóm tắt phim</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nội dung cốt truyện..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 bg-white resize-none"
            />
          </div>

          {/* Footer chứa nút bấm cố định dưới đáy */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 bg-white sticky bottom-0 left-0 right-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md disabled:bg-blue-300 flex items-center justify-center gap-2 transition-all text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}