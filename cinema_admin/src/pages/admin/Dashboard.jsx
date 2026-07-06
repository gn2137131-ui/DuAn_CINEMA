import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Ticket, DollarSign, ArrowUpRight, ArrowDownRight, Film, RefreshCw } from 'lucide-react';
import { socketAdminService } from '../../utils/socketAdmin';
import statApi from '../../api/statApi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const COLORS = ['#f97316', '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: '700' }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('vi-VN') : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await statApi.getDashboardStats();
      setDashboardData(res.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu thống kê!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    let subscription = null;
    const performSubscribe = () => {
      subscription = socketAdminService.subscribe('/topic/admin/dashboard', (message) => {
        if (message && message.type === 'NEW_BOOKING') {
          const amount = message.amount ? Number(message.amount).toLocaleString('vi-VN') : 'N/A';
          toast.success(`🎫 Đơn mới! Đơn #${message.bookingId} — ${amount}đ`, { duration: 5000 });
          fetchStats();
        }
      });
    };
    if (socketAdminService.client.connected) performSubscribe();
    else {
      socketAdminService.client.onConnect = () => performSubscribe();
      socketAdminService.connect();
    }
    return () => { if (subscription?.unsubscribe) subscription.unsubscribe(); };
  }, []);

  const formatCurrency = (value) => {
    if (!value) return '0đ';
    const v = Number(value);
    if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + ' triệu';
    return v.toLocaleString('vi-VN') + 'đ';
  };

  if (loading || !dashboardData) {
    return (
      <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="empty-state">
          <div className="spinner" />
          <h4>Đang tải dữ liệu dashboard...</h4>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Tổng Doanh Thu',
      value: formatCurrency(dashboardData.totalRevenue),
      change: dashboardData.revenueChange,
      up: true,
      icon: DollarSign,
      accent: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: 'Vé Đã Bán',
      value: (dashboardData.ticketsSold || 0).toLocaleString('vi-VN'),
      change: dashboardData.ticketsChange,
      up: true,
      icon: Ticket,
      accent: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
    },
    {
      label: 'Khách Hàng',
      value: (dashboardData.totalCustomers || 0).toLocaleString('vi-VN'),
      change: dashboardData.customersChange,
      up: true,
      icon: Users,
      accent: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      label: 'Phim Đang Chiếu',
      value: (dashboardData.activeMovies || 0).toString(),
      change: dashboardData.activeMoviesChange,
      up: false,
      icon: Film,
      accent: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
  ];

  const statusConfig = {
    'Đã thanh toán': { cls: 'badge-green', dot: '#22c55e' },
    'PAID':          { cls: 'badge-green', dot: '#22c55e' },
    'Đang chờ':      { cls: 'badge-yellow', dot: '#f59e0b' },
    'PENDING':       { cls: 'badge-yellow', dot: '#f59e0b' },
    'Đã hủy':        { cls: 'badge-red', dot: '#ef4444' },
    'CANCELLED':     { cls: 'badge-red', dot: '#ef4444' },
  };

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hoạt động kinh doanh rạp phim — cập nhật real-time</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats} style={{ gap: '7px' }}>
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* STAT CARDS */}
      <motion.div className="grid-4" style={{ marginBottom: '24px' }} variants={containerVariants} initial="hidden" animate="show">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} className="stat-card" variants={itemVariants} whileHover={{ scale: 1.03, y: -5 }}>
              <div>
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value" style={{ color: stat.accent }}>{stat.value}</h3>
                <p className="stat-change">
                  {stat.up
                    ? <ArrowUpRight size={13} className="badge-green" style={{ borderRadius: 0, padding: 0, background: 'none', border: 'none' }} />
                    : <ArrowDownRight size={13} className="badge-red" style={{ borderRadius: 0, padding: 0, background: 'none', border: 'none' }} />}
                  <span style={{ color: stat.up ? '#22c55e' : '#ef4444', marginLeft: '4px' }}>{stat.change}</span>
                  <span style={{ color: 'var(--text-muted)' }}> so với tháng trước</span>
                </p>
              </div>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <Icon size={22} style={{ color: stat.accent }} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CHARTS ROW */}
      <motion.div className="grid-3" style={{ marginBottom: '24px' }} variants={containerVariants} initial="hidden" animate="show">
        {/* Revenue Area Chart */}
        <motion.div className="card" variants={itemVariants} whileHover={{ boxShadow: '0 8px 30px rgba(249,115,22,0.15)' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316', fontWeight: 'bold' }}>
              <TrendingUp size={18} /> Doanh thu năm nay (triệu VNĐ)
            </span>
          </div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dashboardData.revenueData || []} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#f97316" strokeWidth={3}
                  fill="url(#revenueGrad)" dot={{ r: 4, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} filter="url(#glow)" isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Genre Pie Chart */}
        <motion.div className="card" variants={itemVariants} whileHover={{ boxShadow: '0 8px 30px rgba(99,102,241,0.15)' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: 'bold' }}>
              <Film size={18} /> Thể loại phổ biến
            </span>
          </div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dashboardData.movieTypeData || []}
                  cx="50%" cy="45%"
                  outerRadius={90} innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {(dashboardData.movieTypeData || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.15))' }} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} phim`, 'Số lượng']} content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Movies Bar Chart */}
        <motion.div className="card" variants={itemVariants} whileHover={{ boxShadow: '0 8px 30px rgba(139,92,246,0.15)' }}>
          <div className="card-head">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: 'bold' }}>
              <TrendingUp size={18} /> Top 5 Phim Doanh Thu Cao Nhất
            </span>
          </div>
          <div className="card-pad">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboardData.topMovies || []} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#d946ef" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v / 1000000) + 'M'} />
                <YAxis dataKey="title" type="category" stroke="var(--text-muted)" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.05)' }} />
                <Bar dataKey="revenue" name="Doanh thu (VNĐ)" fill="url(#barGrad)" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={true} animationBegin={400} animationDuration={1500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* RECENT TRANSACTIONS */}
      <div className="card">
        <div className="card-head">
          <span>🧾 Giao dịch gần đây</span>
          <a href="/admin/bookings" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Xem tất cả →
          </a>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Phim</th>
                <th>Khách hàng</th>
                <th style={{ textAlign: 'center' }}>Số ghế</th>
                <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(dashboardData.recentTransactions || []).length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Ticket size={36} />
                      <h4>Chưa có giao dịch nào</h4>
                    </div>
                  </td>
                </tr>
              ) : (dashboardData.recentTransactions || []).map(b => {
                const sc = statusConfig[b.status] || { cls: 'badge-gray', dot: '#94a3b8' };
                return (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                        #{b.id}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{b.movie}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.customer}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{b.seats}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      {Number(b.price).toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${sc.cls}`}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}