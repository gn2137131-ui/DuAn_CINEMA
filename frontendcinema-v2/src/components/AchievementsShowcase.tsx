import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Heart, Crown, Lock, Zap, ShieldAlert, Ghost, Trophy } from 'lucide-react';

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
  isUnlocked: boolean;
  progress: number; // 0 to 100
};

export default function AchievementsShowcase({ profile, bookings = [] }: { profile?: any; bookings?: any[] }) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  // Tính toán huy hiệu dựa trên dữ liệu thật
  const badges = useMemo(() => {
    let actionCount = 0;
    let romanceCount = 0;
    let nightCount = 0;
    
    // Đếm số liệu từ bookings
    bookings.forEach((b: any) => {
      const firstTicket = b.tickets?.[0];
      const showtime = firstTicket?.showtimeSeat?.showtime;
      const movie = showtime?.movie;
      
      if (movie && movie.genre) {
        const genreStr = movie.genre.toLowerCase();
        if (genreStr.includes('hành động') || genreStr.includes('bom tấn') || genreStr.includes('viễn tưởng')) {
          actionCount++;
        }
        if (genreStr.includes('tình cảm') || genreStr.includes('lãng mạn')) {
          romanceCount++;
        }
      }

      const timeStr = showtime.start_time || showtime.startTime;
      if (showtime && timeStr) {
        const time = timeStr;
        let hour = 0;
        if (Array.isArray(time)) {
          hour = time[0];
        } else if (typeof time === 'string') {
          hour = parseInt(time.split(':')[0]);
        }
        if (hour >= 22 || hour <= 3) {
          nightCount++;
        }
      }
    });

    const totalMovies = bookings.length;
    const currentPoints = profile?.points || 0;
    const memLevel = profile?.membershipLevel || 'Member';

    const badgesArray = [
      {
        id: 'b1',
        title: 'Chiến Thần Cháy Nổ',
        description: 'Xem 5 bộ phim thuộc thể loại Hành Động / Bom Tấn.',
        icon: <Flame className="w-8 h-8" />,
        colorClass: 'from-orange-500 to-red-600',
        glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
        isUnlocked: actionCount >= 5,
        progress: Math.min(100, Math.round((actionCount / 5) * 100))
      },
      {
        id: 'b2',
        title: 'Thánh Ngôn Tình',
        description: 'Rơi nước mắt cùng 3 bộ phim Lãng mạn / Tình cảm.',
        icon: <Heart className="w-8 h-8" />,
        colorClass: 'from-pink-500 to-rose-600',
        glowClass: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
        isUnlocked: romanceCount >= 3,
        progress: Math.min(100, Math.round((romanceCount / 3) * 100))
      },
      {
        id: 'b3',
        title: 'Cú Đêm',
        description: 'Xem 5 suất chiếu đêm (từ 22:00 trở đi).',
        icon: <Ghost className="w-8 h-8" />,
        colorClass: 'from-emerald-500 to-teal-600',
        glowClass: 'shadow-[0_0_20px_rgba(20,184,166,0.5)]',
        isUnlocked: nightCount >= 5,
        progress: Math.min(100, Math.round((nightCount / 5) * 100))
      },
      {
        id: 'b4',
        title: 'Trùm Rạp Chiếu',
        description: 'Tích lũy xem tổng cộng 20 bộ phim tại CineVerse.',
        icon: <Crown className="w-8 h-8" />,
        colorClass: 'from-indigo-500 to-purple-600',
        glowClass: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
        isUnlocked: totalMovies >= 20,
        progress: Math.min(100, Math.round((totalMovies / 20) * 100))
      },
      {
        id: 'b5',
        title: 'Khách Hàng VIP',
        description: 'Đạt hạng thành viên Platinum hoặc Diamond.',
        icon: <ShieldAlert className="w-8 h-8" />,
        colorClass: 'from-blue-500 to-cyan-600',
        glowClass: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        isUnlocked: memLevel === 'Platinum' || memLevel === 'Diamond',
        progress: (memLevel === 'Platinum' || memLevel === 'Diamond') ? 100 : (memLevel === 'Gold' ? 66 : 33)
      },
      {
        id: 'b6',
        title: 'Đại Gia Tích Điểm',
        description: 'Tích lũy được trên 1000 điểm CinePoint.',
        icon: <Award className="w-8 h-8" />,
        colorClass: 'from-yellow-400 to-amber-500',
        glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
        isUnlocked: currentPoints >= 1000,
        progress: Math.min(100, Math.round((currentPoints / 1000) * 100))
      }
    ];
    return badgesArray as Badge[];
  }, [bookings, profile]);

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalCount = badges.length;

  return (
    <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-yellow-300/10 to-orange-500/10 dark:from-yellow-400/5 dark:to-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Thành Tựu CineVerse</h2>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Đã thu thập: <span className="text-orange-500 font-bold">{unlockedCount}/{totalCount}</span> huy hiệu
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
        {badges.map((badge, index) => {
          const isUnlocked = badge.isUnlocked;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredBadge(badge.id)}
              onMouseLeave={() => setHoveredBadge(null)}
              className="relative group cursor-pointer"
            >
              <div className="flex flex-col items-center">
                {/* Badge Icon Container */}
                <div 
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 
                    ${isUnlocked 
                      ? `bg-gradient-to-br ${badge.colorClass} ${badge.glowClass} group-hover:scale-110 group-hover:-translate-y-2` 
                      : 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-60 grayscale group-hover:opacity-100'
                    }`}
                >
                  {/* Decorative outer ring if unlocked */}
                  {isUnlocked && (
                    <div className="absolute inset-0 border-[3px] border-white/20 rounded-full mix-blend-overlay"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`transition-transform duration-300 ${isUnlocked ? 'text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                    {isUnlocked ? badge.icon : <Lock className="w-8 h-8" />}
                  </div>

                  {/* Sparkles effect on hover (Unlocked only) */}
                  {isUnlocked && (
                    <div className="absolute -inset-2 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 rounded-full opacity-0 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700 pointer-events-none blur-sm"></div>
                  )}
                </div>

                {/* Badge Title */}
                <h3 className={`text-sm font-bold text-center line-clamp-2 px-1 ${isUnlocked ? 'text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors' : 'text-gray-400 dark:text-gray-600'}`}>
                  {badge.title}
                </h3>
              </div>

              {/* Tooltip (Hover effect) */}
              <AnimatePresence>
                {hoveredBadge === badge.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-gray-900 dark:bg-black text-white p-4 rounded-2xl shadow-xl z-50 pointer-events-none"
                  >
                    <h4 className="font-bold text-sm text-orange-400 mb-1">{badge.title}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed mb-3">{badge.description}</p>
                    
                    {/* Progress Bar inside tooltip */}
                    {!isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                          <span>Tiến độ</span>
                          <span>{badge.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${badge.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Arrow down */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 dark:bg-black rotate-45"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
