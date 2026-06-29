import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Tiers = () => {
  const [tiers, setTiers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', minPoints: 0, discountPercentage: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await api.get('/admin/loyalty/tiers');
      setTiers(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách hạng thành viên');
    }
  };

  const handleOpenModal = (tier = null) => {
    if (tier) {
      setFormData(tier);
    } else {
      setFormData({ id: null, name: '', minPoints: 0, discountPercentage: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.id) {
        await api.put(`/admin/loyalty/tiers/${formData.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/admin/loyalty/tiers', formData);
        toast.success('Thêm mới thành công');
      }
      setIsModalOpen(false);
      fetchTiers();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hạng này?')) return;
    try {
      await api.delete(`/admin/loyalty/tiers/${id}`);
      toast.success('Xóa thành công');
      fetchTiers();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={24} color="var(--accent-primary)" />
          Hạng Thành Viên
        </h1>
        <button
          onClick={() => handleOpenModal()}
          style={{
            background: 'var(--gradient-primary)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
          }}
        >
          <Plus size={18} /> Thêm Hạng
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {tiers.map((tier, index) => (
          <div key={tier.id} style={{
            background: 'var(--bg-sidebar)', padding: '24px', borderRadius: '16px',
            border: '1px solid var(--border)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-primary)',
                padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
              }}>
                Cấp độ {index + 1}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenModal(tier)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(tier.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', fontWeight: 'bold', textAlign: 'center' }}>
              {tier.name}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Điểm tối thiểu</span>
                <span style={{ fontWeight: 'bold' }}>{tier.minPoints}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Giảm giá vé</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>{tier.discountPercentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-sidebar)', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: '400px', border: '1px solid var(--border)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>
              {formData.id ? 'Sửa Hạng thành viên' : 'Thêm Hạng mới'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Tên hạng (VD: Đồng, Bạc, Vàng...)</label>
                <input
                  type="text" required
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Điểm tối thiểu</label>
                <input
                  type="number" required min="0"
                  value={formData.minPoints === null || isNaN(formData.minPoints) ? '' : formData.minPoints} 
                  onChange={(e) => setFormData({...formData, minPoints: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>% Giảm giá</label>
                <input
                  type="number" required min="0" max="100" step="0.1"
                  value={formData.discountPercentage === null || isNaN(formData.discountPercentage) ? '' : formData.discountPercentage} 
                  onChange={(e) => setFormData({...formData, discountPercentage: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--gradient-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiers;
