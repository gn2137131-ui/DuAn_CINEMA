import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import { toast } from 'sonner';

export default function LuckyWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{label: string, code?: string} | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);

  const INITIAL_SEGMENTS = [
    { label: 'Voucher 10%', color: '#ef4444' },
    { label: 'Bắp Ngọt M', color: '#f97316' },
    { label: 'Vé 2D Free', color: '#eab308' },
    { label: 'Chúc May Mắn', color: '#3b82f6' },
    { label: 'Nước Ngọt M', color: '#8b5cf6' },
    { label: 'Voucher 20K', color: '#10b981' }
  ];

  const [segments, setSegments] = useState<{label: string, color: string, code?: string}[]>(INITIAL_SEGMENTS);

  useEffect(() => {
    const lastSpin = localStorage.getItem('lastSpinDate');
    const today = new Date().toDateString();
    if (lastSpin === today) {
      setHasSpunToday(true);
    }

    fetch('https://duancinema-production.up.railway.app/api/discount-codes/public')
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const colors = ['#ef4444', '#10b981', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'];
          const fallbackPrizes = ['Bắp Ngọt M', 'Chúc May Mắn', 'Nước Ngọt M', 'Chúc May Mắn', 'Vé 2D Free', 'Chúc May Mắn'];
          
          let newSegments = [];
          
          const maxVouchers = Math.min(data.length, 3);
          for (let i = 0; i < maxVouchers; i++) {
            const promo = data[i];
            const label = promo.type === 'PERCENTAGE' ? `Giảm ${promo.value}%` : `Giảm ${promo.value / 1000}K`;
            newSegments.push({ label: `Voucher ${label}`, color: colors[i], code: promo.code });
          }

          while (newSegments.length < 6) {
            newSegments.push({ 
              label: fallbackPrizes[newSegments.length], 
              color: colors[newSegments.length] 
            });
          }

          setSegments(newSegments);
        }
      })
      .catch(err => console.error('Failed to fetch lucky wheel prizes:', err));
  }, []);

  const spinWheel = () => {
    if (isSpinning || hasSpunToday) {
      if (hasSpunToday) toast('Bạn đã hết lượt quay hôm nay. Ngày mai hãy quay lại nhé!', { icon: '⏰' });
      return;
    }
    setIsSpinning(true);
    setPrize(null);

    const winningIndex = Math.floor(Math.random() * segments.length);
    const baseSpins = 1800;
    const newRotation = rotation + baseSpins + (360 - (rotation % 360)) + (360 - (winningIndex * 60 + 30));

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setPrize(segments[winningIndex]);
      const today = new Date().toDateString();
      localStorage.setItem('lastSpinDate', today);
      setHasSpunToday(true);

      if (segments[winningIndex].label === 'Chúc May Mắn') {
        toast('Rất tiếc! Chúc bạn may mắn lần sau 😢', { icon: '🍀' });
      } else {
        toast.success(`Chúc mừng! Bạn nhận được: ${segments[winningIndex].label} 🎉`);
      }
    }, 5000);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-3 rounded-full shadow-[0_5px_15px_rgba(234,179,8,0.5)] font-bold flex items-center gap-2 border-2 border-yellow-200"
      >
        <Gift className="animate-pulse" />
        Vòng Quay May Mắn
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 max-w-lg w-full relative shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden"
            >
              {prize && prize.label !== 'Chúc May Mắn' && (
                <div className="absolute inset-0 pointer-events-none opacity-50 bg-[url('https://cdn.pixabay.com/photo/2021/09/12/07/58/confetti-6617565_960_720.png')] bg-cover animate-pulse mix-blend-screen"></div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors z-10"
              >
                <X />
              </button>

              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text text-transparent uppercase tracking-wider mb-2">
                  Vòng Quay May Mắn
                </h2>
                <p className="text-gray-500 dark:text-gray-400">Quay mỗi ngày - Nhận quà liền tay!</p>
              </div>

              <div className="relative flex justify-center items-center w-64 h-64 md:w-80 md:h-80 mx-auto mb-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
                  <div className="w-8 h-12 bg-red-600 shadow-md" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                </div>

                <div className="absolute inset-[-10px] rounded-full bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center justify-center">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_5px_white]"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-150px) md:translateY(-190px)`,
                        transformOrigin: 'center'
                      }}
                    ></div>
                  ))}
                </div>

                <div 
                  className="w-full h-full rounded-full border-[6px] border-white relative overflow-hidden transition-transform ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{ 
                    background: `conic-gradient(${segments.map((seg, i) => `${seg.color} ${i * (360/segments.length)}deg ${(i + 1) * (360/segments.length)}deg`).join(', ')})`,
                    transform: `rotate(${rotation}deg)`,
                    transitionDuration: '5s'
                  }}
                >
                  {segments.map((seg, i) => {
                    const angle = i * (360 / segments.length) + (360 / segments.length) / 2;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 origin-left text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        style={{
                          transform: `translateY(-50%) rotate(${angle - 90}deg)`,
                          width: '50%',
                          textAlign: 'right',
                          paddingRight: '15px',
                          fontSize: '14px',
                          whiteSpace: 'nowrap',
                          textShadow: '0 0 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {seg.label}
                      </div>
                    );
                  })}
                </div>
                
                <div className="absolute w-12 h-12 bg-white rounded-full border-4 border-yellow-500 shadow-lg z-10 flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                </div>
              </div>

              <div className="text-center relative z-10">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95 uppercase tracking-wider"
                >
                  {isSpinning ? 'Đang quay...' : 'Quay Ngay'}
                </button>
                
                {prize && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-xl font-bold text-lg ${prize.label === 'Chúc May Mắn' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'}`}
                  >
                    {prize.label === 'Chúc May Mắn' ? 'Thật tiếc, hãy thử lại vào ngày mai nhé!' : `Quà của bạn: ${prize.label}`}
                    {prize.code && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="bg-white px-3 py-1.5 rounded-lg border border-green-300 text-green-800 font-mono text-base">{prize.code}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(prize.code!);
                            toast.success('Đã sao chép mã giảm giá!');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          Sao chép
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
