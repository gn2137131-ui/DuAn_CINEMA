import React, { useState, useEffect } from 'react';
import { LogOut, User, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from './NotificationBell';

const Header = () => {
  const navigate = useNavigate();
  const [adminUsername, setAdminUsername] = useState('Admin');
  const [role, setRole] = useState('EMPLOYEE');
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let currentRole = '';

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAdminUsername(decoded.username || decoded.sub || 'Admin');
      } catch (err) {}
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) currentRole = user.role;
        if (user.fullName || user.username) {
          setAdminUsername(user.fullName || user.username);
        }
        setRole(currentRole || 'EMPLOYEE');
      } catch (e) {}
    }

    const upperRole = currentRole.toUpperCase();
    if (upperRole.includes('USER') || upperRole === 'CUSTOMER' ||
      (!upperRole.includes('ADMIN') && !upperRole.includes('EMPLOYEE'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const isAdmin = (role || '').toUpperCase().includes('ADMIN');
  const initials = adminUsername ? adminUsername.slice(0, 2).toUpperCase() : 'AD';

  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 40,
      backdropFilter: 'blur(8px)',
    }}>
      {/* SEARCH */}
      <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
        <Search size={15} style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          style={{
            width: '100%', paddingLeft: '36px', paddingRight: '14px',
            paddingTop: '9px', paddingBottom: '9px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: '0.85rem', outline: 'none', transition: 'var(--transition)',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(249,115,22,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* RIGHT SIDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notification Bell */}
        <NotificationBell />

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

        {/* User Profile */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '6px 12px 6px 8px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          transition: 'var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,131,185,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: isAdmin ? 'var(--gradient-primary)' : 'var(--gradient-cool)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '0.75rem',
          }}>
            {initials}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {adminUsername}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
            </div>
          </div>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', fontSize: '0.82rem', fontWeight: '600',
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
        >
          <LogOut size={14} />
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default Header;