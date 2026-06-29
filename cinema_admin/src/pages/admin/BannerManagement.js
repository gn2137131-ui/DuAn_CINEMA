import React, { useState, useEffect, useCallback } from 'react';
import { GripVertical, Trash2, Plus, Monitor, Save, Eye, Star, X, Search, Image } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const MAX_BANNERS = 6;
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function BannerManagement() {
    const [allMovies, setAllMovies] = useState([]);
    const [bannerMovies, setBannerMovies] = useState([]); // [{id, title, poster, banner, rating, ageRestriction}]
    const [searchTerm, setSearchTerm] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    // Load phim từ API
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const res = await axiosClient.get('/movies');
                setAllMovies(res.data || []);
            } catch (err) {
                console.error('Không thể tải danh sách phim', err);
            }
        };
        fetchMovies();
    }, []);

    // Load banner đã lưu từ API backend
    useEffect(() => {
        const fetchBannerConfig = async () => {
            try {
                const res = await axiosClient.get('/banner-config');
                const movies = res.data || [];
                // Map về format dùng trong UI
                const bannerItems = movies.map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.posterUrl || '',
                    banner: m.bannerUrl || m.posterUrl || '',
                    rating: m.rating || '0',
                    ageRating: m.age_restriction || m.ageRestriction || 'P',
                    genre: m.genre || '',
                    duration: m.duration || 0,
                    description: m.description || '',
                    language: m.language || '',
                }));
                setBannerMovies(bannerItems);
            } catch (e) {
                console.error('Lỗi tải cấu hình banner từ API', e);
            }
        };
        fetchBannerConfig();
    }, []);

    // Lưu banner qua API backend
    const handleSave = async () => {
        try {
            const movieIds = bannerMovies.map(m => m.id);
            await axiosClient.post('/banner-config', movieIds);
            setIsSaved(true);
            toast.success('Đã lưu cấu hình banner lên server!');
            setTimeout(() => setIsSaved(false), 3000);
        } catch (e) {
            console.error(e);
            toast.error('Lỗi khi lưu banner! Kiểm tra lại đăng nhập admin.');
        }
    };

    // Thêm phim vào banner
    const handleAddMovie = (movie) => {
        if (bannerMovies.length >= MAX_BANNERS) {
            toast.error(`Tối đa ${MAX_BANNERS} phim trong banner!`);
            return;
        }
        if (bannerMovies.find(m => m.id === movie.id)) {
            toast.error('Phim này đã có trong banner!');
            return;
        }
        const bannerItem = {
            id: movie.id,
            title: movie.title,
            poster: movie.posterUrl || '',
            banner: movie.bannerUrl || movie.posterUrl || '',
            rating: movie.rating || '0',
            ageRating: movie.age_restriction || movie.ageRestriction || 'P',
            genre: movie.genre || '',
            duration: movie.duration || 0,
            description: movie.description || '',
            language: movie.language || '',
        };
        setBannerMovies(prev => [...prev, bannerItem]);
        toast.success(`Đã thêm "${movie.title}" vào banner`);
    };

    // Xóa phim khỏi banner
    const handleRemove = (id) => {
        setBannerMovies(prev => {
            const updated = prev.filter(m => m.id !== id);
            if (previewIndex >= updated.length) setPreviewIndex(Math.max(0, updated.length - 1));
            return updated;
        });
    };

    // Drag & drop reorder
    const handleDragStart = (index) => setDragIndex(index);

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        setBannerMovies(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(dragIndex, 1);
            updated.splice(index, 0, moved);
            setDragIndex(index);
            return updated;
        });
    };

    const handleDragEnd = () => setDragIndex(null);

    // Phim chưa có trong banner
    const availableMovies = allMovies.filter(m =>
        !bannerMovies.find(b => b.id === m.id) &&
        (m.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentPreview = bannerMovies[previewIndex];

    return (
        <div className="admin-page">

            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h2 className="page-title flex items-center gap-2">
                        <Monitor className="w-7 h-7 text-orange-500" />
                        Quản lý Banner
                    </h2>
                    <p className="page-subtitle mt-1">
                        Chọn tối đa {MAX_BANNERS} phim để hiển thị trên banner trang chủ. Kéo để sắp xếp thứ tự.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPicker(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus className="w-4 h-4" />
                        Thêm phim
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={bannerMovies.length === 0}
                        className={`btn ${isSaved ? '' : 'btn-primary'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isSaved ? '#22c55e' : '', color: isSaved ? 'white' : '' }}
                    >
                        <Save className="w-4 h-4" />
                        {isSaved ? 'Đã lưu!' : 'Lưu cấu hình'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>

                {/* LEFT: Banner list */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                                Phim trong banner
                                <span className="badge" style={{ marginLeft: '8px', background: bannerMovies.length >= MAX_BANNERS ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)', color: bannerMovies.length >= MAX_BANNERS ? '#ef4444' : '#f97316' }}>
                                    {bannerMovies.length}/{MAX_BANNERS}
                                </span>
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kéo để sắp xếp</span>
                        </div>

                        {bannerMovies.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                <Image style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '8px' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chưa có phim nào trong banner</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Nhấn "Thêm phim" để bắt đầu</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {bannerMovies.map((movie, index) => (
                                    <div
                                        key={movie.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => setPreviewIndex(index)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                                            borderColor: previewIndex === index ? 'var(--accent-warning)' : 'var(--border)',
                                            background: previewIndex === index ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
                                            opacity: dragIndex === index ? 0.5 : 1, transform: dragIndex === index ? 'scale(0.98)' : 'scale(1)'
                                        }}
                                    >
                                        {/* Drag handle */}
                                        <GripVertical style={{ width: '16px', height: '16px', color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />

                                        {/* Order number */}
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
                                            background: previewIndex === index ? 'var(--accent-warning)' : 'var(--bg-surface)', color: previewIndex === index ? 'white' : 'var(--text-muted)'
                                        }}>
                                            {index + 1}
                                        </div>

                                        {/* Poster */}
                                        <div style={{ width: '40px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)' }}>
                                            {movie.poster ? (
                                                <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.125rem', fontWeight: '700' }}>
                                                    {movie.title?.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <Star style={{ width: '12px', height: '12px', color: '#fbbf24', fill: '#fbbf24' }} />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{movie.rating}</span>
                                                {movie.ageRating && (
                                                    <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        {movie.ageRating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemove(movie.id); }}
                                            className="btn"
                                            style={{ padding: '6px', background: 'transparent', color: '#ef4444', flexShrink: 0 }}
                                        >
                                            <Trash2 style={{ width: '16px', height: '16px' }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column' }}>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="card-head" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)' }}>
                            <Eye style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Xem trước Banner</span>
                            {currentPreview && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Slide {previewIndex + 1}/{bannerMovies.length}</span>
                            )}
                        </div>

                        {currentPreview ? (
                            <div style={{ position: 'relative', height: '300px', background: 'black', overflow: 'hidden' }}>
                                {/* Banner bg */}
                                <img
                                    src={currentPreview.banner || currentPreview.poster}
                                    alt={currentPreview.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.5), transparent)' }} />

                                {/* Content */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
                                    <div style={{ maxWidth: '400px' }}>
                                        {/* Badges */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ background: 'linear-gradient(to right, #dc2626, #f97316)', color: 'white', fontSize: '0.75rem', fontWeight: '900', padding: '4px 12px', borderRadius: '99px', textTransform: 'uppercase' }}>
                                                🔥 Phim Hot
                                            </span>
                                            {currentPreview.ageRating && (
                                                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', fontWeight: '600', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.3)' }}>
                                                    {currentPreview.ageRating}
                                                </span>
                                            )}
                                            <span style={{ background: 'rgba(250,204,21,0.9)', color: '#111827', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Star style={{ width: '12px', height: '12px', fill: 'currentColor' }} />
                                                {currentPreview.rating}
                                            </span>
                                        </div>

                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', lineHeight: 1.2, marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                            {currentPreview.title}
                                        </h2>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '16px' }}>
                                            {currentPreview.duration} phút • {currentPreview.genre}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {currentPreview.description}
                                        </p>

                                        {/* Buttons preview */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                            <div style={{ background: 'linear-gradient(to right, #dc2626, #f97316)', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '8px 16px', borderRadius: '99px' }}>
                                                🎫 Đặt Vé Ngay
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '0.75rem', fontWeight: '600', padding: '8px 16px', borderRadius: '99px' }}>
                                                ▶ Xem Trailer
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dots */}
                                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                                    {bannerMovies.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPreviewIndex(i)}
                                            style={{
                                                borderRadius: '99px', transition: 'all 0.3s', border: 'none', cursor: 'pointer',
                                                width: i === previewIndex ? '20px' : '6px', height: '6px', background: i === previewIndex ? '#fb923c' : 'rgba(255,255,255,0.4)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                                <Monitor style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.875rem' }}>Thêm phim để xem trước banner</p>
                            </div>
                        )}

                        {/* Thumbnail strip */}
                        {bannerMovies.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
                                {bannerMovies.map((movie, i) => (
                                    <button
                                        key={movie.id}
                                        onClick={() => setPreviewIndex(i)}
                                        style={{
                                            flexShrink: 0, width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '2px solid', transition: 'all 0.2s', cursor: 'pointer', padding: 0,
                                            borderColor: i === previewIndex ? 'var(--accent-warning)' : 'transparent', transform: i === previewIndex ? 'scale(1.1)' : 'scale(1)', opacity: i === previewIndex ? 1 : 0.6
                                        }}
                                    >
                                        <img
                                            src={movie.poster}
                                            alt={movie.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lưu ý */}
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-lg)', fontSize: '0.75rem', color: '#60a5fa' }}>
                        💡 Sau khi lưu, banner trang chủ sẽ tự động cập nhật theo thứ tự đã chọn. Kéo thả để thay đổi thứ tự hiển thị.
                    </div>
                </div>
            </div>

            {/* MOVIE PICKER MODAL */}
            {showPicker && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Modal header */}
                        <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>Chọn phim cho banner</h3>
                            <button
                                onClick={() => { setShowPicker(false); setSearchTerm(''); }}
                                className="btn"
                                style={{ padding: '8px', background: 'transparent' }}
                            >
                                <X style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm tên phim..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Movie list */}
                        <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableMovies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    <Search style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem' }}>Không tìm thấy phim nào</p>
                                </div>
                            ) : (
                                availableMovies.map(movie => (
                                    <button
                                        key={movie.id}
                                        onClick={() => handleAddMovie(movie)}
                                        disabled={bannerMovies.length >= MAX_BANNERS}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: bannerMovies.length >= MAX_BANNERS ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s', opacity: bannerMovies.length >= MAX_BANNERS ? 0.5 : 1
                                        }}
                                    >
                                        <div style={{ width: '40px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)' }}>
                                            {movie.posterUrl ? (
                                                <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: '700', fontSize: '1.125rem' }}>
                                                    {movie.title?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {movie.title}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.genre}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>
                                                    <Star style={{ width: '12px', height: '12px', fill: '#fbbf24', stroke: '#fbbf24' }} />
                                                    {movie.rating || 'N/A'}
                                                </span>
                                                {(movie.age_restriction || movie.ageRestriction) && (
                                                    <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                        {movie.age_restriction || movie.ageRestriction}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Plus style={{ width: '20px', height: '20px', color: 'var(--accent-primary)', flexShrink: 0 }} />
                                    </button>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {bannerMovies.length}/{MAX_BANNERS} phim đã chọn
                            {bannerMovies.length >= MAX_BANNERS && (
                                <span style={{ color: '#ef4444', marginLeft: '8px' }}>• Đã đạt giới hạn tối đa</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BannerManagement;
