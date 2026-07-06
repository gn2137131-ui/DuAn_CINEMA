import React, { useEffect, useState } from 'react';
import {
  Film, Calendar, Ticket, LayoutDashboard, Popcorn,
  Tag, Users, TrendingUp, Settings, ScanLine, Monitor,
  MapPin, ShoppingCart, Star, ChevronRight, Clapperboard, Menu, ChevronLeft, Award, Trophy
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const menuGroups = [
  {
    label: 'Tổng quan',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Thống kê Doanh thu', icon: TrendingUp, path: '/admin/revenue' },
    ]
  },
  {
    label: 'Nội dung',
    items: [
      { name: 'Quản lý Phim', icon: Film, path: '/admin/movies' },
      { name: 'Phòng chiếu', icon: MapPin, path: '/admin/rooms' },
      { name: 'Suất chiếu', icon: Calendar, path: '/admin/showtimes' },
      { name: 'Banner Trang chủ', icon: Monitor, path: '/admin/banner' },
    ]
  },
  {
    label: 'Bán hàng',
    items: [
      { name: 'Bán vé (POS)', icon: ShoppingCart, path: '/admin/pos' },
      { name: 'Đơn đặt vé', icon: Ticket, path: '/admin/bookings' },
      { name: 'Bắp nước & Combo', icon: Popcorn, path: '/admin/snacks' },
      { name: 'Mã giảm giá', icon: Tag, path: '/admin/discounts' },
    ]
  },
  {
    label: 'Cộng đồng & Loyalty',
    items: [
      { name: 'Khách hàng', icon: Users, path: '/admin/customers' },
      { name: 'Hạng thành viên', icon: Award, path: '/admin/loyalty/tiers' },
      { name: 'Thành tựu', icon: Trophy, path: '/admin/loyalty/achievements' },
      { name: 'Đánh giá & Bình luận', icon: Star, path: '/admin/reviews' },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { name: 'Soát vé & In vé', icon: ScanLine, path: '/admin/scanner' },
      { name: 'Cài đặt', icon: Settings, path: '/admin/settings' },
    ]
  },
];

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('EMPLOYEE');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role || 'EMPLOYEE');
      } catch (e) {
        setRole('EMPLOYEE');
      }
    }
  }, []);

  const isAdmin = (role || '').toUpperCase().includes('ADMIN');

  const allowedPaths = isAdmin
    ? null // all paths allowed
    : ['/admin/scanner', '/admin/pos', '/admin/bookings'];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      allowedPaths === null || allowedPaths.includes(item.path)
    )
  })).filter(group => group.items.length > 0);

  return (
    <aside style={{
      width: isCollapsed ? '70px' : '256px', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* LOGO */}
      <div style={{
        padding: isCollapsed ? '24px 10px 20px' : '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-orange)',
            }}>
              <Clapperboard size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                Cine<span style={{ color: 'var(--accent-primary)' }}>Admin</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
              </div>
            </div>
          </div>
        )}
        <button 
           onClick={() => setIsCollapsed(!isCollapsed)}
           title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
           style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px', borderRadius: '8px', transition: 'all 0.2s'
           }}
           onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
           onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          {isCollapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
        </button>
      </div>

      {/* MENU */}
      <nav style={{ flex: 1, padding: isCollapsed ? '12px 6px' : '12px 12px', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
        {filteredGroups.map(group => (
          <div key={group.label} style={{ marginBottom: '6px' }}>
            {!isCollapsed && (
              <div style={{
                fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '10px 10px 4px', whiteSpace: 'nowrap'
              }}>
                {group.label}
              </div>
            )}
            {isCollapsed && <div style={{ height: '16px' }}></div>}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.name : ''}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isCollapsed ? '12px' : '9px 12px', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer', marginBottom: '2px',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.845rem',
                    transition: 'var(--transition)',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(239,68,68,0.10) 100%)'
                      : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={isCollapsed ? 20 : 16} style={{ flexShrink: 0 }} />
                  {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.name}</span>}
                  {!isCollapsed && isActive && <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.6 }} />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      {!isCollapsed && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center',
          flexShrink: 0, whiteSpace: 'nowrap'
        }}>
          © 2026 CineVerse Admin v2.0
        </div>
      )}
    </aside>
  );
};

export default Sidebar;