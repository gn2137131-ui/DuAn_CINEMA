import React, { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';

const EditSnacks = ({ type, data, onClose, onRefresh, popcorns = [], drinks = [] }) => {
    // State cơ bản dành cho Combo
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [popcornCount, setPopcornCount] = useState(0);
    const [drinkCount, setDrinkCount] = useState(0);

    // State ID để đồng bộ hóa Select Box chọn món
    const [selectedPopcornId, setSelectedPopcornId] = useState('');
    const [selectedDrinkId, setSelectedDrinkId] = useState('');

    // State hiển thị tổng tiền bán lẻ để tham khảo
    const [suggestedPrice, setSuggestedPrice] = useState(0);

    // State cho sản phẩm lẻ độc lập (Nước / Bắp đơn lẻ)
    const [singleName, setSingleName] = useState('');
    const [singlePrice, setSinglePrice] = useState(0);
    const [stockQuantity, setStockQuantity] = useState(100);
    const [alertThreshold, setAlertThreshold] = useState(20);

    const [error, setError] = useState('');

    // Lớp logic 1: Đồng bộ hóa dữ liệu cũ của bản ghi vào Form khi mở Modal
    useEffect(() => {
        if (!data) return;

        if (type === 'combos') {
            setName(data.name || '');
            setDescription(data.description || '');
            setPopcornCount(data.popcornCount || 0);
            setDrinkCount(data.drinkCount || 0);
            setPrice(data.price || 0);

            // Tự động tìm kiếm vị bắp hợp lý dựa trên tên của combo hoặc chọn vị đầu tiên trong danh sách để kích hoạt Select box
            if (popcorns.length > 0 && data.popcornCount > 0) {
                const matchedPopcorn = popcorns.find(p => data.name.toLowerCase().includes(p.name.toLowerCase()) || data.description?.toLowerCase().includes(p.name.toLowerCase()));
                setSelectedPopcornId(matchedPopcorn ? matchedPopcorn.id.toString() : popcorns[0].id.toString());
            } else {
                setSelectedPopcornId('');
            }

            // Tự động tìm kiếm loại đồ uống tương tự
            if (drinks.length > 0 && data.drinkCount > 0) {
                const matchedDrink = drinks.find(d => data.name.toLowerCase().includes(d.name.toLowerCase()) || data.description?.toLowerCase().includes(d.name.toLowerCase()));
                setSelectedDrinkId(matchedDrink ? matchedDrink.id.toString() : drinks[0].id.toString());
            } else {
                setSelectedDrinkId('');
            }
        } else {
            setSingleName(data.name || '');
            setSinglePrice(data.price || 0);
            setStockQuantity(data.stockQuantity || 0);
            setAlertThreshold(data.alertThreshold || 0);
            // Mình thêm trường description vào cả form tạo mới và chỉnh sửa để sau này có thể mở rộng thêm tính năng mô tả chi tiết cho từng món nếu cần
            setDescription(data.description || '');
        }
    }, [data, type, popcorns, drinks]);

    // Lớp logic 2: Tính toán giá bán lẻ gợi ý liên tục khi thay đổi số lượng / món lẻ
    useEffect(() => {
        if (type !== 'combos') return;

        const currentPopcorn = popcorns.find(p => p.id === Number(selectedPopcornId));
        const currentDrink = drinks.find(d => d.id === Number(selectedDrinkId));

        const popcornTotal = currentPopcorn ? currentPopcorn.price * popcornCount : 0;
        const drinkTotal = currentDrink ? currentDrink.price * drinkCount : 0;

        setSuggestedPrice(popcornTotal + drinkTotal);
    }, [selectedPopcornId, selectedDrinkId, popcornCount, drinkCount, type, popcorns, drinks]);

    // Xử lý gửi API cập nhật dữ liệu lên hệ thống Backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let payload = {};
            if (type === 'combos') {
                payload = { name, description, popcornCount, drinkCount, price, active: true };
                await axiosClient.put(`/snacks/combos/${data.id}`, payload);
            } else if (type === 'drinks') {
                payload = { name: singleName, description, price: singlePrice, stockQuantity, alertThreshold, active: true };
                await axiosClient.put(`/snacks/drinks/${data.id}`, payload);
            } else if (type === 'popcorns') {
                payload = { name: singleName, description, price: singlePrice, stockQuantity, alertThreshold, active: true };
                await axiosClient.put(`/snacks/popcorns/${data.id}`, payload);
            }
            onRefresh();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
        }
    };

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
        content: { backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0' },
        title: { marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' },
        formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
        label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
        input: { padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155', backgroundColor: '#f8fafc' },
        select: { padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', color: '#334155', outline: 'none' },
        counterContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', border: '1px solid #e2e8f0', marginTop: '4px' },
        counterBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#0f172a', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
        counterValue: { width: '38px', textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#0f172a' },
        suggestionBox: { backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
        btnSave: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' },
        btnCancel: { padding: '12px 22px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.content}>
                <h3 style={styles.title}>✨ Chỉnh sửa {type === 'combos' ? 'Gói Combo' : 'Sản phẩm lẻ'} (ID: #{data?.id})</h3>

                {error && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fca5a5', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {type === 'combos' ? (
                        <>
                            {/* Hàng 1: Tên gói & Chi tiết thành phần cấu tạo */}
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tên Combo</label>
                                    <input style={styles.input} value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Mô tả chi tiết</label>
                                    <input style={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            </div>

                            {/* Hàng 2: Khu vực Select Box & Bộ tăng giảm số lượng an toàn */}
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Loại Bỏng ngô thành phần</label>
                                    <select value={selectedPopcornId} onChange={e => setSelectedPopcornId(e.target.value)} style={styles.select}>
                                        <option value="">-- Chọn vị bắp lẻ --</option>
                                        {popcorns.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.price?.toLocaleString()} đ)</option>
                                        ))}
                                    </select>
                                    <div style={styles.counterContainer}>
                                        <button type="button" onClick={() => setPopcornCount(prev => Math.max(0, prev - 1))} style={styles.counterBtn}>-</button>
                                        <span style={styles.counterValue}>{popcornCount}</span>
                                        <button type="button" onClick={() => setPopcornCount(prev => prev + 1)} style={styles.counterBtn}>+</button>
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Loại Đồ uống thành phần</label>
                                    <select value={selectedDrinkId} onChange={e => setSelectedDrinkId(e.target.value)} style={styles.select}>
                                        <option value="">-- Chọn đồ uống lẻ --</option>
                                        {drinks.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.price?.toLocaleString()} đ)</option>
                                        ))}
                                    </select>
                                    <div style={styles.counterContainer}>
                                        <button type="button" onClick={() => setDrinkCount(prev => Math.max(0, prev - 1))} style={styles.counterBtn}>-</button>
                                        <span style={styles.counterValue}>{drinkCount}</span>
                                        <button type="button" onClick={() => setDrinkCount(prev => prev + 1)} style={styles.counterBtn}>+</button>
                                    </div>
                                </div>
                            </div>
                            {/* Hàng 4: Giá trị Combo thương mại thực tế */}
                            <div style={{ ...styles.formGroup, marginBottom: '20px' }}>
                                <label style={styles.label}>Giá gói Combo bán ra (đ)</label>
                                <input type="number" value={suggestedPrice.toLocaleString()} style={styles.input} readOnly />
                            </div>
                        </>
                    ) : (
                        /* Giao diện biểu mẫu Chỉnh sửa Đồ uống hoặc Bỏng ngô đơn lẻ */
                        <>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tên sản phẩm lẻ</label>
                                <input style={styles.input} value={singleName} onChange={e => setSingleName(e.target.value)} required />
                            </div>
                            <div style={{ ...styles.formGroup, marginTop: '18px', marginBottom: '20px' }}>
                                <label style={styles.label}>Giá bán niêm yết (đ)</label>
                                <input type="number" style={styles.input} value={singlePrice} onChange={e => setSinglePrice(Number(e.target.value))} min="0" required />
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tồn kho</label>
                                    <input type="number" style={styles.input} value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} min="0" required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Mức cảnh báo</label>
                                    <input type="number" style={styles.input} value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} min="0" required />
                                </div>
                            </div>
                            {/* Mình thêm trường description vào cả form tạo mới và chỉnh sửa để sau này có thể mở rộng thêm tính năng mô tả chi tiết cho từng món nếu cần */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Mô tả chi tiết</label>
                                <input style={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* Thanh điều hướng Button lưu dữ liệu */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                        <button type="button" onClick={onClose} style={styles.btnCancel}>Hủy bỏ</button>
                        <button type="submit" style={styles.btnSave}>Cập nhật thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSnacks;