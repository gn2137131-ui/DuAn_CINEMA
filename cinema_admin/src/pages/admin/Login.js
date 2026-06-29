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
      alert('Sai tài khoản hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>

      <div className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500 rounded-full blur-[80px] opacity-20"></div>

        <div className="p-8 pb-6 text-center text-white relative z-10 border-b border-gray-800">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-orange-400 to-red-600 p-3 rounded-2xl shadow-lg shadow-orange-500/30">
              <Film size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            CineAdmin
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-medium">Hệ thống quản lý nội bộ</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={credentials.username}
              onChange={e => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3.5 text-white placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={e => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3.5 text-white placeholder-gray-500 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3.5 text-white font-bold shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-red-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;