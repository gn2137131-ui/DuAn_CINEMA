import toast from 'react-hot-toast';
import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      const userData = {
        fullName: res.data.user?.name || res.data.username || 'Quản trị viên',
        role: res.data.role || 'Admin',
        avatar: res.data.user?.avatarUrl || null
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect based on role
      if (res.data.role === 'ROLE_EMPLOYEE' || res.data.role === 'EMPLOYEE') {
        navigate('/admin/scanner');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Sai tài khoản hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-base)', opacity: '0.85', backdropFilter: 'blur(8px)' }}></div>

      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '256px', height: '128px', background: 'var(--accent-primary)', borderRadius: '50%', filter: 'blur(80px)', opacity: '0.15', pointerEvents: 'none' }}></div>

        <div className="card-head" style={{ justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '32px 24px 24px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'var(--gradient-primary)', padding: '12px', borderRadius: 'var(--radius-lg)' }}>
              <Film size={32} style={{ color: 'white' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CineAdmin
          </h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>Hệ thống quản lý nội bộ</p>
        </div>

        <form onSubmit={handleLogin} className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 10 }}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={credentials.username}
              onChange={e => setCredentials({ ...credentials, username: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={e => setCredentials({ ...credentials, password: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '14px 24px', fontSize: '1rem' }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
