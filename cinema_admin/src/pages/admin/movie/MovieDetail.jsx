import React from 'react';
import { X, Clock, Calendar, Star, Tag, Film, ShieldAlert, User, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export function MovieDetail({ isOpen, onClose, movie, stats }) {
    // Nếu modal không được mở hoặc không có dữ liệu phim thì không render gì cả
    if (!isOpen || !movie) return null;

    const getAgeBadgeColor = (restriction) => {
        switch (restriction) {
            case 'P': return 'badge-green';
            case 'K': return 'badge-blue';
            case 'T13': return 'badge-yellow';
            case 'T16': return 'badge-orange';
            case 'T18': return 'badge-red';
            default: return 'badge-gray';
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '960px' }}>

                <div className="modal-header">
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Film size={18} style={{ color: 'var(--accent-primary)' }} />
                        Chi tiết bộ phim
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body custom-scrollbar" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                        
                        {/* Cột Trái: Poster + Mô tả */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ aspectRatio: '2/3', width: '100%', maxWidth: '240px', margin: '0 auto', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', background: 'var(--bg-elevated)' }}>
                                {movie.posterUrl ? (
                                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '8px', background: 'var(--bg-input)' }}>
                                        <Film size={40} />
                                        <span style={{ fontSize: '0.75rem' }}>Không có ảnh</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Mô tả */}
                            <div style={{ flex: 1 }}>
                                <h3 className="form-label" style={{ marginBottom: '6px' }}>Tóm tắt nội dung</h3>
                                <p style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '14px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.7', whiteSpace: 'pre-line', margin: 0 }}>
                                    {movie.description || 'Chưa có mô tả chi tiết cho bộ phim này.'}
                                </p>
                            </div>
                        </div>

                        {/* Cột Phải: Info + Analytics */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Header Info */}
                            <div>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>{movie.title || movie.name}</h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                    <span className="badge badge-orange" style={{ fontWeight: '700', fontSize: '0.75rem' }}>
                                        <Star size={12} style={{ fill: '#f97316', marginRight: '2px' }} />
                                        {movie.rating || 'N/A'}
                                    </span>
                                    <span className="badge badge-blue" style={{ fontWeight: '600', fontSize: '0.75rem' }}>
                                        <Tag size={12} style={{ marginRight: '2px' }} />
                                        {movie.genre || 'Chưa rõ'}
                                    </span>
                                    <span className={`badge ${getAgeBadgeColor(movie.age_restriction)}`} style={{ fontWeight: '600', fontSize: '0.75rem' }}>
                                        <ShieldAlert size={12} style={{ marginRight: '2px' }} />
                                        {movie.age_restriction || 'P'}
                                    </span>
                                </div>
                            </div>

                            {/* Info cards */}
                            <div className="grid-2" style={{ gap: '10px' }}>
                                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
                                    <Clock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thời lượng</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{movie.duration ? `${movie.duration} phút` : 'N/A'}</span>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
                                    <Calendar size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Khởi chiếu</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{movie.release_date || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Director, Cast, etc */}
                            <div className="grid-2" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '14px', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <User size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Đạo diễn:</span> {movie.director || 'Đang cập nhật'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <Users size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Diễn viên:</span> {movie.cast || 'Đang cập nhật'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <Film size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Ngôn ngữ:</span> {movie.language || 'Đang cập nhật'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <Users size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Sản xuất:</span> {movie.production_company || 'Đang cập nhật'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Analytics */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <TrendingUp size={14} /> Hiệu suất
                                </h3>
                                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
                                            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                                                <span className="form-label">Tổng vé bán ra</span>
                                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#22c55e', lineHeight: 1.2 }}>
                                                    {stats ? stats.tickets.toLocaleString() : '0'}
                                                    <span style={{ fontSize: '0.75rem', color: 'rgba(34,197,94,0.7)', fontWeight: '600', marginLeft: '4px' }}>vé</span>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                                                <span className="form-label">Tổng doanh thu</span>
                                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b', lineHeight: 1.2 }}>
                                                    {stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue) : '0đ'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, height: '140px', display: 'flex', alignItems: 'center' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={[
                                                    { name: 'T2', tickets: Math.floor(Math.random() * 50) + 10 },
                                                    { name: 'T3', tickets: Math.floor(Math.random() * 50) + 10 },
                                                    { name: 'T4', tickets: Math.floor(Math.random() * 50) + 20 },
                                                    { name: 'T5', tickets: Math.floor(Math.random() * 50) + 15 },
                                                    { name: 'T6', tickets: Math.floor(Math.random() * 80) + 40 },
                                                    { name: 'T7', tickets: Math.floor(Math.random() * 100) + 60 },
                                                    { name: 'CN', tickets: Math.floor(Math.random() * 90) + 50 }
                                                ]}>
                                                    <defs>
                                                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }} formatter={(value) => [`${value} vé`, 'Lượt vé']} />
                                                    <Area type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Đóng lại</button>
                </div>

            </div>
        </div>
    );
}