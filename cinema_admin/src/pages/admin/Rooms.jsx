import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Plus, Layout, PlusCircle, Layers, Trash2, AlertCircle, Maximize, Play, X } from 'lucide-react';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create & Edit Room state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: '2D', totalRows: 10, totalColumns: 12 });
  const [editingRoom, setEditingRoom] = useState(null);

  // Map state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axiosClient.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      toast.error('Lỗi tải danh sách phòng chiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/rooms', newRoom);
      toast.success('Thêm phòng chiếu thành công!');
      setShowCreateModal(false);
      setNewRoom({ name: '', type: '2D', totalRows: 10, totalColumns: 12 });
      fetchRooms();
    } catch (err) {
      toast.error('Không thể tạo phòng chiếu');
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/rooms/${editingRoom.id}`, editingRoom);
      toast.success('Cập nhật phòng chiếu thành công!');
      setShowEditModal(false);
      setEditingRoom(null);
      fetchRooms();
      if (selectedRoom?.id === editingRoom.id) {
        setSelectedRoom({ ...selectedRoom, ...editingRoom });
      }
    } catch (err) {
      toast.error('Không thể cập nhật phòng chiếu');
    }
  };

  const loadSeats = async (room) => {
    setSelectedRoom(room);
    setLoadingSeats(true);
    try {
      const res = await axiosClient.get(`/seats/room/${room.id}`);
      setSeats(res.data);
    } catch (err) {
      toast.error('Lỗi tải sơ đồ ghế');
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleGenerateSeats = async () => {
    if (!selectedRoom) return;
    try {
      setLoadingSeats(true);
      await axiosClient.post(`/seats/generate/${selectedRoom.id}`);
      toast.success('Khởi tạo sơ đồ ghế thành công!');
      loadSeats(selectedRoom);
    } catch (err) {
      toast.error('Lỗi khởi tạo ghế');
      setLoadingSeats(false);
    }
  };

  const handleSeatClick = async (seat) => {
    // Cycle types: NORMAL -> VIP -> COUPLE -> BROKEN -> NORMAL
    const typeCycle = {
      'NORMAL': 'VIP',
      'VIP': 'COUPLE',
      'COUPLE': 'BROKEN',
      'BROKEN': 'RESERVED',
      'RESERVED': 'NORMAL'
    };
    
    const newType = typeCycle[seat.seatType || 'NORMAL'] || 'NORMAL';
    
    // Optimistic UI update
    setSeats(prev => prev.map(s => s.id === seat.id ? { ...s, seatType: newType } : s));
    
    try {
      await axiosClient.put(`/seats/${seat.id}`, { seatType: newType });
    } catch (err) {
      // Revert if error
      toast.error('Không thể đổi loại ghế');
      setSeats(prev => prev.map(s => s.id === seat.id ? seat : s));
    }
  };

  const getSeatColor = (type) => {
    switch(type) {
      case 'VIP': return 'bg-orange-400 border-orange-500 shadow-orange-500/50 text-white';
      case 'COUPLE': return 'bg-pink-500 border-pink-600 shadow-pink-500/50 w-16 text-white';
      case 'BROKEN': return 'bg-gray-400 border-gray-500 opacity-50 cursor-not-allowed';
      case 'RESERVED': return 'bg-purple-500 border-purple-600 shadow-purple-500/50 text-white';
      default: return 'bg-white border-gray-300 hover:border-blue-500 text-gray-700'; // NORMAL
    }
  };

  // Group seats by row
  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.rowName]) acc[seat.rowName] = [];
    acc[seat.rowName].push(seat);
    return acc;
  }, {});

  // Sort rows A, B, C...
  const sortedRows = Object.keys(groupedSeats).sort();

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cấu Hình Phòng & Ghế</h1>
          <p className="page-subtitle">Quản lý sơ đồ phòng chiếu, phân loại ghế (VIP, Đôi, Thường, Hỏng, Đặt trước)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={15} /> Thêm Phòng Mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* ROOM LIST */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={16} /> Danh sách phòng chiếu
            </span>
            <span className="badge badge-orange">{rooms.length} phòng</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>Đang tải...</div>
            ) : rooms.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <h4>Chưa có phòng chiếu</h4>
                <p>Bấm "Thêm Phòng Mới" để bắt đầu</p>
              </div>
            ) : (
              rooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => loadSeats(room)}
                  className={`card-pad`}
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: selectedRoom?.id === room.id ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: selectedRoom?.id === room.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedRoom?.id === room.id ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: selectedRoom?.id === room.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {room.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setShowEditModal(true); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', fontSize: '0.85rem' }}
                      title="Sửa phòng"
                    >
                      ✏️
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span className="badge badge-gray" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{room.type}</span>
                    <span>{room.totalRows} hàng</span>
                    <span>•</span>
                    <span>{room.totalColumns} cột</span>
                    <span>•</span>
                    <span style={{ fontWeight: '700' }}>{room.totalRows * room.totalColumns} ghế</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEAT MAP */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px', background: 'var(--bg-surface)' }}>
          {!selectedRoom ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px', gap: '12px' }}>
              <Maximize size={48} style={{ opacity: 0.25 }} />
              <p style={{ fontWeight: '600' }}>Chọn một phòng chiếu bên trái để xem và cấu hình ghế</p>
            </div>
          ) : (
            <>
              {/* SEAT MAP HEADER */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px rgba(249,115,22,0.4)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.2 }}>{selectedRoom.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      <span className="badge badge-orange" style={{ fontSize: '0.6rem', marginRight: '8px' }}>{selectedRoom.type}</span>
                      {selectedRoom.totalRows} hàng × {selectedRoom.totalColumns} cột = {selectedRoom.totalRows * selectedRoom.totalColumns} ghế
                    </p>
                  </div>
                </div>
                {seats.length === 0 && !loadingSeats ? (
                  <button onClick={handleGenerateSeats} className="btn btn-primary">
                    <Layers size={15} /> Sinh ghế tự động
                  </button>
                ) : seats.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Click ghế để đổi loại
                    </span>
                    <button onClick={handleGenerateSeats} className="btn btn-secondary btn-sm" title="Tạo lại ghế">
                      <Layers size={13} /> Tạo lại
                    </button>
                  </div>
                )}
              </div>

              {/* SEAT MAP CANVAS */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', overflow: 'auto' }} className="custom-scrollbar">
                {loadingSeats ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <div className="spinner" style={{ width: '24px', height: '24px', margin: 0 }} /> Đang tải sơ đồ ghế...
                  </div>
                ) : seats.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    {/* SCREEN */}
                    <div style={{ width: '100%', maxWidth: '620px', marginBottom: '36px', position: 'relative' }}>
                      <div style={{ height: '3px', background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)', filter: 'blur(2px)', width: '100%' }} />
                      <div style={{ height: '4px', background: 'var(--accent-primary)', width: '100%', borderRadius: '10px', marginTop: '2px', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }} />
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '14px' }}>Màn Hình</p>
                    </div>

                    {/* SEATS GRID */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                      {sortedRows.map(row => (
                        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '22px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {groupedSeats[row].sort((a,b) => a.colIndex - b.colIndex).map(seat => {
                              let bg = 'rgba(255,255,255,0.08)', border = 'var(--border)', color = 'var(--text-primary)', width = '30px', shadow = 'none';
                              switch(seat.seatType) {
                                case 'VIP': bg = '#f97316'; border = '#ea580c'; color = 'white'; shadow = '0 0 8px rgba(249,115,22,0.3)'; break;
                                case 'COUPLE': bg = '#ec4899'; border = '#db2777'; color = 'white'; width = '66px'; shadow = '0 0 8px rgba(236,72,153,0.3)'; break;
                                case 'BROKEN': bg = '#334155'; border = '#1e293b'; color = '#64748b'; break;
                                case 'RESERVED': bg = '#8b5cf6'; border = '#7c3aed'; color = 'white'; shadow = '0 0 8px rgba(139,92,246,0.3)'; break;
                              }
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSeatClick(seat)}
                                  title={`${seat.seatNumber} — ${seat.seatType}`}
                                  style={{
                                    height: '30px', width, background: bg, borderBottom: `3px solid ${border}`,
                                    borderRadius: '5px 5px 3px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.6rem', fontWeight: '800', color, cursor: seat.seatType === 'BROKEN' ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.1s, box-shadow 0.1s', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                    boxShadow: shadow, outline: 'none',
                                  }}
                                  onMouseDown={e => { if (seat.seatType !== 'BROKEN') e.currentTarget.style.transform = 'scale(0.92)'; }}
                                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  {seat.seatType === 'BROKEN' ? <X size={10} /> : seat.seatNumber}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ width: '22px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row}</div>
                        </div>
                      ))}
                    </div>

                    {/* LEGEND */}
                    <div style={{ marginTop: '40px', display: 'flex', gap: '20px', background: 'var(--bg-elevated)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {[
                        { label: 'Thường', bg: 'rgba(255,255,255,0.08)', border: 'var(--border)' },
                        { label: 'VIP', bg: '#f97316', border: '#ea580c' },
                        { label: 'Couple', bg: '#ec4899', border: '#db2777', w: '46px' },
                        { label: 'Hỏng', bg: '#334155', border: '#1e293b' },
                        { label: 'Đặt trước', bg: '#8b5cf6', border: '#7c3aed' },
                      ].map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: l.w || '18px', height: '18px', borderRadius: '4px 4px 2px 2px', background: l.bg, borderBottom: `3px solid ${l.border}` }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px', background: 'rgba(249,115,22,0.06)', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(249,115,22,0.1)' }}>
                      💡 Click vào ghế để đổi loại: Thường → VIP → Đôi → Hỏng → Đặt trước → Thường
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
                    <AlertCircle size={32} style={{ opacity: 0.3 }} />
                    <span>Phòng này chưa có ghế. Bấm <strong>"Sinh ghế tự động"</strong> để khởi tạo.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
              <h3 className="modal-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} /> Thêm Phòng Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tên phòng chiếu</label>
                <input required type="text" placeholder="VD: Rạp 1, IMAX 1" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Định dạng</label>
                <select value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})} className="form-control">
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Số hàng</label>
                  <input required type="number" min="1" max="26" value={newRoom.totalRows} onChange={e => setNewRoom({...newRoom, totalRows: parseInt(e.target.value)})} className="form-control" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tối đa 26 (A-Z)</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Ghế mỗi hàng</label>
                  <input required type="number" min="1" max="50" value={newRoom.totalColumns} onChange={e => setNewRoom({...newRoom, totalColumns: parseInt(e.target.value)})} className="form-control" />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '12px 0 0', border: 'none' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Tạo phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingRoom && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'var(--gradient-primary)', border: 'none' }}>
              <h3 className="modal-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Cập Nhật Phòng
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateRoom} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tên phòng chiếu</label>
                <input required type="text" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Định dạng</label>
                <select value={editingRoom.type} onChange={e => setEditingRoom({...editingRoom, type: e.target.value})} className="form-control">
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Số hàng</label>
                  <input required type="number" min="1" max="26" value={editingRoom.totalRows} onChange={e => setEditingRoom({...editingRoom, totalRows: parseInt(e.target.value)})} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ghế mỗi hàng</label>
                  <input required type="number" min="1" max="50" value={editingRoom.totalColumns} onChange={e => setEditingRoom({...editingRoom, totalColumns: parseInt(e.target.value)})} className="form-control" />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '12px 0 0', border: 'none' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
