import { Film, Mail, Phone, MapPin, Smartphone, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface CinemaSettings {
  cinemaName: string;
  email: string;
  phone: string;
  address: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<CinemaSettings>({
    cinemaName: 'CineVerse',
    email: 'support@cineverse.vn',
    phone: '1900-1234',
    address: '123 Đường Nguyễn Huệ, Q1, TP.HCM',
  });

  useEffect(() => {
    fetch('https://duancinema-production.up.railway.app/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings({
            cinemaName: data.cinemaName || 'CineVerse',
            email: data.email || 'support@cineverse.vn',
            phone: data.phone || '1900-1234',
            address: data.address || '123 Đường Nguyễn Huệ, Q1, TP.HCM',
          });
        }
      })
      .catch(() => {
        // Giữ nguyên giá trị mặc định nếu API lỗi
      });
  }, []);

  return (
    <footer className="bg-black text-white">
      {/* Newsletter Section */}
      <div className="bg-slate-900 border-t border-b border-slate-800 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/5 blur-[100px] rounded-full"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2 text-slate-100">Đăng ký nhận ưu đãi</h3>
              <p className="text-slate-400">Nhận thông tin phim mới và khuyến mãi đặc biệt</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="px-4 py-3 rounded-xl flex-1 md:w-80 bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-600"
              />
              <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors whitespace-nowrap shadow-lg shadow-red-600/20">
                Đăng Ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Film className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">{settings.cinemaName}</span>
            </Link>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam với công nghệ âm thanh và hình ảnh đỉnh cao.
            </p>
          </div>

          {/* Movies */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Phim</h4>
            <ul className="space-y-3">
              {[
                { href: '#movies', label: 'Phim Đang Chiếu' },
                { href: '#upcoming', label: 'Phim Sắp Chiếu' },
                { href: '#imax', label: 'Suất Chiếu IMAX' },
                { href: '#special', label: 'Suất Chiếu Đặc Biệt' },
                { href: '#reviews', label: 'Đánh Giá Phim' },
              ].map(item => (
                <li key={item.href}>
                  <a href={item.href} className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Dịch Vụ</h4>
            <ul className="space-y-3">
              {[
                { href: '#theaters', label: 'Tất Cả Rạp' },
                { href: '#membership', label: 'Thẻ Thành Viên' },
                { href: '#voucher', label: 'Mã Giảm Giá' },
                { href: '#gift', label: 'Thẻ Quà Tặng' },
                { href: '#booking', label: 'Đặt Vé Nhóm' },
              ].map(item => (
                <li key={item.href}>
                  <a href={item.href} className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Dynamic from API */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Liên Hệ</h4>
            <ul className="space-y-4">
              <li>
                <a href={`tel:${settings.phone}`} className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <div className="text-sm">Hotline</div>
                    <div className="font-semibold text-white">{settings.phone}</div>
                  </div>
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <div className="text-sm">Email</div>
                    <div className="font-semibold text-white">{settings.email}</div>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                <div>
                  <div className="text-sm">Địa chỉ</div>
                  <div className="font-semibold text-white">{settings.address}</div>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <Clock className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                <div>
                  <div className="text-sm">Giờ làm việc</div>
                  <div className="font-semibold text-white">8:00 - 23:00 hàng ngày</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* App Download Section */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-lg mb-2">Tải ứng dụng {settings.cinemaName}</h4>
              <p className="text-gray-600">Đặt vé nhanh chóng, nhận ưu đãi độc quyền</p>
            </div>
            <div className="flex gap-4">
              {['App Store', 'Google Play'].map(store => (
                <a key={store} href="#" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-6 py-3 rounded-xl transition-colors">
                  <Smartphone className="w-6 h-6 text-slate-300" />
                  <div className="text-left">
                    <div className="text-xs text-slate-500">Tải trên</div>
                    <div className="font-semibold text-slate-200">{store}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-center md:text-left">
            <p>&copy; 2026 {settings.cinemaName}. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              { href: '#terms', label: 'Điều Khoản Sử Dụng' },
              { href: '#privacy', label: 'Chính Sách Bảo Mật' },
              { href: '#faq', label: 'Câu Hỏi Thường Gặp' },
              { href: '#support', label: 'Hỗ Trợ' },
            ].map(link => (
              <a key={link.href} href={link.href} className="text-gray-600 hover:text-orange-500 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-xs text-gray-700 text-center">
              <div className="font-semibold mb-1">Chứng nhận</div>
              <div>Bộ Văn hóa, Thể thao và Du lịch</div>
            </div>
            <div className="text-xs text-gray-700 text-center">
              <div className="font-semibold mb-1">Phương thức thanh toán</div>
              <div>Visa • Mastercard • MoMo • ZaloPay</div>
            </div>
            <div className="text-xs text-gray-700 text-center">
              <div className="font-semibold mb-1">Đối tác công nghệ</div>
              <div>Dolby Atmos • IMAX • 4DX</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
