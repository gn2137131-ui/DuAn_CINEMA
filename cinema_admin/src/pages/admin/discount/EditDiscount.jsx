import React, { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';

const EditDiscount = ({ data, onClose, onRefresh, movies = [] }) => {
    const [code, setCode] = useState('');
    const [value, setValue] = useState(0);
    const [maxUsage, setMaxUsage] = useState(0);
    const [expirationDate, setExpirationDate] = useState('');
    const [minOrderValue, setMinOrderValue] = useState(0);
    const [applicableMovieId, setApplicableMovieId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!data) return;
        setCode(data.code || '');
        setValue(data.value || 0);
        setMaxUsage(data.maxUsage || 0);
        setMinOrderValue(data.minOrderValue || 0);
        setApplicableMovieId(data.applicableMovieId || '');
        
        if (data.expirationDate) {
            // data.expirationDate đã là chuỗi "YYYY-MM-DD", gán thẳng vào input date
            setExpirationDate(data.expirationDate);
        }
    }, [data]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 🔥 ĐÃ SỬA: Đồng bộ cấu trúc gửi chuỗi YYYY-MM-DD lên API PUT
            const payload = {
                ...data,
                code: code.toUpperCase().trim(),
                value: parseFloat(value),
                maxUsage: Number(maxUsage) > 0 ? Number(maxUsage) : null,
                minOrderValue: Number(minOrderValue) > 0 ? Number(minOrderValue) : null,
                applicableMovieId: applicableMovieId ? Number(applicableMovieId) : null,
                expirationDate: expirationDate, // Gửi chuỗi "YYYY-MM-DD" trực tiếp
                type: Number(value) <= 100 ? 'PERCENTAGE' : 'FIXED',
                active: true
            };
            await axiosClient.put(`/discount-codes/${data.id}`, payload);
            onRefresh();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mã giảm giá.');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box">
                <div className="modal-header">
                    <h3 className="modal-title">Chỉnh Sửa Mã Giảm Giá (ID: #{data?.id})</h3>
                    <button className="btn-icon btn" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>

                {error && <div className="card card-pad" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', margin: '0 24px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Mã Voucher</label>
                                <input className="form-control" value={code} onChange={e => setCode(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ngày hết hạn</label>
                                <input type="date" className="form-control" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} required />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Giá trị giảm (đ hoặc %)</label>
                                <input type="number" className="form-control" value={value} onChange={e => setValue(e.target.value)} min="1" step="any" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Số lượt dùng tối đa</label>
                                <input type="number" className="form-control" value={maxUsage || ''} onChange={e => setMaxUsage(e.target.value)} placeholder="Vô hạn" />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Đơn tối thiểu (VNĐ)</label>
                                <input type="number" className="form-control" value={minOrderValue || ''} onChange={e => setMinOrderValue(e.target.value)} placeholder="0 = Không yêu cầu" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Áp dụng cho Phim</label>
                                <select className="form-control" value={applicableMovieId} onChange={e => setApplicableMovieId(e.target.value)}>
                                    <option value="">Tất cả các phim</option>
                                    {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy bỏ</button>
                        <button type="submit" className="btn btn-primary">Cập nhật thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDiscount;