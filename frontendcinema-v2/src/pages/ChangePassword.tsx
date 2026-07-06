import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!');
      setIsLoading(false);
      return;
    }

    try {
      const data = await axiosClient.post('/auth/change-password', { 
        oldPassword: formData.oldPassword, 
        newPassword: formData.newPassword 
      }) as any;
      
      const payload = data?.data ?? data;
      setSuccessMessage(payload.message || 'Đổi mật khẩu thành công! Đang chuyển hướng...');
      
      // Update local storage so we don't think it's temporary anymore
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userObj.isTemporaryPassword = false;
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {}
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Change password error:', error);
      setErrorMessage(error.response?.data?.error || 'Đổi mật khẩu thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Đổi mật khẩu</h1>
            <p className="text-gray-800 dark:text-gray-200">
              Vui lòng tạo mật khẩu mới để bảo vệ tài khoản của bạn.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8"
          >
            {/* Vùng hiển thị lỗi */}
            {errorMessage && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Vùng hiển thị thông báo thành công */}
            {successMessage && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl text-center font-medium"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Mật khẩu cũ */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Mật khẩu cũ (Mật khẩu tạm)
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <input
                    type="password"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900 placeholder:text-gray-600 dark:text-gray-400"
                    placeholder="Nhập mật khẩu hiện tại"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900 placeholder:text-gray-600 dark:text-gray-400"
                    placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, số & ký tự đặc biệt"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-red-500 focus:outline-none transition-colors disabled:bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-900 placeholder:text-gray-600 dark:text-gray-400"
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Nút Đổi mật khẩu */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Lưu Mật Khẩu'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
