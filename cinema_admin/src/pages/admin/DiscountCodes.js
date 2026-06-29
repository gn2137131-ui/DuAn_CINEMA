import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import EditDiscount from './discount/EditDiscount';

const DiscountCodes = () => {
    const [discounts, setDiscounts] = useState([]);
    const [error, setError] = useState('');
    
    // Form States khớp 100% với thuộc tính Entity Backend
    const [code, setCode] = useState('');
    const [value, setValue] = useState(0);
    const [expirationDate, setExpirationDate] = useState('');
    const [maxUsage, setMaxUsage] = useState(0);
    const [minOrderValue, setMinOrderValue] = useState(0);
    const [applicableMovieId, setApplicableMovieId] = useState('');

    const [movies, setMovies] = useState([]);

    // States điều khiển Modal sửa
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    // Tải danh sách mã giảm giá từ Backend
    const fetchDiscounts = async () => {
        try {
            const res = await axiosClient.get('/discount-codes');
            setDiscounts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách mã giảm giá.');
        }
    };

    const fetchMovies = async () => {
        try {
            const res = await axiosClient.get('/movies');
            setMovies(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Không thể tải danh sách phim:', err);
        }
    };

    useEffect(() => {
        fetchDiscounts();
        fetchMovies();
    }, []);

    // Xử lý Thêm mã mới
    const handleCreateDiscount = async (e) => {
        e.preventDefault();
        
        if (!expirationDate) {
            setError('Vui lòng chọn ngày hết hạn cho mã giảm giá.');
            return;
        }

        try {
            // 🔥 ĐÃ SỬA: Chuẩn hóa dữ liệu gửi đi khớp 100% định dạng của Entity Java
            const payload = {
                code: code.toUpperCase().trim(),
                value: parseFloat(value) || 0.0, // Khớp với Double ở Backend
                expirationDate: expirationDate,  // Gửi dạng "YYYY-MM-DD" trực tiếp cho @JsonFormat
                maxUsage: Number(maxUsage) > 0 ? Number(maxUsage) : null,
                minOrderValue: Number(minOrderValue) > 0 ? Number(minOrderValue) : null,
                applicableMovieId: applicableMovieId ? Number(applicableMovieId) : null,
                description: `Mã giảm giá ${code.toUpperCase().trim()}`,
                type: Number(value) <= 100 ? 'PERCENTAGE' : 'FIXED', 
                active: true,
                usedCount: 0
            };

            await axiosClient.post('/discount-codes', payload);
            setError('');
            fetchDiscounts();
            
            // Reset Form
            setCode('');
            setValue(0);
            setExpirationDate('');
            setMaxUsage(0);
            setMinOrderValue(0);
            setApplicableMovieId('');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo voucher mới.');
        }
    };

    // Xử lý Hủy kích hoạt mã
    const handleDeactivate = async (item) => {
        const isConfirmed = window.confirm(`Bạn có chắc chắn muốn ngưng kích hoạt mã "${item.code}"?`);
        if (!isConfirmed) return;
        try {
            // Gửi kèm toàn bộ object cũ, chỉ chuyển đổi trạng thái active
            const payload = { ...item, active: false };
            await axiosClient.put(`/discount-codes/${item.id}`, payload);
            fetchDiscounts();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tắt trạng thái hoạt động.');
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Mã Giảm Giá</h1>
                    <p className="page-subtitle">Hệ thống Sự Kiện cCinema</p>
                </div>
            </div>

            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '600' }}>{error}</div>}

            {/* FORM CREATE VOUCHER */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-head">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>🎟️ Phát hành Chương trình Giảm giá mới / Flash Sale</h3>
                </div>
                <div className="card-pad">
                    <form onSubmit={handleCreateDiscount} className="grid-3" style={{ alignItems: 'end', gap: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mã Voucher (In Hoa)</label>
                            <input type="text" placeholder="VD: SUMMERSALE" value={code} onChange={e => setCode(e.target.value)} className="form-control" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Giá trị giảm (đ hoặc %)</label>
                            <input type="number" placeholder="VD: 50000 hoặc 15" value={value} onChange={e => setValue(e.target.value)} className="form-control" min="1" step="any" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Số lượt dùng tối đa</label>
                            <input type="number" placeholder="Bỏ trống nếu vô hạn" value={maxUsage || ''} onChange={e => setMaxUsage(e.target.value)} className="form-control" min="0" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Đơn tối thiểu (VNĐ)</label>
                            <input type="number" placeholder="0 = Không yêu cầu" value={minOrderValue || ''} onChange={e => setMinOrderValue(e.target.value)} className="form-control" min="0" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Áp dụng cho Phim</label>
                            <select value={applicableMovieId} onChange={e => setApplicableMovieId(e.target.value)} className="form-control">
                                <option value="">Tất cả các phim</option>
                                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Ngày hết hạn</label>
                            <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="form-control" required />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-primary">Phát hành mã</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* VOUCHER LIST */}
            <div className="card">
                <div className="card-head">
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Danh Sách Voucher Đang Hiệu Lực</span>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Mã Code</th>
                                <th>Loại mã</th>
                                <th>Giá trị giảm</th>
                                <th>Lượt đã dùng</th>
                                <th>Giới hạn dùng</th>
                                <th>Điều kiện (Phim / Min)</th>
                                <th>Ngày hết hạn</th>
                                <th style={{ textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.filter(item => item && item.active).map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{item.id}</td>
                                    <td>
                                        <span className="badge badge-gray" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                            {item.code}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.type === 'PERCENTAGE' ? 'badge-yellow' : 'badge-green'}`}>
                                            {item.type === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '700', color: 'var(--accent-success)' }}>
                                        {item.value === null || item.value === undefined ? '—' : (item.type === 'PERCENTAGE' || item.value <= 100 ? `${item.value}%` : `${item.value.toLocaleString()} đ`)}
                                    </td>
                                    <td>{item.usedCount ?? 0} lượt</td>
                                    <td>{item.maxUsage ? `${item.maxUsage} lượt` : 'Vô hạn'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {item.applicableMovieId ? (
                                                <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                                                    {movies.find(m => m.id === item.applicableMovieId)?.title || `Phim ID: ${item.applicableMovieId}`}
                                                </span>
                                            ) : (
                                                <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Mọi phim</span>
                                            )}
                                            {item.minOrderValue ? (
                                                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Min: {item.minOrderValue.toLocaleString()}đ</span>
                                            ) : (
                                                <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Không yêu cầu</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('vi-VN') : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="btn" style={{ background: 'var(--accent-primary)', color: 'white', padding: '6px 12px' }} onClick={() => { setEditingData(item); setIsEditModalOpen(true); }}>Sửa</button>
                                            <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }} onClick={() => handleDeactivate(item)}>Hủy bỏ</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {discounts.filter(item => item && item.active).length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        Hiện chưa có chương trình khuyến mãi nào được kích hoạt.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL EDIT */}
            {isEditModalOpen && (
                <EditDiscount
                    data={editingData}
                    onClose={() => setIsEditModalOpen(false)}
                    onRefresh={fetchDiscounts}
                    movies={movies}
                />
            )}
        </div>
    );
};

export default DiscountCodes;