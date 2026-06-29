import { Save, Building, DollarSign, Bell, Lock, Palette, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-hot-toast'; // Giả sử bạn dùng thư viện toast để báo thành công

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({
    cinemaName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    basePrice: 100000,
    vipPrice: 150000,
    studentDiscount: 20,
    seniorDiscount: 30,
    weekendSurcharge: 10,
    holidaySurcharge: 20,
    peakHourSurcharge: 15,
    holidayDates: '01/01,30/04,01/05,02/09'
  });
  const [loading, setLoading] = useState(true);

  // Load cấu hình hệ thống khi mở trang
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/settings');
        if (res.data) setConfig(res.data);
      } catch (err) {
        console.error("Không thể tải cấu hình:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axiosClient.put('/settings', config);
      toast.success("Đã cập nhật cấu hình hệ thống!");
    } catch (err) {
      toast.error("Lỗi khi lưu cấu hình");
    }
  };

  if (loading) return <div className="p-6">Đang tải cấu hình...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Cài đặt hệ thống</h2>
          <p className="page-subtitle mt-1">Cấu hình tham số cho toàn bộ rạp phim</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* Settings Menu */}
        <div className="card" style={{ height: 'fit-content' }}>
          <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'general', label: 'Thông tin chung', icon: Building },
              { id: 'pricing', label: 'Giá vé', icon: DollarSign },
              { id: 'security', label: 'Bảo mật', icon: Lock },
              { id: 'appearance', label: 'Giao diện', icon: Palette },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="btn"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', transition: 'all 0.2s', border: 'none', justifyContent: 'flex-start',
                  background: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
                  fontWeight: activeTab === item.id ? '600' : '500'
                }}
              >
                <item.icon style={{ width: '20px', height: '20px' }} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'general' && (
            <div className="card card-pad" style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Thông tin rạp phim</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tên rạp</label>
                  <input
                    name="cinemaName"
                    value={config.cinemaName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      value={config.email}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      name="phone"
                      value={config.phone}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <input
                    name="address"
                    value={config.address}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="card card-pad" style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Cấu hình giá & Giảm giá</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Giá vé Thường</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        name="basePrice"
                        value={config.basePrice}
                        onChange={handleInputChange}
                        style={{ background: 'transparent', fontSize: '1.25rem', fontWeight: '700', width: '100%', outline: 'none', border: 'none', color: 'var(--text-primary)' }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>VNĐ</span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '8px' }}>Giá vé VIP</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        name="vipPrice"
                        value={config.vipPrice}
                        onChange={handleInputChange}
                        style={{ background: 'transparent', fontSize: '1.25rem', fontWeight: '700', width: '100%', outline: 'none', border: 'none', color: '#60a5fa' }}
                      />
                      <span style={{ color: 'rgba(96,165,250,0.7)', fontWeight: '500' }}>VNĐ</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <h4 style={{ fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>Chính sách giảm giá (%)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Sinh viên</span>
                      <input
                        type="number"
                        name="studentDiscount"
                        value={config.studentDiscount}
                        onChange={handleInputChange}
                        style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)', background: 'transparent', border: 'none', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Người cao tuổi</span>
                      <input
                        type="number"
                        name="seniorDiscount"
                        value={config.seniorDiscount}
                        onChange={handleInputChange}
                        style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)', background: 'transparent', border: 'none', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <h4 style={{ fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>Phụ thu (%)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Cuối tuần (Thứ 7, CN)</span>
                      <input
                        type="number"
                        name="weekendSurcharge"
                        value={config.weekendSurcharge}
                        onChange={handleInputChange}
                        style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)', background: 'transparent', border: 'none', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Giờ cao điểm (18h-23h)</span>
                      <input
                        type="number"
                        name="peakHourSurcharge"
                        value={config.peakHourSurcharge}
                        onChange={handleInputChange}
                        style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)', background: 'transparent', border: 'none', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Ngày lễ</span>
                      <input
                        type="number"
                        name="holidaySurcharge"
                        value={config.holidaySurcharge}
                        onChange={handleInputChange}
                        style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)', background: 'transparent', border: 'none', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <h4 style={{ fontWeight: '500', marginBottom: '16px', color: 'var(--text-primary)' }}>Danh sách ngày lễ</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <input
                        type="text"
                        name="holidayDates"
                        value={config.holidayDates}
                        onChange={handleInputChange}
                        placeholder="VD: 01/01, 30/04, 01/05"
                        className="form-control"
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Nhập ngày/tháng phân cách bằng dấu phẩy (VD: 01/01, 30/04)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
            <button 
              onClick={handleSave}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px' }}
            >
              <Save style={{ width: '20px', height: '20px' }} />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}