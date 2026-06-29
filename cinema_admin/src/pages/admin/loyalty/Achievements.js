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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={24} color="var(--accent-primary)" />
          Quản lý Thành tựu
        </h1>
        <button
          onClick={() => handleOpenModal()}
          style={{
            background: 'var(--gradient-primary)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
          }}
        >
          <Plus size={18} /> Thêm Thành tựu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {achievements.map(ach => (
          <div key={ach.id} style={{
            background: 'var(--bg-sidebar)', padding: '20px', borderRadius: '12px',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '2rem' }}>{ach.iconUrl || '🏆'}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{ach.name}</h3>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{ach.rewardPoints} Điểm</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenModal(ach)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(ach.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {ach.description}
            </p>
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
              {formData.id ? 'Sửa Thành tựu' : 'Thêm Thành tựu mới'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Tên thành tựu</label>
                <input
                  type="text" required
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Mô tả chi tiết</label>
                <textarea
                  required rows="3"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Icon (Emoji hoặc URL)</label>
                <input
                  type="text"
                  value={formData.iconUrl} onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'white' }}
                  placeholder="Ví dụ: 🍿 hoặc https://..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Điểm thưởng</label>
                <input
                  type="number" required min="0"
                  value={formData.rewardPoints === null || isNaN(formData.rewardPoints) ? '' : formData.rewardPoints} 
                  onChange={(e) => setFormData({ ...formData, rewardPoints: e.target.value === '' ? 0 : parseInt(e.target.value) })}
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

export default Achievements;
