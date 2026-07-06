import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Download, Clock } from 'lucide-react';
import statApi from '../../api/statApi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export function Revenue() {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueStats = async () => {
      try {
        setLoading(true);
        const res = await statApi.getRevenueStats();
        setRevenueData(res.data);
      } catch (error) {
        console.error("Failed to fetch revenue stats", error);
        toast.error("Không thể tải dữ liệu doanh thu!");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueStats();
  }, []);

  if (loading || !revenueData) {
    return <div className="empty-state"><div className="spinner" /><p>Đang tải dữ liệu...</p></div>;
  }

  const { monthlyData = [], movieRevenue = [] } = revenueData || {};

  // Tính tổng doanh thu phim để quy đổi phần trăm chính xác
  const totalMovieRevenue = movieRevenue.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalRevenueAll = monthlyData.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalTicketsAll = monthlyData.reduce((sum, m) => sum + (m.tickets || 0), 0);

  // Hàm tiện ích định dạng tiền tệ Việt Nam (Ví dụ: 1.400.000.000 đ)
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="admin-page">
      {/* KHỐI TIÊU ĐỀ HỆ THỐNG */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Báo cáo doanh thu</h2>
          <p className="page-subtitle mt-1">Thống kê chi tiết doanh thu và hiệu suất kinh doanh của rạp phim</p>
        </div>
        <button className="btn btn-primary">
          <Download size={16} />
          Xuất báo cáo (Excel)
        </button>
      </div>

      {/* Grid chứa 2 thẻ Summary lớn */}
      <motion.div className="grid-2" style={{ marginBottom: '24px' }} variants={containerVariants} initial="hidden" animate="show">

        {/* Thẻ Tổng doanh thu */}
        <motion.div className="stat-card" variants={itemVariants} whileHover={{ scale: 1.02 }} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ flex: 1 }}>
            <p className="stat-label">Tổng doanh thu dự kiến</p>
            <h3 className="stat-value" style={{ color: '#34d399', fontSize: '2rem', marginBottom: '12px' }}>{formatVND(totalRevenueAll)}</h3>
            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Tăng trưởng mạnh so với cùng kỳ
            </span>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
        </motion.div>

        {/* Thẻ Tổng vé bán ra */}
        <motion.div className="stat-card" variants={itemVariants} whileHover={{ scale: 1.02 }} style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ flex: 1 }}>
            <p className="stat-label">Tổng vé bán ra</p>
            <h3 className="stat-value" style={{ color: '#60a5fa', fontSize: '2rem', marginBottom: '12px' }}>{totalTicketsAll.toLocaleString('vi-VN')}</h3>
            <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> Cập nhật liên tục theo thời gian thực
            </span>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <TrendingUp size={24} style={{ color: '#3b82f6' }} />
          </div>
        </motion.div>

      </motion.div>

      {/* Grid chứa 2 Biểu đồ */}
      <motion.div className="grid-2" style={{ marginBottom: '24px' }} variants={containerVariants} initial="hidden" animate="show">

        {/* Biểu đồ Cột - Doanh thu các tháng */}
        <motion.div className="card card-pad" variants={itemVariants}>
          <h3 style={{ fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: '#60a5fa' }} /> Biểu đồ doanh thu từng tháng
          </h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000000)}Tr`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                  formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="revenue" fill="url(#barGradMonth)" radius={[6, 6, 0, 0]} maxBarSize={50} isAnimationActive={true} animationBegin={200} animationDuration={1500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Biểu đồ Cột ngang - Top Phim doanh thu cao */}
        <motion.div className="card card-pad" variants={itemVariants}>
          <h3 style={{ fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: '#34d399' }} /> Top phim đạt doanh thu cao nhất
          </h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movieRevenue} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradTopMovies" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000)}Tr`} />
                <YAxis dataKey="movie" type="category" stroke="var(--text-secondary)" fontSize={13} tickLine={false} axisLine={false} fontWeight={600} width={100} />
                <Tooltip
                  cursor={{ fill: 'rgba(16,185,129,0.05)' }}
                  formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="revenue" fill="url(#barGradTopMovies)" radius={[0, 6, 6, 0]} maxBarSize={30} isAnimationActive={true} animationBegin={400} animationDuration={1500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </motion.div>

      {/* BẢNG DOANH THU THEO PHIM (TOP MOVIES REVENUE) */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <h3>Xếp hạng doanh thu theo đầu phim</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Hạng</th>
              <th>Tên phim</th>
              <th style={{ textAlign: 'right' }}>Số lượng vé bán</th>
              <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
              <th style={{ textAlign: 'right', width: '120px' }}>% Doanh số</th>
            </tr>
          </thead>
          <tbody>
            {movieRevenue.map((movie, index) => {
              const percentage = totalMovieRevenue > 0 ? ((movie.revenue / totalMovieRevenue) * 100).toFixed(1) : 0;

              return (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', margin: '0 auto',
                      background: index === 0 ? 'rgba(251,191,36,0.2)' : index === 1 ? 'var(--bg-elevated)' : index === 2 ? 'rgba(249,115,22,0.2)' : 'var(--bg-surface)',
                      color: index === 0 ? '#fbbf24' : index === 1 ? 'var(--text-primary)' : index === 2 ? '#f97316' : 'var(--text-muted)'
                    }}>
                      {index + 1}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700' }}>{movie.movie}</td>
                  <td style={{ textAlign: 'right' }}>{movie.tickets.toLocaleString('vi-VN')} vé</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-success)' }}>{formatVND(movie.revenue)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-blue">{percentage}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bảng chi tiết doanh thu theo tháng */}
      <div className="table-wrap">
        <div className="card-head">
          <h3>Bảng chi tiết doanh thu năm nay</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
              <th style={{ textAlign: 'center' }}>Số vé bán ra</th>
              <th style={{ textAlign: 'right' }}>Giá vé trung bình</th>
              <th style={{ textAlign: 'center' }}>Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((data, idx) => {
              const prevRevenue = idx > 0 ? monthlyData[idx - 1].revenue : data.revenue;
              const isGrowing = data.revenue >= prevRevenue;

              return (
                <tr key={data.month}>
                  <td style={{ fontWeight: '700' }}>{data.month}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-success)' }}>
                    {data.revenue ? data.revenue.toLocaleString('vi-VN') : 0} đ
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {data.tickets ? data.tickets.toLocaleString('vi-VN') : 0}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {data.avg ? data.avg.toLocaleString('vi-VN') : 0} đ
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {data.revenue === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem' }}>-</span>
                    ) : isGrowing ? (
                      <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} /> Tăng
                      </span>
                    ) : (
                      <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} /> Giảm
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}