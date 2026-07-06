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

    return (
        <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Chỉnh sửa {type === 'combos' ? 'Gói Combo' : 'Sản phẩm lẻ'} (ID: #{data?.id})</h3>
                </div>

                {error && <div className="card" style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {type === 'combos' ? (
                            <>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Tên Combo</label>
                                        <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mô tả chi tiết</label>
                                        <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid-2" style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Loại Bỏng ngô thành phần</label>
                                        <select value={selectedPopcornId} onChange={e => setSelectedPopcornId(e.target.value)} className="form-control">
                                            <option value="">-- Chọn vị bắp lẻ --</option>
                                            {popcorns.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.price?.toLocaleString()} đ)</option>
                                            ))}
                                        </select>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)', marginTop: '8px' }}>
                                            <button type="button" onClick={() => setPopcornCount(prev => Math.max(0, prev - 1))} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>-</button>
                                            <span style={{ width: '38px', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{popcornCount}</span>
                                            <button type="button" onClick={() => setPopcornCount(prev => prev + 1)} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>+</button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Loại Đồ uống thành phần</label>
                                        <select value={selectedDrinkId} onChange={e => setSelectedDrinkId(e.target.value)} className="form-control">
                                            <option value="">-- Chọn đồ uống lẻ --</option>
                                            {drinks.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} ({d.price?.toLocaleString()} đ)</option>
                                            ))}
                                        </select>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)', marginTop: '8px' }}>
                                            <button type="button" onClick={() => setDrinkCount(prev => Math.max(0, prev - 1))} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>-</button>
                                            <span style={{ width: '38px', textAlign: 'center', fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{drinkCount}</span>
                                            <button type="button" onClick={() => setDrinkCount(prev => prev + 1)} className="btn btn-icon" style={{ width: '32px', height: '32px' }}>+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label className="form-label">Giá gói Combo bán ra (đ)</label>
                                    <div className="card" style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.875rem', color: 'var(--accent-info)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Giá bán lẻ gợi ý</span>
                                        <span style={{ fontWeight: '800', fontSize: '1.125rem' }}>{suggestedPrice.toLocaleString()} đ</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Tên sản phẩm lẻ</label>
                                    <input className="form-control" value={singleName} onChange={e => setSingleName(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Giá bán niêm yết (đ)</label>
                                    <input type="number" className="form-control" value={singlePrice} onChange={e => setSinglePrice(Number(e.target.value))} min="0" required />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Tồn kho</label>
                                        <input type="number" className="form-control" value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} min="0" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mức cảnh báo</label>
                                        <input type="number" className="form-control" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} min="0" required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">Mô tả chi tiết</label>
                                    <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                            </>
                        )}
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

export default EditSnacks;
