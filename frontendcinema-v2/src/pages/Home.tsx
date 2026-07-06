import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import { Popcorn, Ticket, Gift, Search, Filter, X, Star, TrendingUp, Clock, Monitor } from 'lucide-react';
import { Movie } from '../types/Movie';
import { Link } from 'react-router-dom';
const BACKEND_IMAGE_URL = import.meta.env.VITE_BACKEND_URL || '';
import Banner from '../components/Banner';
import axiosClient from '../api/axiosClient';
export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedAgeRating, setSelectedAgeRating] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAllNowShowing, setShowAllNowShowing] = useState(false);

  const [bannerMovies, setBannerMovies] = useState<Movie[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [todayShowtimes, setTodayShowtimes] = useState<any[]>([]);

  useEffect(() => {
    const fetchTodayShowtimes = async () => {
      try {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const data = await axiosClient.get(`/showtimes/daily?date=${today}`);
        setTodayShowtimes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch today showtimes:', err);
      }
    };
    fetchTodayShowtimes();
  }, []);

  const showtimesByMovie = Object.values(todayShowtimes.reduce((acc: any, st: any) => {
    const movieId = st.movie.id;
    if (!acc[movieId]) {
      acc[movieId] = {
        movie: st.movie,
        showtimes: []
      };
    }
    acc[movieId].showtimes.push(st);
    return acc;
  }, {}));

  // Fetch movies with proper poster URLs, banner, and status
  useEffect(() => {
    axiosClient.get('/movies')
      .then((data: any[]) => {
        const formatted = data.map((m: any) => {
          const rawPoster = m.posterUrl || m.poster_url || m.poster || '';
          const poster = rawPoster && !rawPoster.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawPoster}` : rawPoster;
          const releaseStr = m.release_date || m.releaseDate || '';
          const releaseDate = new Date(releaseStr);
          const now = new Date();
          const status = releaseDate > now ? 'comingSoon' : 'nowShowing';
          const ageRating = m.ageRestriction || m.age_restriction || m.ageRating || 'P';
          const rawBanner = m.bannerUrl || m.banner_url || m.banner || '';
          const banner = rawBanner && !rawBanner.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawBanner}` : rawBanner;
          return { ...m, poster, banner, status, ageRating } as Movie;
        });
        setMovies(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch movies:', err);
        setLoading(false);
      });
  }, []);

  // Fetch banner config từ backend (do admin cấu hình)
  useEffect(() => {
    axiosClient.get('/banner-config')
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const formatted = data.map((m: any) => {
            const rawPoster = m.posterUrl || m.poster_url || m.poster || '';
            const poster = rawPoster && !rawPoster.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawPoster}` : rawPoster;
            const ageRating = m.ageRestriction || m.age_restriction || m.ageRating || 'P';
            const rawBanner = m.bannerUrl || m.banner_url || m.banner || '';
            const banner = rawBanner && !rawBanner.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawBanner}` : rawBanner;
            return { ...m, poster, banner, ageRating, status: 'nowShowing' } as Movie;
          });
          setBannerMovies(formatted);
        }
      })
      .catch(() => { /* fallback về top rating */ });
  }, []);

  // Fetch promotions from backend
  useEffect(() => {
    axiosClient.get('/discount-codes/public')
      .then((data: any) => {
        if (Array.isArray(data)) {
          setPromotions(data);
        }
      })
      .catch(err => console.error('Failed to fetch promotions', err));
  }, []);

  // Dùng banner từ API (admin cấu hình). Fallback: top 4 phim rating cao nhất
  const featuredMovies = bannerMovies.length > 0
    ? bannerMovies
    : [...movies]
      .sort((a, b) => parseFloat(String(b.rating)) - parseFloat(String(a.rating)))
      .slice(0, 4);

  const isEmpty = !loading && movies.length === 0;

  // Phim sắp chiếu: release_date > hôm nay, sắp xếp theo ngày gần nhất
  const comingSoonMovies = movies
    .filter(m => {
      const d = (m as any).release_date || m.releaseDate || '';
      return d && new Date(d) > new Date();
    })
    .sort((a, b) => {
      const da = new Date((a as any).release_date || a.releaseDate || '').getTime();
      const db = new Date((b as any).release_date || b.releaseDate || '').getTime();
      return da - db;
    })
    .slice(0, 6);

  const daysUntil = (dateStr: string) =>
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);


  // Extract unique genres and age ratings
  const genres = ['all', ...Array.from(new Set(movies.flatMap(m => m.genre.split(', '))))];
  const ageRatings = ['all', ...Array.from(new Set(movies.map(m => m.ageRating)))];

  // Filter movies based on search, genre and age rating, and ONLY "nowShowing"
  const filteredMovies = movies.filter(movie => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgeRestriction = selectedAgeRating === 'all' || movie.ageRating === selectedAgeRating;
    const isNowShowing = movie.status === 'nowShowing';
    return matchesSearch && matchesAgeRestriction && isNowShowing;

  });

  const displayedMovies = showAllNowShowing ? filteredMovies : filteredMovies.slice(0, 5);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedAgeRating('all');
  };

  const trendingMovies = [...movies]
    .filter(m => m.status === 'nowShowing')
    .sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)))
    .slice(0, 5);

  // Loading state will be shown inside the Movies Section

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-[#0a0a0a] dark:to-[#111111]">
      <Header />
      {/* Hero Banner */}
      {featuredMovies.length > 0 && <Banner movies={featuredMovies} />}


      {/* Hôm nay có suất chiếu phim gì */}
      {showtimesByMovie.length > 0 && (
        <section className="py-12 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Suất Chiếu Hôm Nay
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {showtimesByMovie.map((item: any) => {
                const rawPoster = item.movie.posterUrl || item.movie.poster_url || item.movie.poster || '';
                const poster = rawPoster && !rawPoster.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawPoster}` : rawPoster;

                return (
                  <div key={item.movie.id} className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-2xl flex flex-col md:flex-row gap-6 border border-gray-100 dark:border-gray-800 hover:border-red-500/50 transition-colors">
                    {/* Movie Info */}
                    <Link to={`/movies/${item.movie.id}`} className="flex gap-4 md:w-1/3 flex-shrink-0 group">
                      <div className="w-24 h-36 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <ImageWithFallback src={poster} alt={item.movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex flex-col py-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-500 transition-colors">{item.movie.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md font-semibold">{item.movie.genre || 'Hành động'}</span>
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-md font-bold border border-red-200 dark:border-red-800/50">
                            {item.movie.ageRestriction || item.movie.age_restriction || item.movie.ageRating || 'P'}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Showtimes */}
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> 2D Phụ Đề Việt
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {item.showtimes.map((st: any) => {
                          const time = (st.start_time || st.startTime || '').substring(0, 5);
                          return (
                            <Link
                              key={st.id}
                              to={`/seats/${item.movie.id}/${st.id}`}
                              className="bg-white dark:bg-[#222222] border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2.5 rounded-xl transition-all group/time"
                            >
                              <div className="font-bold text-lg text-gray-900 dark:text-white group-hover/time:text-red-600 dark:group-hover/time:text-red-400 flex items-center justify-center">
                                {time}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center uppercase font-medium mt-0.5">
                                {st.room.name}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-12 bg-white dark:bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2 dark:text-gray-100">Đặt Vé Nhanh</h3>
              <p className="text-gray-600 dark:text-gray-400">Đặt vé online chỉ trong vài giây</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Popcorn className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2 dark:text-gray-100">Bỏng Ngô Miễn Phí</h3>
              <p className="text-gray-600 dark:text-gray-400">Nhận combo bỏng nước miễn phí</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2 dark:text-gray-100">Ưu Đãi Hấp Dẫn</h3>
              <p className="text-gray-600 dark:text-gray-400">Nhiều khuyến mãi đặc biệt</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Movies Section */}
      <section id="movies" className="py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Phim Đang Chiếu</h2>
                <p className="text-gray-600 dark:text-gray-400">Khám phá những bộ phim hot nhất hiện nay</p>
              </div>

              {/* Search and Filter Toggle */}
              <div className="flex gap-3">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phim..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Movies Grid */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-2xl font-bold text-red-600">Loading movies...</div>
              </div>
            ) : filteredMovies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {displayedMovies.map((movie, index) => (
                    <motion.div key={movie.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <MovieCard movie={movie} />
                    </motion.div>
                  ))}
                </div>

                {filteredMovies.length > 5 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={() => setShowAllNowShowing(!showAllNowShowing)}
                      className="px-8 py-3 bg-white border-2 border-red-500 text-red-600 font-bold rounded-full hover:bg-red-50 hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      {showAllNowShowing ? 'Thu gọn' : 'Xem thêm phim đang chiếu'}
                      <svg
                        className={`w-5 h-5 transition-transform ${showAllNowShowing ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy phim</h3>
                <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button onClick={clearFilters} className="text-red-600 font-semibold hover:text-red-700">Xóa bộ lọc</button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Ưu Đãi & Khuyến Mãi */}
      {promotions.length > 0 && (
        <section id="promotions" className="py-16 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent inline-block">
                Ưu Đãi Đặc Quyền
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Sưu tầm ngay các mã giảm giá để có trải nghiệm xem phim tuyệt vời với mức giá hời nhất!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {promotions.map((promo, index) => {
                const colorClasses = ["from-purple-500 to-indigo-600", "from-orange-500 to-red-600", "from-green-500 to-emerald-600", "from-blue-500 to-cyan-600"];
                const color = colorClasses[index % colorClasses.length];
                return (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex items-stretch group"
                  >
                    {/* Răng cưa bên trái (hiệu ứng vé) */}
                    <div className={`w-24 bg-gradient-to-b ${color} flex flex-col items-center justify-center relative p-4 shrink-0`}>
                      {/* Cắt nửa vòng tròn ở rìa để làm viền răng cưa */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-50 dark:bg-gray-800 rounded-full"></div>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full z-10 border-l border-gray-100 dark:border-gray-700 border-opacity-0 hidden md:block"></div>

                      <span className="text-white font-black text-2xl -rotate-90 whitespace-nowrap opacity-90 tracking-widest mt-4">VOUCHER</span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {promo.type === 'PERCENTAGE' ? `GIẢM ${promo.value}%` : `GIẢM ${Number(promo.value).toLocaleString('vi-VN')}Đ`}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                          {promo.description || 'Mã giảm giá cực sốc từ CineVerse.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-dashed rounded font-mono text-lg font-bold text-gray-700 dark:text-gray-300 px-4 py-2 select-all">
                          {promo.code}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(promo.code);
                            toast.success(`Đã copy mã: ${promo.code}`);
                          }}
                          className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg transition-colors"
                        >
                          Copy mã
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sắp Chiếu */}
      {comingSoonMovies.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                  <span className="w-1 h-10 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full inline-block" />
                  Sắp Chiếu
                </h2>
                <p className="text-gray-400 mt-1 ml-4">Những bộ phim đang được mong chờ nhất</p>
              </div>
              <a href="/movies" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors group">
                Xem tất cả
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonMovies.map((movie, index) => {
                const releaseDateStr = (movie as any).release_date || movie.releaseDate || '';
                const days = releaseDateStr ? daysUntil(releaseDateStr) : 0;
                const releaseFormatted = releaseDateStr
                  ? new Date(releaseDateStr).toLocaleDateString('vi-VN')
                  : 'Sắp ra mắt';

                return (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col"
                  >
                    {/* Poster / Banner */}
                    <div className="relative aspect-video overflow-hidden bg-gray-800">
                      <img
                        src={movie.banner || movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = movie.poster || ''; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          SẮP CHIẾU
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-white font-bold text-lg leading-snug mb-2 group-hover:text-blue-300 transition-colors line-clamp-1">
                        {movie.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
                        {movie.description}
                      </p>

                      {/* Release date + countdown */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{releaseFormatted}</span>
                        </div>
                        {days > 0 && (
                          <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
                            ⏱ {days} ngày nữa
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <a
                        href={`/movies/${movie.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-white/10 hover:border-gray-500 hover:text-white transition-all text-sm font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Xem Trailer &amp; Đặt Trước
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Công Nghệ Rạp / Trải Nghiệm */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight uppercase">
              Trải Nghiệm Điện Ảnh Đỉnh Cao
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Khám phá các định dạng phòng chiếu đẳng cấp thế giới chỉ có tại CineVerse.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              {
                id: '2d',
                title: '2D STANDARD',
                desc: 'Trải nghiệm rạp tiêu chuẩn sắc nét, âm thanh vòm sống động chân thực cho mọi bộ phim.',
                image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=800&auto=format&fit=crop'
              },
              {
                id: '3d',
                title: '3D CINEMA',
                desc: 'Hòa mình vào thế giới ảo diệu với chiều sâu không gian chân thực đến kinh ngạc qua kính 3D.',
                image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop'
              },
              {
                id: 'imax',
                title: 'IMAX',
                desc: 'Màn hình cong cực đại, âm thanh vang dội. Chuẩn mực điện ảnh toàn cầu mang đến trải nghiệm nhập vai tuyệt đối.',
                image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop'
              },
              {
                id: '4dx',
                title: '4DX',
                desc: 'Đánh thức mọi giác quan với hiệu ứng chuyển động ghế, gió, sương mù và mùi hương đồng bộ với phim.',
                image: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=800&auto=format&fit=crop'
              }
            ].map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="group relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Overlays */}
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h3 className="text-4xl md:text-5xl font-black italic tracking-wider mb-3 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    {exp.title}
                  </h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    {exp.desc}
                  </p>

                  {/* Explore Button */}
                  <div className="mt-6 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                    <span className="inline-flex items-center gap-2 text-red-500 font-bold text-sm tracking-widest uppercase">
                      Khám phá ngay
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bảng Xếp Hạng Trending Style Netflix */}
      {trendingMovies.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-1 h-10 bg-gradient-to-b from-red-600 to-orange-500 rounded-full inline-block" />
              Top Phim Ăn Khách Nhất
            </h2>

            <div className="flex gap-6 md:gap-14 overflow-x-auto pb-10 pt-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {trendingMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex-shrink-0 flex items-end h-[300px] w-[260px] snap-center group cursor-pointer"
                  onClick={() => window.location.href = `/movies/${movie.id}`}
                >
                  {/* Huge Number */}
                  <span
                    className="absolute -left-2 md:-left-6 -bottom-8 text-[180px] md:text-[200px] font-black leading-none z-0 text-white dark:text-gray-900 drop-shadow-2xl select-none transition-all group-hover:scale-105"
                    style={{ WebkitTextStroke: '4px #dc2626', textShadow: '4px 4px 10px rgba(0,0,0,0.1)' }}
                  >
                    {index + 1}
                  </span>

                  {/* Poster */}
                  <div className="relative z-10 w-[160px] md:w-[180px] h-[240px] md:h-[270px] ml-auto rounded-xl overflow-hidden shadow-2xl group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-300 border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = movie.poster || ''; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        {movie.rating} / 10
                      </div>
                      <span className="text-white font-bold text-xs bg-red-600 px-3 py-1.5 rounded uppercase tracking-wider block text-center w-full">Đặt vé</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
