import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Star, Clock, CalendarDays, Film, CalendarClock, Play, X, Ticket, DollarSign } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { AddMovie } from './movie/AddMovie';
import { EditMovie } from './movie/EditMovie';
import { MovieDetail } from './movie/MovieDetail';
import { AddShowtime } from './showtime/AddShowtime';

export function Movies() {
    const [searchTerm, setSearchTerm] = useState('');
    const [movies, setMovies] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
    const [sortOption, setSortOption] = useState('Mới nhất');
    const [movieStats, setMovieStats] = useState({});
    
    // Quick Add Showtime state
    const [isQuickAddShowtimeOpen, setIsQuickAddShowtimeOpen] = useState(false);
    const [selectedMovieIdForShowtime, setSelectedMovieIdForShowtime] = useState(null);

    // Trailer Preview state
    const [playingTrailerUrl, setPlayingTrailerUrl] = useState(null);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            const [res, statsRes] = await Promise.all([
                axiosClient.get('/movies'),
                axiosClient.get('/admin/stats/revenue')
            ]);
            
            if (Array.isArray(res.data)) {
                const formattedMovies = res.data.map(movie => ({
                    ...movie,
                    title: movie.title || movie.name || 'Phim chưa rõ tên'
                }));
                setMovies(formattedMovies);
            } else {
                console.error("Expected an array but got:", res.data);
                setMovies([]);
            }

            if (statsRes.data && statsRes.data.movieRevenue) {
                const statsMap = {};
                statsRes.data.movieRevenue.forEach(stat => {
                    statsMap[stat.movie] = {
                        tickets: Number(stat.tickets) || 0,
                        revenue: Number(stat.revenue) || 0
                    };
                });
                setMovieStats(statsMap);
            }
        } catch (err) {
            console.error("Không thể lấy danh sách phim", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn ngừng chiếu bộ phim này?")) {
            try {
                await axiosClient.delete(`/movies/${id}`);
                fetchMovies();
            } catch (err) {
                alert("Cập nhật trạng thái thất bại!");
            }
        }
    };

    const handleEdit = (movie) => {
        setSelectedMovie(movie);
        setIsEditOpen(true);
    };

    const handleCloseEdit = () => {
        setSelectedMovie(null);
        setIsEditOpen(false);
    };

    const handleViewDetail = (movie) => {
        setSelectedMovie(movie);
        setIsDetailOpen(true);
    };

    const handleToggleHot = async (movie) => {
        try {
            await axiosClient.put(`/movies/${movie.id}/toggle-hot`);
            fetchMovies();
        } catch (err) {
            console.error("Không thể lật trạng thái HOT", err);
            alert("Có lỗi xảy ra khi ghim phim!");
        }
    };

    const handleQuickAddShowtime = (movie) => {
        setSelectedMovieIdForShowtime(movie.id);
        setIsQuickAddShowtimeOpen(true);
    };

    const handlePlayTrailer = (url) => {
        if (!url) return;
        // Convert watch?v=ABC to embed/ABC?autoplay=1
        let embedUrl = url;
        if (url.includes('watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/') + '?autoplay=1';
        } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1';
        }
        setPlayingTrailerUrl(embedUrl);
    };

    const filteredMovies = movies.filter((movie) => {
        const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (movie.genre && movie.genre.toLowerCase().includes(searchTerm.toLowerCase()));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const releaseDate = new Date(movie.release_date);
        const endDate = movie.end_date ? new Date(movie.end_date) : new Date(8640000000000000); // Tương lai xa nếu không có

        let matchesStatus = true;
        if (statusFilter === 'Sắp chiếu') {
            matchesStatus = releaseDate > today;
        } else if (statusFilter === 'Đang chiếu') {
            matchesStatus = releaseDate <= today && today <= endDate;
        } else if (statusFilter === 'Ngừng chiếu') {
            matchesStatus = today > endDate;
        }

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (a.is_hot !== b.is_hot) {
            return (b.is_hot === true ? 1 : 0) - (a.is_hot === true ? 1 : 0);
        }
        
        if (sortOption === 'Doanh thu cao nhất') {
            const revA = movieStats[a.title]?.revenue || 0;
            const revB = movieStats[b.title]?.revenue || 0;
            return revB - revA;
        } else if (sortOption === 'Lượt vé nhiều nhất') {
            const tktA = movieStats[a.title]?.tickets || 0;
            const tktB = movieStats[b.title]?.tickets || 0;
            return tktB - tktA;
        } else if (sortOption === 'Điểm đánh giá cao nhất') {
            const scoreA = a.averageScore || 0;
            const scoreB = b.averageScore || 0;
            return scoreB - scoreA;
        } else {
            // Mới nhất (Mặc định)
            return new Date(b.release_date) - new Date(a.release_date);
        }
    });

    return (
        <div className="admin-page">
            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Phim</h1>
                    <p className="page-subtitle">Quản lý danh mục phim, trailer và poster hiển thị</p>
                </div>
                <button 
                    onClick={() => setIsAddOpen(true)} 
                    className="btn btn-primary"
                >
                    <Plus size={15} />
                    Thêm phim mới
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="filter-bar">
                    <div className="search-wrap" style={{ flex: 1, minWidth: '220px' }}>
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên phim, thể loại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-control"
                        style={{ width: '180px' }}
                    >
                        <option>Tất cả trạng thái</option>
                        <option>Sắp chiếu</option>
                        <option>Đang chiếu</option>
                        <option>Ngừng chiếu</option>
                    </select>
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="form-control"
                        style={{ width: '180px' }}
                    >
                        <option>Mới nhất</option>
                        <option>Doanh thu cao nhất</option>
                        <option>Lượt vé nhiều nhất</option>
                        <option>Điểm đánh giá cao nhất</option>
                    </select>
                </div>
            </div>

            {/* MOVIES GRID */}
            {filteredMovies.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Film size={40} />
                        <h4>Không tìm thấy phim nào</h4>
                        <p>Thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại</p>
                    </div>
                </div>
            ) : (
                <div className="grid-4">
                    {filteredMovies.map((movie) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isUpcoming = new Date(movie.release_date) > today;
                        const isEnded = movie.end_date && today > new Date(movie.end_date);

                        return (
                            <div key={movie.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* POSTER AREA */}
                                <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                    {movie.posterUrl ? (
                                        <img 
                                            src={movie.posterUrl} 
                                            alt={movie.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                                            <span style={{ fontSize: '2rem', fontWeight: '800' }}>{movie.title.charAt(0)}</span>
                                            <span style={{ fontSize: '0.75rem', padding: '0 10px', textAlign: 'center' }}>{movie.title}</span>
                                        </div>
                                    )}
                                    
                                    {/* BADGES */}
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className={`badge ${isUpcoming ? 'badge-yellow' : isEnded ? 'badge-gray' : 'badge-green'}`} style={{ backdropFilter: 'blur(4px)', background: isUpcoming ? 'rgba(245,158,11,0.85)' : isEnded ? 'rgba(107,114,128,0.85)' : 'rgba(34,197,94,0.85)', color: 'white', border: 'none' }}>
                                            {isUpcoming ? 'Sắp chiếu' : isEnded ? 'Ngừng chiếu' : 'Đang chiếu'}
                                        </span>
                                        {movie.formats && movie.formats.split(',').map((f, i) => (
                                            <span key={i} className="badge badge-gray" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', border: 'none', fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                                                {f.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                        <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fbbf24', border: 'none', fontWeight: '700' }}>
                                            <Star size={11} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                                            {movie.averageScore ? movie.averageScore.toFixed(1) : (movie.rating || 'N/A')}
                                        </span>
                                        {movie.totalReviews && (
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px' }}>
                                                {movie.totalReviews} lượt
                                            </span>
                                        )}
                                    </div>

                                    {/* HOVER OVERLAY */}
                                    <div className="hover-overlay" style={{
                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: 0, transition: 'var(--transition)'
                                    }}>
                                        {movie.trailerUrl && (
                                            <button className="btn-icon btn" onClick={() => handlePlayTrailer(movie.trailerUrl)} style={{ background: '#ef4444', color: 'white' }} title="Xem Trailer">
                                                <Play size={16} fill="white" />
                                            </button>
                                        )}
                                        <button className="btn-icon btn" onClick={() => handleToggleHot(movie)} style={{ background: movie.is_hot ? '#eab308' : '#4b5563', color: 'white' }} title={movie.is_hot ? "Bỏ ghim" : "Ghim phim HOT"}>
                                            <Star size={16} fill={movie.is_hot ? "white" : "none"} />
                                        </button>
                                        <button className="btn-icon btn" onClick={() => handleQuickAddShowtime(movie)} style={{ background: '#10b981', color: 'white' }} title="Lên lịch chiếu">
                                            <CalendarClock size={16} />
                                        </button>
                                        <button className="btn-icon btn" onClick={() => handleViewDetail(movie)} style={{ background: 'white', color: 'black' }} title="Chi tiết">
                                            <Eye size={16} />
                                        </button>
                                        <button className="btn-icon btn" onClick={() => handleEdit(movie)} style={{ background: 'var(--accent-primary)', color: 'white' }} title="Sửa">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon btn" onClick={() => handleDelete(movie.id)} style={{ background: '#ef4444', color: 'white' }} title="Xóa">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* INFO AREA */}
                                <div className="card-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={movie.title}>
                                            {movie.title}
                                        </h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {movie.genre || 'Chưa phân loại'}
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: 'auto' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} /> Thời lượng
                                            </div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                                                {movie.duration ? `${movie.duration} phút` : 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CalendarDays size={10} /> Khởi chiếu
                                            </div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                                                {movie.release_date || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ANALYTICS AREA */}
                                    {movieStats[movie.title] && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Ticket size={10} color="#10b981" /> Vé bán ra
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981' }}>
                                                    {movieStats[movie.title].tickets} vé
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <DollarSign size={10} color="#eab308" /> Doanh thu
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#eab308' }}>
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(movieStats[movie.title].revenue) || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODALS */}
            {isAddOpen && <AddMovie isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onRefresh={fetchMovies} />}
            {isEditOpen && selectedMovie && (
                <EditMovie 
                    isOpen={isEditOpen} 
                    onClose={handleCloseEdit} 
                    onRefresh={fetchMovies} 
                    movie={selectedMovie} 
                />
            )}
            {/* MOVIE DETAIL MODAL */}
            {selectedMovie && (
                <MovieDetail 
                    isOpen={isDetailOpen} 
                    onClose={() => { setIsDetailOpen(false); setSelectedMovie(null); }} 
                    movie={selectedMovie} 
                    stats={movieStats[selectedMovie.title]}
                />
            )}
            {isQuickAddShowtimeOpen && (
                <AddShowtime 
                    isOpen={isQuickAddShowtimeOpen} 
                    onClose={() => setIsQuickAddShowtimeOpen(false)} 
                    onRefresh={() => {}} 
                    preselectedMovieId={selectedMovieIdForShowtime}
                />
            )}

            {/* TRAILER MODAL */}
            {playingTrailerUrl && (
                <div 
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999, 
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
                    }}
                    onClick={() => setPlayingTrailerUrl(null)}
                >
                    <button 
                        onClick={() => setPlayingTrailerUrl(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '30px', 
                            background: 'transparent', border: 'none', color: 'white', 
                            cursor: 'pointer', padding: '10px'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <div 
                        style={{ width: '100%', maxWidth: '1000px', aspectRatio: '16/9', background: 'black', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
                    >
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src={playingTrailerUrl} 
                            title="Trailer" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}