import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://duancinema-production.up.railway.app/api',
  headers: { 'Content-Type': 'application/json' }
});

// Hàm lấy và chuẩn hóa token từ localStorage
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  let token = localStorage.getItem('token');
  if (!token) return null;

  token = token.trim();
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  return token.replace(/^Bearer\s+/i, '');
};

// Interceptor đính kèm Token vào Header mỗi khi gọi API
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý dữ liệu trả về và bắt lỗi tập trung (Ví dụ: 401)
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về thẳng dữ liệu server, đồng thời mở gói nếu backend bọc payload vào `data`
    const data = response.data;
    return data && typeof data === 'object' && 'data' in data ? data.data : data;
  },
  (error) => {
    // Nếu Backend báo lỗi 401 (Hết hạn phiên làm việc hoặc chưa đăng nhập hợp lệ)
    if (error.response && error.response.status === 401) {
      // Chỉ tự động xóa token và chuyển trang nếu không phải đang ở trang login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;