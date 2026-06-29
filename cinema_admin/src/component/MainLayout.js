import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect, useState } from 'react';

const MainLayout = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [role, setRole] = useState('EMPLOYEE');
  const [isReady, setIsReady] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    setIsReady(true);
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  if (!isReady) return null;

  const isEmployee = role === 'EMPLOYEE' || role === 'ROLE_EMPLOYEE';
  const allowedPathsForEmployee = ['/admin/scanner', '/admin/pos', '/admin/bookings'];
  const isTryingToAccessAdminRoute = !allowedPathsForEmployee.includes(location.pathname);
  
  if (isEmployee && isTryingToAccessAdminRoute) {
    return <Navigate to="/admin/pos" replace />;
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg-base)', color: 'var(--text-primary)',
    }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isCollapsed ? '70px' : '256px', minHeight: '100vh', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}>
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;