import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Copy, Scissors, Gift, Sparkles, ChevronRight, Ticket, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

interface Promotion {
  id: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderValue: number;
  expirationDate: string;
  usageLimit: number;
  usedCount: number;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get('/discount-codes/public') as any;
        setPromotions(Array.isArray(response) ? response : response.data || []);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        toast.error('Không thể tải danh sách khuyến mãi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã khuyến mãi: ' + code);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl mix-blend-screen"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm text-yellow-400 mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wider">Siêu Ưu Đãi Tháng Này</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 leading-tight"
              >
                Săn Khuyến Mãi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Xem Phim Cực Đã</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-400 mb-10 leading-relaxed"
              >
                Khám phá ngay hàng loạt mã giảm giá và chương trình ưu đãi đặc biệt dành riêng cho bạn. Đừng bỏ lỡ cơ hội thưởng thức những bộ phim bom tấn với giá cực hời tại CineVerse.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <a href="#voucher-list" className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-full shadow-lg shadow-red-600/30 transition-all flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Nhận mã ngay
                </a>
                <Link to="/movies" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-slate-700">
                  <Ticket className="w-5 h-5" />
                  Đặt vé xem phim
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Promotions List Section */}
        <section id="voucher-list" className="py-20 relative z-20 -mt-10 bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-10 border-b border-slate-800 pb-6">
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <Tag className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white">Mã Khuyến Mãi Đang Mở</h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-red-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-semibold text-lg">Đang tìm kiếm ưu đãi...</p>
              </div>
            ) : promotions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo, index) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 hover:border-slate-600 transition-all duration-300 flex flex-col"
                  >
                    {/* Decorative Top Banner */}
                    <div className="h-3 bg-gradient-to-r from-red-600 to-orange-500 w-full"></div>
                    
                    {/* Top Section: Icon & Discount Value */}
                    <div className="p-6 pb-0 flex items-start gap-4">
                      <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 p-4 rounded-2xl border border-red-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Scissors className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 leading-none">
                          {promo.type === 'PERCENTAGE' ? `GIẢM ${promo.value}%` : `-${(promo.value / 1000)}K`}
                        </h3>
                        <p className="text-slate-400 font-semibold mt-1">CineVerse Voucher</p>
                      </div>
                    </div>

                    {/* Middle Section: Details */}
                    <div className="p-6 flex-1">
                      <h4 className="text-lg font-bold text-white mb-4 line-clamp-2">{promo.description || 'Chương trình khuyến mãi đặc biệt từ CineTicket'}</h4>
                      
                      <div className="space-y-3">
                        {promo.minOrderValue > 0 && (
                          <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                            <span>Đơn tối thiểu: <strong className="text-slate-200">{promo.minOrderValue.toLocaleString('vi-VN')}đ</strong></span>
                          </div>
                        )}
                        {promo.expirationDate && (
                          <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>HSD: <strong className="text-red-400">{new Date(promo.expirationDate).toLocaleDateString('vi-VN')}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span>Số lượng còn lại: <strong className="text-green-400">{promo.usageLimit - promo.usedCount}</strong> lượt</span>
                        </div>
                      </div>
                    </div>

                    {/* Divider with cutout effect */}
                    <div className="relative h-8 flex items-center justify-between overflow-hidden">
                      <div className="absolute left-0 w-4 h-8 bg-slate-950 rounded-r-full border-y border-r border-slate-800 -ml-px"></div>
                      <div className="w-full border-t-2 border-dashed border-slate-800 mx-4"></div>
                      <div className="absolute right-0 w-4 h-8 bg-slate-950 rounded-l-full border-y border-l border-slate-800 -mr-px"></div>
                    </div>

                    {/* Bottom Section: Code & Copy */}
                    <div className="p-6 pt-0 mt-4 flex items-center justify-between">
                      <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 flex-1 mr-4">
                        <span className="font-mono font-bold text-lg text-slate-300 tracking-widest uppercase">{promo.code}</span>
                      </div>
                      <button 
                        onClick={() => handleCopyCode(promo.code)}
                        className="flex items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors group/btn"
                        title="Copy mã"
                      >
                        <Copy className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-slate-900/50 rounded-3xl border border-slate-800/50"
              >
                <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Tag className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300 mb-3">Chưa có khuyến mãi nào</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Hiện tại không có mã khuyến mãi công khai nào. Các chương trình khuyến mãi sẽ sớm được cập nhật, bạn hãy quay lại sau nhé!
                </p>
                <Link to="/movies" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors">
                  Khám phá phim đang chiếu <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
