import React, { useEffect, useState } from 'react';
import { Loader2, Search, Users, ShieldAlert, Star, UserPlus, Mail, Edit } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { EditUserModal } from './EditUserModal';

export function CustomerManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Gọi API lấy danh sách User từ Spring Boot
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thành viên:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalCustomers = users.filter(u => u.role === 'CUSTOMER').length;
  const totalStaff = users.filter(u => u.role === 'ADMIN').length;
  
  const vipCustomers = 0; 
  const newThisMonth = 0;

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Hàm sinh Avatar ký tự chữ khi không có hình ảnh đại diện từ backend
  const renderAvatar = (user) => {
    if (user.avatar || user.avatarUrl) {
      return (
        <img 
          src={user.avatar || user.avatarUrl} 
          alt={user.fullName || user.username} 
          className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
        />
      );
    }

    // Lấy ký tự đầu tiên của Họ Tên hoặc Username để làm chữ đại diện
    const displayName = user.fullName || user.username || 'A';
    const firstLetter = displayName.charAt(0).toUpperCase();

    // Đổi màu nền Avatar linh hoạt theo vai trò Admin/Customer
    const bgStyle = user.role === 'ADMIN' 
      ? 'bg-rose-500/10 text-rose-600 ring-rose-500/10' 
      : 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/10';

    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ring-2 ${bgStyle}`}>
        {firstLetter}
      </div>
    );
  };

  const roleBadge = (role) => {
    if (role === 'ADMIN') return { cls: 'badge-red', label: 'Admin', Icon: ShieldAlert };
    if (role === 'EMPLOYEE') return { cls: 'badge-orange', label: 'Nhân viên', Icon: ShieldAlert };
    return { cls: 'badge-blue', label: 'Khách hàng', Icon: Users };
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Khách Hàng & Người Dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản, phân quyền và theo dõi hoạt động</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid-4">
        {[
          { label: 'Tổng khách hàng', value: isLoading ? '...' : totalCustomers, accent: '#6366f1', Icon: Users },
          { label: 'Thành viên VIP', value: isLoading ? '...' : vipCustomers, accent: '#f59e0b', Icon: Star },
          { label: 'Ban quản trị', value: isLoading ? '...' : totalStaff, accent: '#ef4444', Icon: ShieldAlert },
          { label: 'Mới tháng này', value: isLoading ? '...' : `+${newThisMonth}`, accent: '#22c55e', Icon: UserPlus },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div>
              <p className="stat-label">{s.label}</p>
              <h3 className="stat-value">{s.value}</h3>
            </div>
            <div className="stat-icon" style={{ background: `${s.accent}18` }}>
              <s.Icon size={22} style={{ color: s.accent }} />
            </div>
          </div>
        ))}
      </div>

      {/* FILTER */}
      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, username, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-control">
            <option value="ALL">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="EMPLOYEE">Nhân viên</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Username</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Vai trò</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <Users size={40} />
                      <h4>Không tìm thấy người dùng nào</h4>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map(user => {
                const rb = roleBadge(user.role);
                const displayName = user.fullName || user.username || 'A';
                const initials = displayName.charAt(0).toUpperCase();
                const avatarGrad = user.role === 'ADMIN'
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : user.role === 'EMPLOYEE'
                  ? 'linear-gradient(135deg,#f97316,#ea580c)'
                  : 'linear-gradient(135deg,#6366f1,#4f46e5)';
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.avatar || user.avatarUrl ? (
                          <img src={user.avatar || user.avatarUrl} alt={displayName}
                            className="avatar" style={{ objectFit: 'cover', border: '2px solid var(--border)' }} />
                        ) : (
                          <div className="avatar" style={{ background: avatarGrad }}>{initials}</div>
                        )}
                        <span>{user.fullName || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">@{user.username}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} />
                        {user.email || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${rb.cls}`}>
                        <rb.Icon size={11} />
                        {rb.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                        title="Sửa thông tin"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUpdateSuccess={() => {
          fetchUsers();
        }}
      />
    </div>
  );
}

export default CustomerManagement;