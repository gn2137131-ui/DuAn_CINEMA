import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, X, Star } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: string;
  pointsEarned: number;
}

export default function LevelUpModal({ isOpen, onClose, newLevel, pointsEarned }: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Bắn pháo hoa (Confetti) 2 bên liên tục trong 3 giây
      const end = Date.now() + 3 * 1000;
      const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const levelColors: Record<string, string> = {
    'Silver': 'from-gray-300 via-gray-100 to-gray-400 text-gray-800 border-gray-400',
    'Gold': 'from-yellow-400 via-yellow-200 to-yellow-600 text-yellow-900 border-yellow-500',
    'Platinum': 'from-indigo-500 via-purple-400 to-pink-500 text-white border-purple-300'
  };

  const currentTheme = levelColors[newLevel] || levelColors['Gold'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop (Dark) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
          className="relative w-full max-w-sm rounded-3xl p-[2px] bg-gradient-to-br from-yellow-300 via-red-500 to-purple-600 shadow-[0_0_50px_rgba(239,68,68,0.5)]"
        >
          {/* Inner Content */}
          <div className="bg-gray-900 rounded-[22px] p-8 text-center relative overflow-hidden flex flex-col items-center">
            
            {/* Rays background effect */}
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.1)_350deg,transparent_360deg)] pointer-events-none"
            />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div 
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5, duration: 1.5 }}
              className={`w-32 h-32 rounded-full mb-6 flex items-center justify-center shadow-2xl relative bg-gradient-to-br ${currentTheme} border-[6px]`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
              <Trophy className="w-16 h-16 relative z-10 drop-shadow-lg" />
              
              {/* Floating stars around the trophy */}
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-2 -right-2 text-yellow-300">
                <Star className="w-6 h-6 fill-current" />
              </motion.div>
              <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute top-8 -left-4 text-white/80">
                <Star className="w-5 h-5 fill-current" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-10"
            >
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Thăng Hạng Thành Công</h2>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                Chúc mừng <br/> <span className={`bg-clip-text text-transparent bg-gradient-to-r ${currentTheme}`}>{newLevel} Member</span>
              </h1>
              <p className="text-gray-300 text-sm mb-6">
                Tuyệt vời! Bạn vừa nhận được <strong className="text-yellow-400">+{pointsEarned} CineCoins</strong> và chính thức bước sang đẳng cấp mới. Tận hưởng đặc quyền ngay!
              </p>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
              >
                Nhận Đặc Quyền Này!
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
