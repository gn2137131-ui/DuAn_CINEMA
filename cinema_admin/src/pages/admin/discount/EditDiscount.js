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

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
        content: { backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' },
        title: { marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' },
        formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
        label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
        input: { width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155', backgroundColor: '#f8fafc' },
        btnSave: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' },
        btnCancel: { padding: '12px 22px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.content}>
                <h3 style={styles.title}>🎟️ Chỉnh Sửa Mã Giảm Giá (ID: #{data?.id})</h3>
                
                {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fca5a5', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Mã Voucher</label>
                            <input style={styles.input} value={code} onChange={e => setCode(e.target.value)} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Ngày hết hạn</label>
                            <input type="date" style={styles.input} value={expirationDate} onChange={e => setExpirationDate(e.target.value)} required />
                        </div>
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Giá trị giảm (đ hoặc %)</label>
                            <input type="number" style={styles.input} value={value} onChange={e => setValue(e.target.value)} min="1" step="any" required />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Số lượt dùng tối đa</label>
                            <input type="number" style={styles.input} value={maxUsage || ''} onChange={e => setMaxUsage(e.target.value)} placeholder="Vô hạn" />
                        </div>
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Đơn tối thiểu (VNĐ)</label>
                            <input type="number" style={styles.input} value={minOrderValue || ''} onChange={e => setMinOrderValue(e.target.value)} placeholder="0 = Không yêu cầu" />
                        </div>
                        <div style={{ ...styles.formGroup, minWidth: 0 }}>
                            <label style={styles.label}>Áp dụng cho Phim</label>
                            <select style={{ ...styles.input, textOverflow: 'ellipsis' }} value={applicableMovieId} onChange={e => setApplicableMovieId(e.target.value)}>
                                <option value="">Tất cả các phim</option>
                                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                        <button type="button" onClick={onClose} style={styles.btnCancel}>Hủy bỏ</button>
                        <button type="submit" style={styles.btnSave}>Cập nhật thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDiscount;