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
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={15} /> Thêm Phòng Mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* ROOM LIST */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={16} /> Danh sách phòng chiếu
            </span>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>Đang tải...</div>
            ) : rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa có phòng chiếu nào</div>
            ) : (
              rooms.map(room => (
                <div 
                  key={room.id}
                  onClick={() => loadSeats(room)}
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: selectedRoom?.id === room.id ? 'rgba(249,115,22,0.1)' : 'var(--bg-input)',
                    border: selectedRoom?.id === room.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = 'var(--bg-input)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', color: selectedRoom?.id === room.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{room.name}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{room.type}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setShowEditModal(true); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                        title="Sửa phòng"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                    <span>{room.totalRows} hàng</span>
                    <span>{room.totalColumns} cột</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEAT MAP */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px', background: 'var(--bg-surface)' }}>
          {!selectedRoom ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <Maximize size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Chọn một phòng chiếu bên trái để xem và cấu hình ghế</p>
            </div>
          ) : (
            <>
              {/* SEAT MAP HEADER */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedRoom.name}</h3>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.9rem' }}>Định dạng: {selectedRoom.type} • Kích thước: {selectedRoom.totalRows}x{selectedRoom.totalColumns}</p>
                </div>
                {seats.length === 0 && !loadingSeats && (
                  <button onClick={handleGenerateSeats} className="btn btn-primary">
                    <Layers size={15} /> Sinh ghế tự động
                  </button>
                )}
              </div>

              {/* SEAT MAP CANVAS */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', overflow: 'auto' }}>
                {loadingSeats ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--accent-info)', fontWeight: '600' }}>
                    Đang tải sơ đồ ghế...
                  </div>
                ) : seats.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    {/* SCREEN ARC */}
                    <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px', position: 'relative' }}>
                      <div style={{ height: '3px', background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)', filter: 'blur(2px)', width: '100%' }} />
                      <div style={{ height: '4px', background: 'var(--accent-primary)', width: '100%', borderRadius: '10px', marginTop: '2px', boxShadow: '0 5px 20px rgba(249,115,22,0.5)' }} />
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '16px' }}>Màn Hình</p>
                    </div>

                    {/* SEATS GRID */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                      {sortedRows.map(row => (
                        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '24px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{row}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {groupedSeats[row].sort((a,b) => a.colIndex - b.colIndex).map(seat => {
                              let bg = 'rgba(255,255,255,0.1)', border = 'var(--border)', color = 'var(--text-primary)', width = '32px';
                              switch(seat.seatType) {
                                case 'VIP': bg = '#f97316'; border = '#ea580c'; color = 'white'; break;
                                case 'COUPLE': bg = '#ec4899'; border = '#db2777'; color = 'white'; width = '72px'; break;
                                case 'BROKEN': bg = '#475569'; border = '#334155'; color = '#94a3b8'; break;
                                case 'RESERVED': bg = '#8b5cf6'; border = '#7c3aed'; color = 'white'; break;
                              }
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSeatClick(seat)}
                                  title={`Loại: ${seat.seatType}`}
                                  style={{
                                    height: '32px', width, background: bg, borderBottom: `4px solid ${border}`,
                                    borderRadius: '6px 6px 4px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', fontWeight: '800', color, cursor: seat.seatType === 'BROKEN' ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.1s', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                  }}
                                  onMouseDown={e => { if (seat.seatType !== 'BROKEN') e.currentTarget.style.transform = 'scale(0.95)'; }}
                                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  {seat.seatType === 'BROKEN' ? <X size={12} /> : seat.seatNumber}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ width: '24px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{row}</div>
                        </div>
                      ))}
                    </div>

                    {/* LEGEND */}
                    <div style={{ marginTop: '50px', display: 'flex', gap: '24px', background: 'var(--bg-elevated)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      {[
                        { label: 'Thường', bg: 'rgba(255,255,255,0.1)', border: 'var(--border)' },
                        { label: 'VIP', bg: '#f97316', border: '#ea580c' },
                        { label: 'Couple', bg: '#ec4899', border: '#db2777', w: '50px' },
                        { label: 'Hỏng', bg: '#475569', border: '#334155' },
                        { label: 'Đặt trước', bg: '#8b5cf6', border: '#7c3aed' },
                      ].map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: l.w || '20px', height: '20px', borderRadius: '4px 4px 2px 2px', background: l.bg, borderBottom: `3px solid ${l.border}` }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                      💡 Click vào ghế để đổi loại: Thường ➔ VIP ➔ Đôi ➔ Hỏng ➔ Đặt trước ➔ Thường
                    </div>

                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Phòng này chưa có ghế nào. Bấm "Sinh ghế tự động".
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '20px 24px', color: 'white' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><PlusCircle size={20} /> Thêm Phòng Mới</h3>
            </div>
            <form onSubmit={handleCreateRoom} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Tên phòng chiếu</label>
                <input required type="text" placeholder="VD: Rạp 1, IMAX 1" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="form-control" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Định dạng</label>
                <select value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})} className="form-control">
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Số hàng</label>
                  <input required type="number" min="1" max="26" value={newRoom.totalRows} onChange={e => setNewRoom({...newRoom, totalRows: parseInt(e.target.value)})} className="form-control" />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tối đa 26 (A-Z)</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Ghế mỗi hàng</label>
                  <input required type="number" min="1" max="50" value={newRoom.totalColumns} onChange={e => setNewRoom({...newRoom, totalColumns: parseInt(e.target.value)})} className="form-control" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Tạo phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '20px 24px', color: 'white' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>✏️ Cập Nhật Phòng</h3>
            </div>
            <form onSubmit={handleUpdateRoom} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Tên phòng chiếu</label>
                <input required type="text" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} className="form-control" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Định dạng</label>
                <select value={editingRoom.type} onChange={e => setEditingRoom({...editingRoom, type: e.target.value})} className="form-control">
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Số hàng</label>
                  <input required type="number" min="1" max="26" value={editingRoom.totalRows} onChange={e => setEditingRoom({...editingRoom, totalRows: parseInt(e.target.value)})} className="form-control" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Ghế mỗi hàng</label>
                  <input required type="number" min="1" max="50" value={editingRoom.totalColumns} onChange={e => setEditingRoom({...editingRoom, totalColumns: parseInt(e.target.value)})} className="form-control" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
