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

            {error && <div className="card card-pad" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '24px' }}>{error}</div>}

            {/* FORM CREATE VOUCHER */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-head">
                    <h3>Phát hành Chương trình Giảm giá mới / Flash Sale</h3>
                </div>
                <div className="card-pad">
                    <form onSubmit={handleCreateDiscount}>
                        <div className="grid-3" style={{ alignItems: 'end' }}>
                            <div className="form-group">
                                <label className="form-label">Mã Voucher (In Hoa)</label>
                                <input type="text" placeholder="VD: SUMMERSALE" value={code} onChange={e => setCode(e.target.value)} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Giá trị giảm (đ hoặc %)</label>
                                <input type="number" placeholder="VD: 50000 hoặc 15" value={value} onChange={e => setValue(e.target.value)} className="form-control" min="1" step="any" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Số lượt dùng tối đa</label>
                                <input type="number" placeholder="Bỏ trống nếu vô hạn" value={maxUsage || ''} onChange={e => setMaxUsage(e.target.value)} className="form-control" min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đơn tối thiểu (VNĐ)</label>
                                <input type="number" placeholder="0 = Không yêu cầu" value={minOrderValue || ''} onChange={e => setMinOrderValue(e.target.value)} className="form-control" min="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Áp dụng cho Phim</label>
                                <select value={applicableMovieId} onChange={e => setApplicableMovieId(e.target.value)} className="form-control">
                                    <option value="">Tất cả các phim</option>
                                    {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ngày hết hạn</label>
                                <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="form-control" required />
                            </div>
                        </div>
                        <div className="divider" />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary">Phát hành mã</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* VOUCHER LIST */}
            <div className="table-wrap">
                <div className="card-head">
                    <span>Danh Sách Voucher Đang Hiệu Lực</span>
                </div>
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
                                    <span className="badge badge-gray">{item.code}</span>
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
                                            <span className="badge badge-yellow">{movies.find(m => m.id === item.applicableMovieId)?.title || `Phim ID: ${item.applicableMovieId}`}</span>
                                        ) : (
                                            <span className="badge badge-gray">Mọi phim</span>
                                        )}
                                        {item.minOrderValue ? (
                                            <span className="badge badge-green">Min: {item.minOrderValue.toLocaleString()}đ</span>
                                        ) : (
                                            <span className="badge badge-gray">Không yêu cầu</span>
                                        )}
                                    </div>
                                </td>
                                <td>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => { setEditingData(item); setIsEditModalOpen(true); }}>Sửa</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(item)}>Hủy bỏ</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {discounts.filter(item => item && item.active).length === 0 && (
                            <tr>
                                <td colSpan="9" className="empty-state">
                                    <p>Hiện chưa có chương trình khuyến mãi nào được kích hoạt.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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