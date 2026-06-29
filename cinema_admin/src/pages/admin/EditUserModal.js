import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export function EditUserModal({ isOpen, onClose, user, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'CUSTOMER'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'CUSTOMER'
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axiosClient.put(`/users/${user.id}`, formData);
      toast.success('Cập nhật người dùng thành công!');
      onUpdateSuccess(); // Gọi callback để refresh bảng
      onClose(); // Đóng Modal
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || 'Có lỗi xảy ra khi cập nhật!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold">Cập nhật tài khoản: {user.username}</h3>
            <button 
              onClick={() => !isSubmitting && onClose()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={16} className="text-gray-400" /> Họ và tên
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nhập họ và tên..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nhập email..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone size={16} className="text-gray-400" /> Số điện thoại
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nhập số điện thoại..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <ShieldAlert size={16} className="text-blue-500" /> Phân quyền (Vai trò)
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              >
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>

            {/* Footer */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                <Save size={16} />
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
