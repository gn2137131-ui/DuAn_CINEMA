import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';
import { Trophy, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', iconUrl: '', rewardPoints: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/admin/loyalty/achievements');
      setAchievements(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách thành tựu');
    }
  };

  const handleOpenModal = (achievement = null) => {
    if (achievement) {
      setFormData(achievement);
    } else {
      setFormData({ id: null, name: '', description: '', iconUrl: '', rewardPoints: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.id) {
        await api.put(`/admin/loyalty/achievements/${formData.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/admin/loyalty/achievements', formData);
        toast.success('Thêm mới thành công');
      }
      setIsModalOpen(false);
      fetchAchievements();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành tựu này?')) return;
    try {
      await api.delete(`/admin/loyalty/achievements/${id}`);
      toast.success('Xóa thành công');
      fetchAchievements();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Trophy size={24} style={{ color: 'var(--accent-primary)' }} />
            Quản lý Thành tựu
          </h2>
          <p className="page-subtitle">Quản lý các thành tựu và điểm thưởng cho thành viên</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={18} /> Thêm Thành tựu
        </button>
      </div>

      <div className="grid-3">
        {achievements.map(ach => (
          <div key={ach.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div style={{ fontSize: '2rem' }}>{ach.iconUrl || '🏆'}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ach.name}</h3>
                  <span className="badge badge-orange" style={{ marginTop: '4px' }}>+{ach.rewardPoints} Điểm</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(ach)} className="btn btn-icon">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(ach.id)} className="btn btn-icon" style={{ color: '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {ach.description}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {formData.id ? 'Sửa Thành tựu' : 'Thêm Thành tựu mới'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tên thành tựu</label>
                  <input
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea
                    required rows="3"
                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (Emoji hoặc URL)</label>
                  <input
                    type="text"
                    value={formData.iconUrl} onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    className="form-control"
                    placeholder="Ví dụ: 🍿 hoặc https://..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm thưởng</label>
                  <input
                    type="number" required min="0"
                    value={formData.rewardPoints === null || isNaN(formData.rewardPoints) ? '' : formData.rewardPoints} 
                    onChange={(e) => setFormData({ ...formData, rewardPoints: e.target.value === '' ? 0 : parseInt(e.target.value) })}
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

export default Achievements;
