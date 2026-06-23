import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Ticket, Star, Clock, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types/Movie';

interface BannerProps {
  movies: Movie[];
}

export default function Banner({ movies }: BannerProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const validMovies = movies.filter(m => m && m.banner);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    const nextIdx = (current + 1) % validMovies.length;
    goTo(nextIdx, 1);
  }, [current, validMovies.length, goTo]);

  const prev = useCallback(() => {
    const prevIdx = (current - 1 + validMovies.length) % validMovies.length;
    goTo(prevIdx, -1);
  }, [current, validMovies.length, goTo]);

  // Auto-slide mỗi 5 giây
  useEffect(() => {
    if (validMovies.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, validMovies.length]);

  if (!validMovies.length) return null;

  const movie = validMovies[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <section className="relative h-[520px] overflow-hidden bg-black select-none">
      {/* Background image with slide animation */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={movie.id + '-bg'}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={movie.banner}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = movie.poster || '';
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
        <div className="max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={movie.id + '-content'}
              custom={direction}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide">
                  🔥 Phim Hot
                </span>
                {movie.ageRating && (
                  <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
                    {movie.ageRating}
                  </span>
                )}
                <span className="bg-yellow-400/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />{movie.rating}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight drop-shadow-lg">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />{movie.duration} phút
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{movie.genre}</span>
                {movie.language && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span>{movie.language}</span>
                  </>
                )}
              </div>

              <p className="text-white/75 text-sm leading-relaxed mb-7 max-w-md line-clamp-3">
                {movie.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/movies/${movie.id}`}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-[0_8px_30px_rgba(234,88,12,0.5)] transition-all hover:scale-105"
                >
                  <Ticket className="w-5 h-5" />
                  Đặt Vé Ngay
                </Link>
                <Link
                  to={`/movies/${movie.id}`}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/25 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Xem Trailer
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnail sidebar (right) */}
      {validMovies.length > 1 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          {validMovies.map((m, i) => (
            <button
              key={m.id}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                i === current
                  ? 'w-16 h-16 ring-2 ring-orange-400 ring-offset-1 ring-offset-black scale-110'
                  : 'w-14 h-14 opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={m.poster || m.banner}
                alt={m.title}
                className="w-full h-full object-cover"
              />
              {i === current && (
                <div className="absolute inset-0 bg-orange-500/20" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Prev / Next arrows */}
      {validMovies.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur rounded-full flex items-center justify-center text-white transition-all border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-28 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur rounded-full flex items-center justify-center text-white transition-all border border-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {validMovies.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {validMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-6 h-2 bg-orange-400'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <motion.div
          key={current}
          className="h-full bg-gradient-to-r from-red-500 to-orange-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
        />
      </div>
    </section>
  );
}
