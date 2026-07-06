const fs = require('fs');

const path = 'src/pages/BookingHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate, useLocation } from 'react-router-dom';"
);

content = content.replace(
  "import { Ticket, Calendar, Clock, MapPin, Star, ArrowLeft, X, CheckCircle, MessageSquare } from 'lucide-react';",
  "import { Ticket, Calendar, Clock, MapPin, Star, ArrowLeft, X, CheckCircle, MessageSquare, Tag, Copy, Scissors } from 'lucide-react';"
);

content = content.replace(
  "  const navigate = useNavigate();\n  const [bookings",
  "  const navigate = useNavigate();\n  const location = useLocation();\n  const isPromotionsTab = location.pathname.endsWith('/wallet');\n\n  const [bookings"
);

content = content.replace(
  "  const [cancelSubmitting, setCancelSubmitting] = useState(false);\n\n  const handleAddToWallet",
  "  const [cancelSubmitting, setCancelSubmitting] = useState(false);\n\n  const [promotions, setPromotions] = useState<any[]>([]);\n  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);\n\n  const handleAddToWallet"
);

content = content.replace(
  "  const handleAddToWallet = (type: 'apple' | 'google') => {\n    toast.success(`Đã lưu vé vào ${type === 'apple' ? 'Apple' : 'Google'} Wallet thành công!`);\n  };\n\n  // Fetch user bookings",
  "  const handleAddToWallet = (type: 'apple' | 'google') => {\n    toast.success(`Đã lưu vé vào ${type === 'apple' ? 'Apple' : 'Google'} Wallet thành công!`);\n  };\n\n  const handleCopyCode = (code: string) => {\n    navigator.clipboard.writeText(code);\n    toast.success('Đã sao chép mã khuyến mãi: ' + code);\n  };\n\n  // Fetch user bookings"
);

const fetchPromoStr = `
  // Fetch promotions
  useEffect(() => {
    if (isPromotionsTab && promotions.length === 0) {
      const fetchPromotions = async () => {
        try {
          setIsLoadingPromotions(true);
          const response = await axiosClient.get('/discount-codes/public') as any;
          setPromotions(Array.isArray(response) ? response : response.data || []);
        } catch (err) {
          console.error('Error fetching promotions:', err);
          toast.error('Không thể tải danh sách khuyến mãi.');
        } finally {
          setIsLoadingPromotions(false);
        }
      };
      fetchPromotions();
    }
  }, [isPromotionsTab, promotions.length]);
`;

content = content.replace(
  "    fetchBookings();\n  }, []);\n\n  const openReviewModal",
  `    fetchBookings();\n  }, []);\n${fetchPromoStr}\n  const openReviewModal`
);

const headerUI = `            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">Trang Cá Nhân</h1>
                <p className="text-slate-400">Quản lý vé và khuyến mãi của bạn</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-slate-900 p-1 rounded-xl shadow-lg border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => navigate('/booking-history')}
                  className={\`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all \${
                    !isPromotionsTab
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }\`}
                >
                  <Ticket className="w-4 h-4" /> Lịch sử đặt vé
                </button>
                <button
                  onClick={() => navigate('/booking-history/wallet')}
                  className={\`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all \${
                    isPromotionsTab
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }\`}
                >
                  <Tag className="w-4 h-4" /> Ví Khuyến Mãi
                </button>
              </div>
            </div>`;

content = content.replace(
  '            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">\n              <div>\n                <h1 className="text-3xl font-bold mb-2 text-white">Lịch Sử Đặt Vé</h1>\n                <p className="text-slate-400">Quản lý tất cả vé đã đặt của bạn</p>\n              </div>',
  headerUI
);

content = content.replace(
  '              {/* Filter */}\n              <div className="flex gap-2 bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-800">',
  '            {!isPromotionsTab && (\n              <div className="flex justify-end mt-4">\n                <div className="flex gap-2 bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-800">'
);

content = content.replace(
  '                  Đã hủy\n                </button>\n              </div>\n            </div>\n          </motion.div>\n\n          {/* Loading State */}',
  '                  Đã hủy\n                </button>\n              </div>\n            </div>\n            )}\n          </motion.div>\n\n          {!isPromotionsTab ? (\n            <>\n          {/* Loading State */}'
);

const promoTabContent = `
          )}
          </>
          ) : (
            /* Promotions Tab Content */
            <div className="space-y-6">
              {isLoadingPromotions ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-800 font-semibold">Đang tải khuyến mãi...</p>
                </div>
              ) : promotions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {promotions.map((promo, index) => (
                    <motion.div
                      key={promo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col sm:flex-row"
                    >
                      {/* Left dashed edge effect */}
                      <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-4 bg-[radial-gradient(circle,theme(colors.slate.950)_4px,transparent_4px)] bg-[length:16px_16px] -ml-2"></div>
                      
                      {/* Promo Image/Icon Area */}
                      <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 sm:w-1/3 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-dashed border-slate-700">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                          <Scissors className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 text-center">
                          {promo.type === 'PERCENTAGE' ? \`GIẢM \${promo.value}%\` : \`GIẢM \${promo.value?.toLocaleString('vi-VN')}Đ\`}
                        </h3>
                      </div>

                      {/* Promo Details Area */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white line-clamp-2">{promo.description || 'Chương trình khuyến mãi CineTicket'}</h4>
                          </div>
                          
                          <div className="space-y-2 mt-4 text-sm text-slate-400">
                            {promo.minOrderValue > 0 && (
                              <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                Đơn tối thiểu: <strong className="text-slate-200">{promo.minOrderValue.toLocaleString('vi-VN')}đ</strong>
                              </p>
                            )}
                            {promo.expirationDate && (
                              <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                HSD: <strong className="text-red-400">{new Date(promo.expirationDate).toLocaleDateString('vi-VN')}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between bg-slate-950 p-2 pl-4 rounded-xl border border-slate-800">
                          <span className="font-mono font-bold text-lg text-slate-300 tracking-widest uppercase">{promo.code}</span>
                          <button 
                            onClick={() => handleCopyCode(promo.code)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                          >
                            <Copy className="w-4 h-4" /> Sao chép
                          </button>
                        </div>
                      </div>
                      
                      {/* Right dashed edge effect */}
                      <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-4 bg-[radial-gradient(circle,theme(colors.slate.950)_4px,transparent_4px)] bg-[length:16px_16px] -mr-2"></div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Tag className="w-20 h-20 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Ví khuyến mãi trống</h3>
                  <p className="text-slate-500 mb-6">
                    Hiện tại chưa có mã khuyến mãi nào khả dụng. Hãy quay lại sau nhé!
                  </p>
                </motion.div>
              )}
            </div>
          )}
`;

content = content.replace(
  '            </motion.div>\n          )}\n\n        </div>\n      </div>\n\n      {/* Review Modal */}',
  '            </motion.div>\n          )}\n' + promoTabContent + '\n\n        </div>\n      </div>\n\n      {/* Review Modal */}'
);

fs.writeFileSync(path, content);
console.log('Done replacing!');
