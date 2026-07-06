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
      onUpdateSuccess();
      onClose();
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
        className="modal-overlay"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="modal-box"
        >
          <div className="modal-header">
            <h3 className="modal-title">Cập nhật tài khoản: {user.username}</h3>
            <button
              onClick={() => !isSubmitting && onClose()}
              className="btn-icon btn"
              disabled={isSubmitting}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={14} /> Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập họ và tên..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập email..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} /> Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Nhập số điện thoại..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <ShieldAlert size={14} /> Phân quyền (Vai trò)
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                  <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
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
