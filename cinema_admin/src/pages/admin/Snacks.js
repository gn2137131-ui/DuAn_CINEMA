import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import EditSnacks from './snacks/EditSnacks';

const Snacks = () => {
    const [activeTab, setActiveTab] = useState('combos');
    const [combos, setCombos] = useState([]);
    const [drinks, setDrinks] = useState([]);
    const [popcorns, setPopcorns] = useState([]);
    const [error, setError] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    // Form states cho Đồ uống và Bỏng ngô độc lập
    const [drinkForm, setDrinkForm] = useState({ name: '', price: 0.0, stockQuantity: 100, alertThreshold: 20 });
    const [popcornForm, setPopcornForm] = useState({ name: '', price: 0.0, stockQuantity: 100, alertThreshold: 20 });

    // State mới cho cấu trúc tạo Combo nâng cao
    const [comboName, setComboName] = useState('');
    const [comboDescription, setComboDescription] = useState('');
    const [comboPrice, setComboPrice] = useState(0);

    // Lưu ID của món đang chọn trong Select box
    const [selectedPopcornId, setSelectedPopcornId] = useState('');
    const [selectedDrinkId, setSelectedDrinkId] = useState('');

    // Lưu số lượng tăng giảm
    const [popcornCount, setPopcornCount] = useState(0);
    const [drinkCount, setDrinkCount] = useState(0);

    // Lấy dữ liệu từ Backend
    const fetchCombos = async () => {
        try {
            const res = await axiosClient.get('/snacks/combos');
            setCombos(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách Combo.');
        }
    };

    const fetchDrinks = async () => {
        try {
            const res = await axiosClient.get('/snacks/drinks');
            setDrinks(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách đồ uống.');
        }
    };

    const fetchPopcorns = async () => {
        try {
            const res = await axiosClient.get('/snacks/popcorns');
            setPopcorns(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách bỏng ngô.');
        }
    };

    useEffect(() => {
        fetchCombos();
        fetchDrinks();
        fetchPopcorns();
    }, []);

    // Gợi ý tính tổng giá tham khảo khi Admin tăng/giảm số lượng dựa trên giá bán lẻ
    useEffect(() => {
        const currentPopcorn = popcorns.find(p => p.id === Number(selectedPopcornId));
        const currentDrink = drinks.find(d => d.id === Number(selectedDrinkId));

        const popcornPrice = currentPopcorn ? currentPopcorn.price * popcornCount : 0;
        const drinkPrice = currentDrink ? currentDrink.price * drinkCount : 0;

        // Gợi ý giá trị mặc định, Admin vẫn có thể sửa lại theo ý muốn
        setComboPrice(popcornPrice + drinkPrice);
    }, [selectedPopcornId, selectedDrinkId, popcornCount, drinkCount, popcorns, drinks]);

    // Xử lý tạo Combo mới
    const handleComboSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/snacks/combos', {
                name: comboName,
                description: comboDescription,
                popcornCount: popcornCount,
                drinkCount: drinkCount,
                price: comboPrice,
                active: true,
                // 🔥 ADD THESE TWO LINES:
                popcorn: selectedPopcornId ? { id: Number(selectedPopcornId) } : null,
                drink: selectedDrinkId ? { id: Number(selectedDrinkId) } : null
            });
            fetchCombos();
            // Reset form combo
            setComboName('');
            setComboDescription('');
            setPopcornCount(0);
            setDrinkCount(0);
            setComboPrice(0);
            setSelectedPopcornId('');
            setSelectedDrinkId('');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };
    const handleDrinkSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/snacks/drinks', { ...drinkForm, active: true });
            fetchDrinks();
            setDrinkForm({ name: '', price: 0.0, description: '', stockQuantity: 100, alertThreshold: 20, active: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handlePopcornSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/snacks/popcorns', { ...popcornForm, active: true });
            fetchPopcorns();
            setPopcornForm({ name: '', price: 0.0, description: '', stockQuantity: 100, alertThreshold: 20, active: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleDeactivate = async (type, item) => {
        const isConfirmed = window.confirm(`Bạn có chắc chắn muốn hủy kích hoạt "${item.name}"?`);
        if (!isConfirmed) return;
        try {
            if (type === 'combos') {
                await axiosClient.put(`/snacks/combos/${item.id}`, { active: false });
                fetchCombos();
            } else if (type === 'drinks') {
                await axiosClient.put(`/snacks/drinks/${item.id}`, { active: false });
                fetchDrinks();
            } else if (type === 'popcorns') {
                await axiosClient.put(`/snacks/popcorns/${item.id}`, { active: false });
                fetchPopcorns();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi hủy kích hoạt.');
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Quầy Bắp Nước</h1>
                    <p className="page-subtitle">Hệ Thống Admin cCinema</p>
                </div>
            </div>

            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '600' }}>{error}</div>}

            {/* TABS */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border)' }}>
                <button 
                    onClick={() => setActiveTab('combos')} 
                    className="btn" 
                    style={{ background: activeTab === 'combos' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'combos' ? 'var(--text-primary)' : 'var(--text-muted)', border: activeTab === 'combos' ? '1px solid var(--border)' : '1px solid transparent' }}
                >
                    ⚡ Quản Lý Combo
                </button>
                <button 
                    onClick={() => setActiveTab('drinks')} 
                    className="btn" 
                    style={{ background: activeTab === 'drinks' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'drinks' ? 'var(--text-primary)' : 'var(--text-muted)', border: activeTab === 'drinks' ? '1px solid var(--border)' : '1px solid transparent' }}
                >
                    🥤 Quản Lý Đồ Uống
                </button>
                <button 
                    onClick={() => setActiveTab('popcorns')} 
                    className="btn" 
                    style={{ background: activeTab === 'popcorns' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'popcorns' ? 'var(--text-primary)' : 'var(--text-muted)', border: activeTab === 'popcorns' ? '1px solid var(--border)' : '1px solid transparent' }}
                >
                    🍿 Quản Lý Bỏng Ngô
                </button>
            </div>

            {/* TAB QUẢN LÝ COMBO */}
            {activeTab === 'combos' && (
                <div>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="card-head">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>✨ Tạo gói Combo rạp phim</h3>
                        </div>
                        <div className="card-pad">
                            <form onSubmit={handleComboSubmit} className="grid-3" style={{ alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Tên Combo</label>
                                    <input type="text" placeholder="VD: Combo Couple Đậm Đà" value={comboName} onChange={e => setComboName(e.target.value)} className="form-control" required />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mô tả chi tiết</label>
                                    <input type="text" placeholder="2 Nước lớn + 1 Bắp phô mai..." value={comboDescription} onChange={e => setComboDescription(e.target.value)} className="form-control" />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Chọn loại Bỏng ngô</label>
                                    <select value={selectedPopcornId} onChange={e => setSelectedPopcornId(e.target.value)} className="form-control" style={{ marginBottom: '8px' }}>
                                        <option value="">-- Chọn vị bắp lẻ --</option>
                                        {popcorns.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price?.toLocaleString()} đ)</option>)}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
                                        <button type="button" onClick={() => setPopcornCount(prev => Math.max(0, prev - 1))} className="btn" style={{ padding: '4px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>-</button>
                                        <span style={{ width: '40px', textAlign: 'center', fontWeight: '700' }}>{popcornCount}</span>
                                        <button type="button" onClick={() => setPopcornCount(prev => prev + 1)} className="btn" style={{ padding: '4px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+</button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Chọn loại Đồ uống</label>
                                    <select value={selectedDrinkId} onChange={e => setSelectedDrinkId(e.target.value)} className="form-control" style={{ marginBottom: '8px' }}>
                                        <option value="">-- Chọn đồ uống lẻ --</option>
                                        {drinks.map(d => <option key={d.id} value={d.id}>{d.name} ({d.price?.toLocaleString()} đ)</option>)}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
                                        <button type="button" onClick={() => setDrinkCount(prev => Math.max(0, prev - 1))} className="btn" style={{ padding: '4px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>-</button>
                                        <span style={{ width: '40px', textAlign: 'center', fontWeight: '700' }}>{drinkCount}</span>
                                        <button type="button" onClick={() => setDrinkCount(prev => prev + 1)} className="btn" style={{ padding: '4px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>+</button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Giá Combo bán ra (đ)</label>
                                    <input type="number" placeholder="Nhập giá bán lẻ" value={comboPrice} onChange={e => setComboPrice(Number(e.target.value))} className="form-control" min="0" required />
                                </div>

                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="submit" className="btn btn-primary">Lưu gói Combo</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-head">
                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Danh Sách Combo Đang Hoạt Động</span>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên Gói Combo</th>
                                        <th>Mô tả thành phần</th>
                                        <th>Bỏng ngô (SL)</th>
                                        <th>Đồ uống (SL)</th>
                                        <th>Giá thương mại</th>
                                        <th style={{ textAlign: 'right' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {combos.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{c.id}</td>
                                            <td><span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.name}</span></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{c.description || '—'}</td>
                                            <td><span className="badge badge-gray">{c.popcornCount}x {c.popcorn?.name || 'Bắp'}</span></td>
                                            <td><span className="badge badge-gray">{c.drinkCount}x {c.drink?.name || 'Nước'}</span></td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent-success)' }}>{c.price?.toLocaleString('vi-VN')} đ</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="btn" style={{ background: 'var(--accent-primary)', color: 'white', padding: '6px 12px' }} onClick={() => { setEditingData(c); setIsEditModalOpen(true); }}>Sửa</button>
                                                    <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }} onClick={() => handleDeactivate('combos', c)}>Hủy tắt</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB QUẢN LÝ ĐỒ UỐNG */}
            {activeTab === 'drinks' && (
                <div>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="card-head">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>🥤 Thêm Đồ Uống Mới</h3>
                        </div>
                        <div className="card-pad">
                            <form onSubmit={handleDrinkSubmit} className="grid-4" style={{ alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Tên đồ uống</label>
                                    <input type="text" placeholder="VD: Pepsi Ly Lớn 32oz" value={drinkForm.name} onChange={e => setDrinkForm({ ...drinkForm, name: e.target.value })} className="form-control" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mô tả</label>
                                    <input type="text" placeholder="Nhập mô tả" value={drinkForm.description} onChange={e => setDrinkForm({ ...drinkForm, description: e.target.value })} className="form-control" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Trạng thái</label>
                                    <select value={drinkForm.active} onChange={e => setDrinkForm({ ...drinkForm, active: e.target.value === 'true' })} className="form-control">
                                        <option value="true">Hoạt động</option>
                                        <option value="false">Không hoạt động</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Giá bán lẻ (đ)</label>
                                    <input type="number" placeholder="Nhập giá" value={drinkForm.price} onChange={e => setDrinkForm({ ...drinkForm, price: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Số lượng kho (Tồn)</label>
                                    <input type="number" placeholder="Số lượng" value={drinkForm.stockQuantity} onChange={e => setDrinkForm({ ...drinkForm, stockQuantity: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mức cảnh báo (Sắp hết)</label>
                                    <input type="number" placeholder="Cảnh báo" value={drinkForm.alertThreshold} onChange={e => setDrinkForm({ ...drinkForm, alertThreshold: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="submit" className="btn btn-primary">Lưu Đồ Uống</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-head">
                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Danh Sách Đồ Uống Đang Hoạt Động</span>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên Đồ Uống</th>
                                        <th>Mô tả</th>
                                        <th>Tồn Kho</th>
                                        <th>Giá Bán Lẻ</th>
                                        <th style={{ textAlign: 'right' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drinks.map(d => {
                                        const isLowStock = d.stockQuantity <= d.alertThreshold;
                                        return (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{d.id}</td>
                                            <td><span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.name}</span></td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent-info)' }}>{d.description}</td>
                                            <td>
                                                <span className={`badge ${isLowStock ? 'badge-red' : 'badge-green'}`}>
                                                    {d.stockQuantity} {isLowStock && ' (Sắp hết)'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent-success)' }}>{d.price?.toLocaleString('vi-VN')} đ</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="btn" style={{ background: 'var(--accent-primary)', color: 'white', padding: '6px 12px' }} onClick={() => { setEditingData(d); setIsEditModalOpen(true); }}>Sửa</button>
                                                    <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }} onClick={() => handleDeactivate('drinks', d)}>Hủy tắt</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB QUẢN LÝ BỎNG NGÔ */}
            {activeTab === 'popcorns' && (
                <div>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="card-head">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>🍿 Thêm Bỏng Ngô Mới</h3>
                        </div>
                        <div className="card-pad">
                            <form onSubmit={handlePopcornSubmit} className="grid-4" style={{ alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Tên vị bỏng ngô</label>
                                    <input type="text" placeholder="VD: Bắp Caramel" value={popcornForm.name} onChange={e => setPopcornForm({ ...popcornForm, name: e.target.value })} className="form-control" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Giá bán lẻ (đ)</label>
                                    <input type="number" placeholder="Nhập giá" value={popcornForm.price} onChange={e => setPopcornForm({ ...popcornForm, price: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mô tả</label>
                                    <input type="text" placeholder="Nhập mô tả" value={popcornForm.description} onChange={e => setPopcornForm({ ...popcornForm, description: e.target.value })} className="form-control" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Trạng thái</label>
                                    <select value={popcornForm.active} onChange={e => setPopcornForm({ ...popcornForm, active: e.target.value === 'true' })} className="form-control">
                                        <option value="true">Hoạt động</option>
                                        <option value="false">Không hoạt động</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Số lượng kho (Tồn)</label>
                                    <input type="number" placeholder="Số lượng" value={popcornForm.stockQuantity} onChange={e => setPopcornForm({ ...popcornForm, stockQuantity: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>Mức cảnh báo (Sắp hết)</label>
                                    <input type="number" placeholder="Cảnh báo" value={popcornForm.alertThreshold} onChange={e => setPopcornForm({ ...popcornForm, alertThreshold: Number(e.target.value) })} className="form-control" min="0" required />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="submit" className="btn btn-primary">Lưu Bỏng Ngô</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-head">
                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>Danh Sách Bỏng Ngô Đang Hoạt Động</span>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên Loại Bỏng Ngô</th>
                                        <th>Mô tả</th>
                                        <th>Tồn Kho</th>
                                        <th>Giá Bán Lẻ</th>
                                        <th style={{ textAlign: 'right' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {popcorns.map(p => {
                                        const isLowStock = p.stockQuantity <= p.alertThreshold;
                                        return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{p.id}</td>
                                            <td><span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span></td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent-info)' }}>{p.description}</td>
                                            <td>
                                                <span className={`badge ${isLowStock ? 'badge-red' : 'badge-green'}`}>
                                                    {p.stockQuantity} {isLowStock && ' (Sắp hết)'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '700', color: 'var(--accent-success)' }}>{p.price?.toLocaleString('vi-VN')} đ</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="btn" style={{ background: 'var(--accent-primary)', color: 'white', padding: '6px 12px' }} onClick={() => { setEditingData(p); setIsEditModalOpen(true); }}>Sửa</button>
                                                    <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }} onClick={() => handleDeactivate('popcorns', p)}>Hủy tắt</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT */}
            {isEditModalOpen && (
                <EditSnacks
                    type={activeTab}
                    data={editingData}
                    onClose={() => setIsEditModalOpen(false)}
                    onRefresh={
                        activeTab === 'combos' ? fetchCombos :
                            activeTab === 'drinks' ? fetchDrinks : fetchPopcorns
                    }
                    popcorns={popcorns}
                    drinks={drinks}
                />
            )}
        </div>
    );
};

export default Snacks;