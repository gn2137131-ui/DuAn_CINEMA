import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, MessageSquare, Send, Reply, CornerDownRight, Play, X, CheckCircle, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosClient from '../api/axiosClient';

interface Movie {
  id: number;
  title: string;
  genre: string;
  language?: string;
  posterUrl: string;
  banner?: string;
  description: string;
  rating: string;
  ageRestriction: string;
  duration: number;
  releaseDate: string;
  director?: string;
  cast?: string;
  productionCompany?: string;
  trailerUrl?: string;
}

interface Showtime {
  id: number;
  movie_id: number;
  room_id: number;
  start_time: string;
  end_time: string;
  show_date: string;
  format: string;
  base_price: number;
  status: 'ACTIVE' | 'INACTIVE';
  time: string;
  theater: string;
  price: number;
}

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

interface MovieComment {
  id: number;
  userName: string;
  content: string;
  createdAt: string;
  replies: MovieComment[];
}

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTheater, setSelectedTheater] = useState<string>('all');
  const [reviewData, setReviewData] = useState<ReviewData>({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [nowShowingMovies, setNowShowingMovies] = useState<any[]>([]);

  // Review write states
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myReviewComment, setMyReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [myExistingReview, setMyExistingReview] = useState<any>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  // Helper to convert standard youtube link to embed link
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch (e) {
      return url;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie?.title || 'CineVerse',
        text: `Cùng xem phim ${movie?.title} tại CineVerse nhé!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã copy link phim!');
    }
  };

  // Helper to convert standard youtube link to embed link
  const BACKEND_IMAGE_URL = 'https://duancinema-production.up.railway.app/uploads/';

  // Fetch movie details and showtimes
  // Trigger Vite rebuild
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch chi tiết phim
        const movieResponse = await axiosClient.get(`/movies/${id}`) as any;
        const movieData = movieResponse?.data ? movieResponse.data : movieResponse;

        if (movieData) {
          // Chuẩn hóa đường dẫn ảnh poster và banner
          if (movieData.posterUrl && !movieData.posterUrl.startsWith('http')) {
            movieData.posterUrl = `${BACKEND_IMAGE_URL}${movieData.posterUrl}`;
          }
          if (movieData.banner && !movieData.banner.startsWith('http')) {
            movieData.banner = `${BACKEND_IMAGE_URL}${movieData.banner}`;
          }
          // Normalize ageRestriction: backend dùng @JsonProperty("age_restriction")
          if (!movieData.ageRestriction && movieData.age_restriction) {
            movieData.ageRestriction = movieData.age_restriction;
          }
          // Normalize releaseDate từ snake_case
          if (!movieData.releaseDate && movieData.release_date) {
            movieData.releaseDate = movieData.release_date;
          }
          // Normalize productionCompany: backend dùng @JsonProperty("production_company")
          if (!movieData.productionCompany && movieData.production_company) {
            movieData.productionCompany = movieData.production_company;
          }
          // Normalize trailerUrl: backend có thể trả về trailer_url
          if (!movieData.trailerUrl && movieData.trailer_url) {
            movieData.trailerUrl = movieData.trailer_url;
          }
          // DEBUG: xem backend trả về những field nào
          console.log('[MovieDetail] Raw API fields:', Object.keys(movieData));
          console.log('[MovieDetail] cast:', movieData.cast, '| director:', movieData.director, '| productionCompany:', movieData.productionCompany, '| production_company:', movieData.production_company);
          setMovie(movieData);
        } else {
          throw new Error('Không tìm thấy dữ liệu bộ phim này.');
        }

        // 2. Fetch suất chiếu
        const showtimesResponse = await axiosClient.get(`/showtimes/filter?movieId=${id}&movie_id=${id}`) as any;
        const rawShowtimes = Array.isArray(showtimesResponse)
          ? showtimesResponse
          : (showtimesResponse?.data || []);

        // 3. Chuẩn hóa dữ liệu suất chiếu
        const formattedShowtimes = rawShowtimes.map((s: any) => {
          const startTime = s.startTime || s.start_time || '00:00:00';
          const showDate = s.showDate || s.show_date || '';
          const basePrice = s.basePrice || s.base_price || 0;
          const roomId = s.roomId || s.room_id || 1;
          return {
            ...s,
            show_date: showDate,
            time: startTime.substring(0, 5),
            theater: s.theater || `Phòng Chiếu ${roomId}`,
            price: basePrice,
            format: s.format || '2D'
          };
        });
        setShowtimes(formattedShowtimes);

        // 4. Fetch Reviews
        try {
          const reviewResponse = await axiosClient.get(`/reviews/movie/${id}`) as any;
          if (reviewResponse?.data) {
            setReviewData(reviewResponse.data);
          } else if (reviewResponse?.reviews) {
            setReviewData(reviewResponse);
          }
        } catch (reviewErr) {
          console.error('Lỗi khi tải đánh giá:', reviewErr);
        }

        // 5. Fetch Comments
        try {
          const commentResponse = await axiosClient.get(`/comments/movie/${id}`) as any;
          setComments(commentResponse?.data || commentResponse || []);
        } catch (commentErr) {
          console.error('Lỗi khi tải bình luận:', commentErr);
        }

        // 6. Fetch my existing review (if logged in)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const myReview = await axiosClient.get(`/reviews/movie/${id}/my-review`) as any;
            const reviewData = myReview?.data || myReview;
            if (reviewData && reviewData.id) {
              setMyExistingReview(reviewData);
              setMyRating(reviewData.rating);
              setMyReviewComment(reviewData.comment || '');
            }
          } catch (e) {
            // not logged in or no review yet
          }
        }

        // 6. Fetch Now Showing Movies for Sidebar
        try {
          const moviesRes = await axiosClient.get('/movies') as any;
          const moviesData = moviesRes?.data || moviesRes;
          const formattedMovies = moviesData.map((m: any) => ({
            id: m.id,
            title: m.title || '',
            rating: m.rating || 0,
            ageRating: m.ageRestriction || m.age_restriction || 'P',
            poster: m.posterUrl || m.poster_url || m.poster || '',
            releaseDate: m.release_date || m.releaseDate || ''
          }));
          const nowShowing = formattedMovies.filter((m: any) => new Date(m.releaseDate) <= new Date() && m.id !== Number(id));
          setNowShowingMovies(nowShowing.slice(0, 5));
        } catch (e) {
          console.error('Lỗi lấy danh sách phim đang chiếu', e);
        }
      } catch (err: any) {
        console.error('Lỗi API chi tiết:', err);
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err.message;
        setError(`[Lỗi hệ thống ${status || 'Kết nối'}]: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Thiết lập ngày mặc định dựa trên suất chiếu đầu tiên hiện có
  useEffect(() => {
    if (showtimes.length > 0) {
      setSelectedDate(showtimes[0].show_date);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [showtimes]);

  // Tạo danh sách 7 ngày tiếp theo tính từ ngày hôm nay
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  // Lọc ra danh sách phòng/rạp duy nhất không trùng lặp
  const theaters = ['all', ...Array.from(new Set(showtimes.map(s => s.theater)))];

  // Thực hiện lọc suất chiếu theo ngày và rạp được chọn
  const filteredShowtimes = showtimes.filter(showtime => {
    const matchesDate = showtime.show_date === selectedDate;
    const matchesTheater = selectedTheater === 'all' || showtime.theater === selectedTheater;
    return matchesDate && matchesTheater;
  });

  // Nhóm các suất chiếu theo định dạng (2D, 3D, IMAX)
  const showtimesByFormat = filteredShowtimes.reduce((acc, showtime) => {
    if (!acc[showtime.format]) {
      acc[showtime.format] = [];
    }
    acc[showtime.format].push(showtime);
    return acc;
  }, {} as Record<string, Showtime[]>);

  // Submit star review
  const handleSubmitReview = async () => {
    if (myRating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá!');
      return;
    }
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để đánh giá phim!');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await axiosClient.post(`/reviews/movie/${id}`, { rating: myRating, comment: myReviewComment });
      setReviewSuccess(true);
      setMyExistingReview({ rating: myRating, comment: myReviewComment });
      // Reload reviews
      const reviewResponse = await axiosClient.get(`/reviews/movie/${id}`) as any;
      if (reviewResponse?.reviews) setReviewData(reviewResponse);
      else if (reviewResponse?.data) setReviewData(reviewResponse.data);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data || 'Bạn cần đã xem phim này mới được đánh giá!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Submit main comment

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    setIsSubmittingComment(true);
    try {
      const res = await axiosClient.post(`/comments/movie/${id}`, { content: newComment }) as any;
      const addedComment = res.data || res;
      setComments([addedComment, ...comments]);
      setNewComment('');
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể đăng bình luận lúc này.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || !currentUser) return;
    setIsSubmittingComment(true);
    try {
      const res = await axiosClient.post(`/comments/${parentId}/reply`, { content: replyContent }) as any;
      const addedReply = res.data || res;

      const updateReplies = (list: MovieComment[]): MovieComment[] => {
        return list.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), addedReply] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateReplies(c.replies) };
          }
          return c;
        });
      };

      setComments(updateReplies(comments));
      setReplyingTo(null);
      setReplyContent('');
    } catch (err: any) {
      toast.error(err?.response?.data || 'Không thể đăng trả lời lúc này.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <Header />

      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-slate-700 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-800 dark:text-gray-200 font-semibold">Đang tải thông tin phim...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
          <Link to="/" className="text-red-600 hover:text-red-700 font-semibold underline">Quay lại trang chủ</Link>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && !error && !movie && (
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy bộ phim yêu cầu</h1>
          <Link to="/" className="text-red-600 font-semibold underline">Quay lại trang chủ</Link>
        </div>
      )}

      {/* Movie Detail Content */}
      {!isLoading && !error && movie && (
        <>
          {/* Hero Banner Area */}
          <section className="relative h-[400px] w-full bg-black flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-md scale-105"
              style={{ backgroundImage: `url(${movie.banner || movie.posterUrl})` }}
            ></div>
            <div
              className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur border border-white/40 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-2xl group"
              onClick={() => setShowTrailerModal(true)}
            >
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center group-hover:bg-red-50 transition-colors">
                <Play className="w-8 h-8 text-red-700 ml-1 fill-current" />
              </div>
            </div>
          </section>

          <div className="bg-white dark:bg-slate-900">
            <div className="container mx-auto px-4">
              {/* Floating Poster & Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <div className="lg:col-span-3 -mt-32 relative z-20">
                  <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-white dark:bg-slate-900">
                    <ImageWithFallback
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-9 pt-8 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">{movie.title}</h1>
                      {movie.ageRestriction && (
                        <span className="bg-orange-500 text-white font-bold px-2 py-0.5 rounded text-sm">
                          {movie.ageRestriction}
                        </span>
                      )}
                    </div>
                    <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition-colors shadow-sm">
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>{movie.duration} Phút</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-orange-500 fill-current" />
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{movie.rating}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({reviewData.totalReviews} votes)</span>
                  </div>

                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 max-w-2xl">
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-gray-500 dark:text-gray-400">Quốc gia:</span>
                      <span>Việt Nam</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-gray-500 dark:text-gray-400">Nhà sản xuất:</span>
                      <span>{movie.productionCompany || 'Đang cập nhật'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center">
                      <span className="text-gray-500 dark:text-gray-400">Thể loại:</span>
                      <div className="flex gap-2 flex-wrap">
                        {movie.genre?.split(',').map((g, idx) => (
                          <span key={idx} className="border border-gray-300 dark:border-slate-700 rounded px-3 py-1">{g.trim()}</span>
                        ))}
                      </div>
                    </div>
                    {movie.language && (
                      <div className="grid grid-cols-[100px_1fr] items-center mt-2">
                        <span className="text-gray-500 dark:text-gray-400">Ngôn ngữ:</span>
                        <div className="flex gap-2 flex-wrap">
                          {movie.language?.split(';').map((lang, idx) => (
                            <span key={idx} className="border border-gray-300 dark:border-slate-700 rounded px-3 py-1">{lang.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-[100px_1fr] items-center mt-2">
                      <span className="text-gray-500 dark:text-gray-400">Đạo diễn:</span>
                      <div className="flex gap-2 flex-wrap">
                        {movie.director?.split(',').map((d, idx) => (
                          <span key={idx} className="border border-gray-300 dark:border-slate-700 rounded px-3 py-1">{d.trim()}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center">
                      <span className="text-gray-500 dark:text-gray-400">Diễn viên:</span>
                      <div className="flex flex-wrap gap-2">
                        {movie.cast?.split(',').map((c, idx) => (
                          <span key={idx} className="border border-gray-300 dark:border-slate-700 rounded px-3 py-1">{c.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content & Sidebar Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
                {/* Left Content */}
                <div className="lg:col-span-8">
                  {/* Nội Dung Phim */}
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-l-4 border-[#0056b3] pl-3 uppercase">Nội Dung Phim</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base text-justify">
                      {movie.description}
                    </p>
                  </div>

                  {/* Lịch Chiếu */}
                  <div className="mb-10 mt-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-l-4 border-[#0056b3] pl-3 uppercase">Lịch Chiếu</h2>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
                      {/* Date tabs */}
                      <div className="flex overflow-x-auto gap-2 scrollbar-none pb-2 w-full md:w-auto">
                        {dates.map((date, idx) => {
                          const dateObj = new Date(date);
                          const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
                          const dayNum = dateObj.getDate();
                          const month = dateObj.getMonth() + 1;
                          const isSelected = selectedDate === date;

                          return (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-2 rounded-t-lg transition-colors border-b-2 ${
                                isSelected ? 'bg-[#0056b3] border-[#0056b3] text-white' : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:text-[#0056b3]'
                              }`}
                            >
                              <span className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{idx === 0 ? 'Hôm Nay' : dayName}</span>
                              <span className="font-bold text-sm">{`${dayNum.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Dropdowns */}
                      <div className="flex gap-2">
                        <select className="border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm rounded px-3 py-2 outline-none">
                          <option>Toàn quốc</option>
                        </select>
                        <select
                          value={selectedTheater}
                          onChange={(e) => setSelectedTheater(e.target.value)}
                          className="border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm rounded px-3 py-2 outline-none"
                        >
                          {theaters.map(theater => (
                            <option key={theater} value={theater}>
                              {theater === 'all' ? 'Tất cả rạp' : theater}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Showtimes Grid */}
                    {Object.keys(showtimesByFormat).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(showtimesByFormat).map(([format, shows]) => (
                          <div key={format} className="rounded-xl border border-gray-100 p-4 shadow-sm">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                              {format} Phụ đề
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {shows.map(showtime => (
                                <Link
                                  key={showtime.id}
                                  to={`/seats/${movie.id}/${showtime.id}`}
                                  className="group flex flex-col bg-gray-50 dark:bg-slate-800 rounded px-4 py-2 hover:bg-orange-50 transition-colors text-center border border-gray-200 dark:border-slate-700"
                                >
                                  <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-orange-500">{showtime.time}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{showtime.price.toLocaleString('vi-VN')}đ</div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100">
                        <p className="text-gray-500 dark:text-gray-400">Không có suất chiếu nào phù hợp trong ngày này</p>
                      </div>
                    )}
                  </div>

                  {/* Đánh giá từ Khách hàng */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-16"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-6 h-6 text-red-600" />
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đánh Giá Từ Khách Hàng</h2>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-yellow-500">{reviewData.averageRating > 0 ? reviewData.averageRating.toFixed(1) : '-'} / 5</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">Dựa trên {reviewData.totalReviews} lượt đánh giá</p>
                        </div>
                      </div>

                      {reviewData.reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {reviewData.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {review.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{review.userName}</h4>
                                    <p className="text-xs text-gray-700 dark:text-gray-300">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-900 dark:text-gray-100 text-sm md:text-base leading-relaxed">
                                {review.comment || <span className="italic text-gray-600 dark:text-gray-400">Không có nhận xét.</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100">
                          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-700 dark:text-gray-300 text-sm">Chưa có đánh giá nào cho bộ phim này.</p>
                        </div>
                      )}
                      
                      {/* FORM ĐÁNH GIÁ */}
                      <div className="mt-8 pt-8 border-t-2 border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          {myExistingReview ? 'Đánh giá của bạn' : 'Viết đánh giá của bạn'}
                        </h3>
                        {!currentUser ? (
                          <div className="text-center py-8 bg-orange-50 rounded-2xl border border-orange-100">
                            <Star className="w-10 h-10 text-orange-300 mx-auto mb-3" />
                            <p className="text-orange-800 font-medium mb-3">Đăng nhập để để lại đánh giá cho bộ phim này</p>
                            <Link to="/login" className="inline-block px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold shadow hover:shadow-lg transition-all">Đăng nhập ngay</Link>
                          </div>
                        ) : reviewSuccess ? (
                          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-5 text-green-800 font-semibold">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            Cảm ơn bạn đã đánh giá phim! Nhận xét của bạn đã được ghi nhận.
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border border-orange-100 p-6">
                            <div className="mb-5">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Chấm điểm <span className="text-red-600">*</span></p>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setMyRating(star)} className="transition-transform hover:scale-125 focus:outline-none">
                                    <Star className={`w-10 h-10 transition-colors ${star <= (hoverRating || myRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                  </button>
                                ))}
                                {myRating > 0 && (
                                  <span className="ml-3 font-bold text-orange-600 text-lg">{['', 'Rất tệ', 'Tệ', 'Bình thường', 'Hay', 'Xuất sắc!'][myRating]}</span>
                                )}
                              </div>
                            </div>
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nhận xét (tùy chọn)</p>
                              <textarea value={myReviewComment} onChange={e => setMyReviewComment(e.target.value)} placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..." rows={3} className="w-full bg-white dark:bg-slate-900 border-2 border-orange-200 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none" />
                            </div>
                            <button onClick={handleSubmitReview} disabled={isSubmittingReview || myRating === 0} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg disabled:opacity-50 transition-all">
                              <Send className="w-4 h-4" />
                              {isSubmittingReview ? 'Đang gửi...' : myExistingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                            </button>
                            {myExistingReview && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">* Gửi lại sẽ cập nhật đánh giá cũ của bạn.</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>

                  {/* Bình Luận & Thảo Luận */}

                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-16"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                        <MessageSquare className="w-6 h-6 text-red-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bình Luận &amp; Thảo Luận</h2>
                      </div>

                      {/* Main Comment Box */}
                      <div className="mb-10">
                        {currentUser ? (
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : currentUser.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Tham gia thảo luận về bộ phim này..."
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={handleSubmitComment}
                                  disabled={!newComment.trim() || isSubmittingComment}
                                  className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg disabled:opacity-50 transition-all"
                                >
                                  <Send className="w-4 h-4" />
                                  {isSubmittingComment ? 'Đang gửi...' : 'Gửi'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-orange-800 mb-3">Vui lòng đăng nhập để tham gia bình luận.</p>
                            <Link to="/login" className="inline-block px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold shadow hover:shadow-lg transition-all">
                              Đăng nhập ngay
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Comments List */}
                      <div className="space-y-8">
                        {comments.length > 0 ? (
                          comments.map(comment => (
                            <div key={comment.id} className="flex gap-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold text-lg flex-shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100">
                                  <div className="flex justify-between items-baseline mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{comment.userName}</h4>
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                  </div>
                                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                </div>

                                <div className="mt-2 ml-2">
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 flex items-center gap-1 transition-colors"
                                  >
                                    <Reply className="w-3 h-3" />
                                    Trả lời
                                  </button>
                                </div>

                                {/* Reply Input Box */}
                                {replyingTo === comment.id && currentUser && (
                                  <div className="mt-4 flex gap-3">
                                    <CornerDownRight className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-2" />
                                    <div className="flex-1">
                                      <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder={`Trả lời ${comment.userName}...`}
                                        rows={2}
                                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                      />
                                      <div className="flex justify-end mt-2 gap-2">
                                        <button
                                          onClick={() => setReplyingTo(null)}
                                          className="px-4 py-1.5 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-800"
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={() => handleSubmitReply(comment.id)}
                                          disabled={!replyContent.trim() || isSubmittingComment}
                                          className="px-4 py-1.5 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        >
                                          Trả lời
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Replies List */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-4 space-y-4">
                                    {comment.replies.map(reply => (
                                      <div key={reply.id} className="flex gap-3 mt-4">
                                        <CornerDownRight className="w-5 h-5 text-gray-300 mt-2 flex-shrink-0" />
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold text-sm flex-shrink-0">
                                          {reply.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 border border-gray-100">
                                            <div className="flex justify-between items-baseline mb-1">
                                              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{reply.userName}</h4>
                                              <span className="text-[10px] text-gray-700 dark:text-gray-300">{new Date(reply.createdAt).toLocaleString('vi-VN')}</span>
                                            </div>
                                            <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-700 dark:text-gray-300">
                            Hãy là người đầu tiên bình luận về bộ phim này!
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>
                </div> {/* End lg:col-span-8 */}

                {/* Right Sidebar - Phim Đang Chiếu */}
                <div className="lg:col-span-4 mt-8 lg:mt-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-l-4 border-[#0056b3] pl-3 uppercase">Phim Đang Chiếu</h2>
                  <div className="flex flex-col gap-6">
                    {nowShowingMovies.map((nsMovie) => (
                      <div key={nsMovie.id} className="group cursor-pointer">
                        <Link to={`/movies/${nsMovie.id}`}>
                          <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-2">
                            <ImageWithFallback src={nsMovie.poster} alt={nsMovie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 flex items-center gap-1 rounded shadow">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" /> {nsMovie.rating || '0.0'}
                            </div>
                            <div className="absolute bottom-2 right-14 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                              {nsMovie.ageRating}
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#0056b3] line-clamp-1">{nsMovie.title}</h3>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div> {/* End grid */}
            </div> {/* End container */}
          </div> {/* End bg-white dark:bg-slate-900 */}
        </>
      )}

      {/* Trailer Modal */}
      {showTrailerModal && movie?.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative">
            <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
              <h3 className="font-bold text-lg">{movie.title} - Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full pt-[56.25%] bg-black">
              <iframe
                src={getYouTubeEmbedUrl(movie.trailerUrl) + '?autoplay=1'}
                title="YouTube video player"
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
