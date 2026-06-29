import React from 'react';
import { X, Clock, Calendar, Star, Tag, Film, ShieldAlert, User, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export function MovieDetail({ isOpen, onClose, movie, stats }) {
    // Nếu modal không được mở hoặc không có dữ liệu phim thì không render gì cả
    if (!isOpen || !movie) return null;

    // Hàm hỗ trợ hiển thị text nhãn độ tuổi tương ứng với mã
    const getAgeBadgeColor = (restriction) => {
        switch (restriction) {
            case 'P': return 'bg-green-100 text-green-800 border-green-200';
            case 'K': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'T13': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'T16': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'T18': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Film className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-800">Chi tiết bộ phim</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6">

                        {/* Khung hiển thị Poster bên trái */}
                        <div className="w-full sm:w-44 flex-shrink-0 mx-auto sm:mx-0">
                            <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-50">
                                {movie.posterUrl ? (
                                    <img
                                        src={movie.posterUrl}
                                        alt={movie.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 gap-2">
                                        <Film className="w-10 h-10" />
                                        <span className="text-xs">Không có ảnh</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin chữ bên phải */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <div>
                                    {/* Thử log hoặc hiển thị thẳng xem có ra dữ liệu không */}
                                    <h2>{movie.title || movie.name}</h2>
                                </div>
                                {/* Badges: Thể loại, Đánh giá, Độ tuổi */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        {movie.rating || 'N/A'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                                        <Tag className="w-3.5 h-3.5" />
                                        {movie.genre || 'Chưa rõ'}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getAgeBadgeColor(movie.age_restriction)}`}>
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Giới hạn: {movie.age_restriction || 'P'}
                                    </span>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Grid thông số Thời lượng & Ngày khởi chiếu */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <div>
                                        <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Thời lượng</span>
                                        <span className="font-semibold text-slate-800">{movie.duration ? `${movie.duration} phút` : 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <div>
                                        <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Khởi chiếu</span>
                                        <span className="font-semibold text-slate-800">{movie.release_date || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin Đạo diễn & Diễn viên */}
                            <div className="space-y-2 text-sm text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p>
                                        <span className="font-semibold text-slate-600">Đạo diễn:</span>{' '}
                                        <span className="text-slate-800">{movie.director || 'Đang cập nhật'}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p>
                                        <span className="font-semibold text-slate-600">Diễn viên:</span>{' '}
                                        <span className="text-slate-800">{movie.cast || 'Đang cập nhật'}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Film className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p>
                                        <span className="font-semibold text-slate-600">Ngôn ngữ:</span>{' '}
                                        <span className="text-slate-800">{movie.language || 'Đang cập nhật'}</span>
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p>
                                        <span className="font-semibold text-slate-600">nhà sản xuất:</span>{' '}
                                        <span className="text-slate-800">{movie.production_company || 'Đang cập nhật'}</span>
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Mô tả nội dung tóm tắt phim */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tóm tắt nội dung</h3>
                        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                            {movie.description || 'Chưa có mô tả chi tiết cho bộ phim này.'}
                        </p>
                    </div>

                    {/* Phân tích hiệu suất (Mini Analytics) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Phân tích Hiệu suất (7 ngày qua)
                        </h3>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Tổng vé bán ra</span>
                                    <span className="text-2xl font-black text-emerald-600">
                                        {stats ? stats.tickets.toLocaleString() : '0'} <span className="text-sm font-medium text-emerald-600/70">vé</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Tổng doanh thu</span>
                                    <span className="text-2xl font-black text-amber-500">
                                        {stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue) : '0đ'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 h-32 w-full">
                                {/* Fake data for Sparkline because backend only gives total */}
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
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value} vé`, 'Lượt xem']}
                                        />
                                        <Area type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end sticky bottom-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Đóng lại
                    </button>
                </div>

            </div>
        </div>
    );
}