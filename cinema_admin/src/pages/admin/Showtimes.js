import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, MapPin, LayoutGrid, Monitor } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { AddShowtime } from './showtime/AddShowtime';
import { EditShowtime } from './showtime/EditShowtime';

// Tự động sinh danh sách 7 ngày thực tế tính từ ngày hôm nay
const generateNext7Days = () => {
    const days = [];
    const daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;

        let label = '';
        if (i === 0) label = 'Hôm nay';
        else if (i === 1) label = 'Ngày mai';
        else label = daysOfWeek[date.getDay()];

        days.push({
            label,
            dateString,
            displayDate: `${dayStr}/${month}`
        });
    }
    return days;
};

export function Showtimes() {
    const filterDays = generateNext7Days();

    const [showtimes, setShowtimes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(filterDays[0].dateString);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedShowtime, setSelectedShowtime] = useState(null);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [showtimeRes, roomRes] = await Promise.all([
                axiosClient.get('/showtimes', { params: { date: selectedDate } }),
                axiosClient.get('/rooms')
            ]);

            const actualData = Array.isArray(showtimeRes.data)
                ? showtimeRes.data
                : (showtimeRes.data?.data || []);

            setShowtimes(actualData);
            setRooms(roomRes.data || []);
        } catch (err) {
            console.error("Lỗi khi lấy dữ liệu suất chiếu:", err);
            setShowtimes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (st, e) => {
        e.stopPropagation();
        setSelectedShowtime(st);
        setIsEditModalOpen(true);
    };

    const getOccupancyRate = (booked, capacity) => {
        if (!capacity) return 0;
        return Math.round((booked / capacity) * 100);
    };

    const getShowtimeTimes = (showtime) => {
        if (showtime.start_time) return [showtime.start_time];
        if (showtime.startTime) return [showtime.startTime];
        if (Array.isArray(showtime.start_times) && showtime.start_times.length) return showtime.start_times;
        if (Array.isArray(showtime.startTimes) && showtime.startTimes.length) return showtime.startTimes;
        return [];
    };

    const getGroupedShowtimes = () => {
        const groups = {};

        showtimes.forEach((st) => {
            const movieId = st.movie?.id || st.movie?._id || st.movieId || st.movie_id || 'unknown-movie';
            const roomId = st.room?.id || st.room?._id || st.roomId || st.room_id || 'unknown-room';
            const key = `${movieId}-${roomId}`;
            const timesFromRecord = getShowtimeTimes(st);

            if (!groups[key]) {
                groups[key] = {
                    id: st.id || st._id,
                    movie: st.movie,
                    movieTitleFallback: st.movieTitle || st.movieName || st.movie_name || st.title,
                    room: st.room,
                    showDate: st.showDate || st.show_date,
                    slots: timesFromRecord.map(t => ({
                        time: t,
                        rawRecord: st
                    }))
                };
            } else {
                timesFromRecord.forEach(t => {
                    if (!groups[key].slots.some(s => s.time === t)) {
                        groups[key].slots.push({
                            time: t,
                            rawRecord: st
                        });
                    }
                });
            }
        });

        Object.values(groups).forEach(group => {
            group.slots.sort((a, b) => a.time.localeCompare(b.time));
        });

        return Object.values(groups);
    };

    const groupedShowtimes = getGroupedShowtimes();

    // -- TIMELINE HELPERS --
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    const TIMELINE_START = 8 * 60; // 08:00
    const TIMELINE_END = 24 * 60; // 24:00
    const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;

    const renderTimeline = () => {
        if (loading) {
            return (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.85rem' }}>Đang tải lịch chiếu...</p>
                </div>
            );
        }

        const roomGroups = {};
        rooms.forEach(r => {
            roomGroups[r.id] = { room: r, slots: [] };
        });

        // Collect slots
        groupedShowtimes.forEach(group => {
            const rId = group.room?.id || group.room?._id || group.room?.roomId;
            if (!rId || !roomGroups[rId]) return;

            const duration = group.movie?.duration || 120;

            group.slots.forEach(slot => {
                const startMin = timeToMinutes(slot.time);
                let left = ((startMin - TIMELINE_START) / TIMELINE_DURATION) * 100;
                let width = (duration / TIMELINE_DURATION) * 100;
                
                if (left < 0) left = 0;
                if (left + width > 100) width = 100 - left;

                const capacity = group.room ? group.room.totalRows * group.room.totalColumns : 0;
                const booked = slot.rawRecord.bookedSeats || 0;
                const occupancy = getOccupancyRate(booked, capacity);
                let colorClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600';
                if (occupancy >= 80) colorClass = 'bg-red-500/20 border-red-500/50 text-red-600';
                else if (occupancy >= 50) colorClass = 'bg-yellow-500/20 border-yellow-500/50 text-yellow-600';

                roomGroups[rId].slots.push({
                    ...slot,
                    duration,
                    left,
                    width,
                    movieTitle: group.movie?.title || group.movieTitleFallback,
                    colorClass,
                    occupancy,
                    booked,
                    capacity
                });
            });
        });

        // Check conflicts
        Object.values(roomGroups).forEach(rg => {
            rg.slots.sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));
            for (let i = 0; i < rg.slots.length - 1; i++) {
                const currentEnd = timeToMinutes(rg.slots[i].time) + rg.slots[i].duration;
                const nextStart = timeToMinutes(rg.slots[i+1].time);
                if (currentEnd > nextStart) {
                    rg.slots[i].conflict = true;
                    rg.slots[i+1].conflict = true;
                }
            }
        });

        return (
            <div className="card overflow-hidden">
                <div className="card-head">
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Timeline Lịch chiếu (08:00 - 24:00)</span>
                    <div style={{ display:'flex', gap:'12px', fontSize:'0.75rem' }}>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/40"></div> Trống</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500/40"></div> Đang hot</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/40"></div> Gần đầy</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-rose-600 border border-rose-600"></div> Trùng lịch</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div style={{ minWidth: '900px' }}>
                        <div className="flex border-b border-[var(--border)] bg-[var(--bg-elevated)] sticky top-0 z-10 text-[var(--text-secondary)] text-xs font-bold">
                            <div className="w-36 flex-shrink-0 p-3 border-r border-[var(--border)]">Phòng chiếu</div>
                            <div className="flex-1 relative h-10">
                                {[8,10,12,14,16,18,20,22,24].map(hour => (
                                    <div key={hour} className="absolute top-0 bottom-0 border-l border-[var(--border)] pl-1 pt-2" style={{ left: `${((hour*60 - TIMELINE_START)/TIMELINE_DURATION)*100}%` }}>
                                        {hour}:00
                                    </div>
                                ))}
                            </div>
                        </div>
                        {Object.values(roomGroups).map(rg => (
                            <div key={rg.room.id} className="flex border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors relative group min-h-[70px]">
                                <div className="w-36 flex-shrink-0 p-3 border-r border-[var(--border)] font-bold text-sm text-[var(--text-primary)] flex flex-col justify-center">
                                    {rg.room.name}
                                    <span className="text-[0.65rem] text-[var(--text-muted)] font-normal">{rg.room.type}</span>
                                </div>
                                <div className="flex-1 relative bg-[var(--bg-input)]">
                                    {rg.slots.map((s, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={(e) => handleEditClick(s.rawRecord, e)}
                                            className={`absolute top-2 bottom-2 rounded-md border text-xs overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all group/slot ${s.conflict ? 'bg-rose-100 border-rose-500 text-rose-800' : s.colorClass}`}
                                            style={{ left: `${s.left}%`, width: `${s.width}%` }}
                                        >
                                            <div className="px-2 py-1 h-full flex flex-col justify-between">
                                                <div className="font-bold truncate">{s.movieTitle}</div>
                                                <div className="flex justify-between items-end opacity-80 group-hover/slot:opacity-100 font-medium text-[0.65rem]">
                                                    <span>{s.time} ({s.duration}')</span>
                                                    <span>{s.booked}/{s.capacity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-page">
            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Lịch & Suất chiếu</h1>
                    <p className="page-subtitle">Sắp xếp khung giờ, theo dõi lấp đầy ghế và tình trạng phòng</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={15} /> Thêm suất chiếu
                </button>
            </div>

            {/* MODALS */}
            <AddShowtime isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchData} />
            <EditShowtime isOpen={isEditModalOpen} showtime={selectedShowtime} onClose={() => { setIsEditModalOpen(false); setSelectedShowtime(null); }} onRefresh={fetchData} />

            {/* DATE FILTER */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }} className="custom-scrollbar">
                {filterDays.map(day => {
                    const isActive = selectedDate === day.dateString;
                    return (
                        <button
                            key={day.dateString}
                            onClick={() => setSelectedDate(day.dateString)}
                            style={{
                                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                minWidth: '100px', cursor: 'pointer', transition: 'var(--transition)',
                                background: isActive ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                border: '1px solid',
                                borderColor: isActive ? 'rgba(249,115,22,0.5)' : 'var(--border)',
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', opacity: isActive ? 0.9 : 0.6 }}>{day.label}</span>
                            <span style={{ fontSize: '1rem', fontWeight: '900' }}>{day.displayDate}</span>
                        </button>
                    );
                })}
            </div>

            {/* SHOWTIMES TIMELINE */}
            <div style={{ marginBottom: '24px' }}>
                {renderTimeline()}
            </div>

            {/* ROOM MONITOR */}
            <div className="card">
                <div className="card-head">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Monitor size={16} /> Giám sát trạng thái phòng
                    </span>
                </div>
                <div className="card-pad grid-3">
                    {rooms.map(room => {
                        const hasShowtimeToday = showtimes.some(st => st.room?.id === room.id);
                        return (
                            <div key={room.id} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <LayoutGrid size={15} style={{ color: 'var(--text-muted)' }} />
                                        <h4 style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{room.name}</h4>
                                    </div>
                                    <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{room.type}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <p style={{ marginBottom: '6px' }}>Sức chứa: <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{room.totalRows * room.totalColumns} ghế</span></p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Trạng thái: 
                                        {hasShowtimeToday ? (
                                            <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>Có lịch chiếu</span>
                                        ) : (
                                            <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Trống</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

export default Showtimes;