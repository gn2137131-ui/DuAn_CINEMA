import { JSX, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, CreditCard, Smartphone, Banknote, ShieldCheck } from 'lucide-react';

interface PaymentMethodsProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
  amount: number;
}

export const PAYMENT_LABELS: Record<string, string> = {
  'saved_card': 'Thẻ Thanh Toán Đã Liên Kết',
  'international_card': 'Thẻ Quốc Tế (Visa/MC/JCB)',
  'domestic_card': 'Thẻ ATM Nội Địa',
  'momo_qr': 'MoMo - Quét QR',
  'momo_phone': 'MoMo - Số điện thoại',
  'zalopay': 'ZaloPay',
  'vnpay': 'VNPay QR',
  'google_pay': 'Google Pay / Apple Pay',
  'bank_transfer': 'Chuyển Khoản Ngân Hàng',
  'counter': 'Thanh Toán Tại Quầy',
  'installment': 'Trả Góp 0%'
};

export default function PaymentMethods({ selectedMethod, onSelect, amount }: PaymentMethodsProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('saved_card');

  const groups: Array<{
    id: string;
    title: string;
    icon: JSX.Element;
    count: number;
    methods: Array<{
      id: string;
      name: string;
      desc: string;
      badge?: string;
      badgeColor?: string;
      icon: JSX.Element;
      hasForm?: boolean;
    }>;
  }> = [
      {
        id: 'saved_card',
        title: 'Thẻ / Ví đã liên kết',
        icon: <ShieldCheck className="w-5 h-5" />,
        count: 1,
        methods: [
          {
            id: 'saved_card',
            name: 'Thanh toán bằng Thẻ Đã Lưu',
            desc: 'Thanh toán 1 chạm Tokenization',
            badge: 'An toàn PCI-DSS',
            badgeColor: 'bg-indigo-100 text-indigo-600',
            icon: <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600"><ShieldCheck className="w-5 h-5" /></div>
          }
        ]
      },
      {
        id: 'card',
        title: 'Thẻ Ngân Hàng',
        icon: <CreditCard className="w-5 h-5" />,
        count: 2,
        methods: [
          {
            id: 'international_card',
            name: 'Thẻ Quốc Tế',
            desc: 'Visa, Mastercard, JCB, Amex',
            badge: 'Phổ biến',
            badgeColor: 'bg-blue-100 text-blue-600',
            icon: <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600"><CreditCard className="w-5 h-5" /></div>,
            hasForm: true
          },
          {
            id: 'domestic_card',
            name: 'Thẻ ATM Nội Địa',
            desc: 'Tất cả ngân hàng Việt Nam',
            icon: <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600"><CreditCard className="w-5 h-5" /></div>
          }
        ]
      },
      {
        id: 'ewallet',
        title: 'Ví Điện Tử',
        icon: <Smartphone className="w-5 h-5" />,
        count: 4,
        methods: [
          {
            id: 'momo_qr',
            name: 'MoMo — Quét QR',
            desc: 'Không cần đăng nhập, quét QR là xong',
            badge: 'Không cần liên kết',
            badgeColor: 'bg-pink-100 text-pink-600',
            icon: <div className="w-8 h-8 rounded bg-pink-50 flex items-center justify-center text-pink-600"><Smartphone className="w-5 h-5" /></div>
          },
          {
            id: 'momo_phone',
            name: 'MoMo — Nhập số điện thoại',
            desc: 'Nhận OTP xác nhận thanh toán',
            icon: <div className="w-8 h-8 rounded bg-pink-50 flex items-center justify-center text-pink-600"><Smartphone className="w-5 h-5" /></div>
          },
          {
            id: 'zalopay',
            name: 'ZaloPay',
            desc: 'Quét QR hoặc mở app ZaloPay',
            badge: 'Giảm 15%',
            badgeColor: 'bg-blue-100 text-blue-600',
            icon: <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600"><Smartphone className="w-5 h-5" /></div>
          },
          {
            id: 'vnpay',
            name: 'VNPay QR',
            desc: 'Quét bằng app ngân hàng bất kỳ',
            badge: 'Không cần liên kết',
            badgeColor: 'bg-red-100 text-red-600',
            icon: <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600"><Smartphone className="w-5 h-5" /></div>
          },
          {
            id: 'google_pay',
            name: 'Google Pay / Apple Pay',
            desc: 'Thanh toán 1 chạm an toàn bảo mật',
            badge: 'Siêu tốc',
            badgeColor: 'bg-gray-800 text-white',
            icon: <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-800"><Smartphone className="w-5 h-5" /></div>
          }
        ]
      },
      {
        id: 'cash',
        title: 'Chuyển Khoản & Tiền Mặt',
        icon: <Banknote className="w-5 h-5" />,
        count: 3,
        methods: [
          {
            id: 'bank_transfer',
            name: 'Chuyển Khoản Ngân Hàng',
            desc: 'Chuyển khoản thủ công qua STK',
            icon: <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-600"><Banknote className="w-5 h-5" /></div>
          },
          {
            id: 'counter',
            name: 'Thanh Toán Tại Quầy',
            desc: 'Đến rạp xuất trình mã đặt chỗ',
            icon: <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600"><Banknote className="w-5 h-5" /></div>
          },
          {
            id: 'installment',
            name: 'Trả Góp 0%',
            desc: 'Chia 3-12 kỳ không lãi suất',
            badge: '0% lãi suất',
            badgeColor: 'bg-orange-100 text-orange-600',
            icon: <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center text-orange-600"><Banknote className="w-5 h-5" /></div>
          }
        ]
      }
    ];

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isExpanded = expandedGroup === group.id;
        return (
          <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-700">{group.icon}</div>
                <span className="font-bold text-gray-900">{group.title}</span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {group.count} phương thức
                </span>
              </div>
              {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100"
                >
                  <div className="flex flex-col divide-y divide-gray-100">
                    {group.methods.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                        <div key={method.id} className="p-4">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="mt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-red-500' : 'border-gray-300 group-hover:border-red-300'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                {method.icon}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{method.name}</span>
                                    {method.badge && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                                        {method.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{method.desc}</p>
                                </div>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={isSelected}
                              onChange={() => onSelect(method.id)}
                              className="hidden"
                            />
                          </label>

                          {/* Form nhập thẻ nếu là thẻ quốc tế */}
                          {method.hasForm && isSelected && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 ml-8 p-4 bg-green-50/50 rounded-xl border border-green-100"
                            >
                              <div className="flex items-center gap-2 text-green-700 text-sm mb-4">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Thông tin thẻ được mã hóa SSL 256-bit, không lưu trữ sau giao dịch</span>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số thẻ</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="0000 0000 0000 0000"
                                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none tracking-widest font-mono text-gray-600"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                      <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold">VISA</div>
                                      <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center text-[8px] text-white font-bold">MC</div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tên chủ thẻ</label>
                                  <input
                                    type="text"
                                    placeholder="NGUYEN VAN A"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none uppercase text-gray-600"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày hết hạn</label>
                                    <input
                                      type="text"
                                      placeholder="MM/YY"
                                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none text-gray-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">CVV / CVC</label>
                                    <input
                                      type="password"
                                      placeholder="•••"
                                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none text-gray-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="flex items-center gap-2 text-gray-500 text-xs mt-4">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Giao dịch được bảo mật bởi SSL 256-bit. CineVerse không lưu trữ thông tin thanh toán của bạn.</span>
      </div>
    </div>
  );
}
