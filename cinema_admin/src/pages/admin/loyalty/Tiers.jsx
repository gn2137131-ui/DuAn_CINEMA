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
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Award size={24} style={{ color: 'var(--accent-primary)' }} />
            Hạng Thành Viên
          </h2>
          <p className="page-subtitle">Quản lý các hạng thành viên và quyền lợi</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={18} /> Thêm Hạng
        </button>
      </div>

      <div className="grid-3">
        {tiers.map((tier, index) => (
          <div key={tier.id} className="card card-pad" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }}></div>
            <div className="flex items-center justify-between mb-4">
              <span className="badge badge-orange">Cấp độ {index + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(tier)} className="btn btn-icon">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(tier.id)} className="btn btn-icon" style={{ color: '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-primary)' }}>
              {tier.name}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Điểm tối thiểu</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{tier.minPoints}</span>
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
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {formData.id ? 'Sửa Hạng thành viên' : 'Thêm Hạng mới'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tên hạng (VD: Đồng, Bạc, Vàng...)</label>
                  <input
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm tối thiểu</label>
                  <input
                    type="number" required min="0"
                    value={formData.minPoints === null || isNaN(formData.minPoints) ? '' : formData.minPoints} 
                    onChange={(e) => setFormData({...formData, minPoints: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">% Giảm giá</label>
                  <input
                    type="number" required min="0" max="100" step="0.1"
                    value={formData.discountPercentage === null || isNaN(formData.discountPercentage) ? '' : formData.discountPercentage} 
                    onChange={(e) => setFormData({...formData, discountPercentage: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
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
