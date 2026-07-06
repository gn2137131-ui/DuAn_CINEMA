import { useState, useMemo, useEffect } from 'react';

const BACKEND_IMAGE_URL = import.meta.env.VITE_BACKEND_URL || '';

import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, X, Star, Clock, Grid3X3, List,
    ChevronDown, ChevronUp, SlidersHorizontal, Ticket,
    Eye, TrendingUp, Calendar, Heart, Play, Film,
    Tag, ArrowUpDown
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import axiosClient from '../api/axiosClient';

export type MovieType = {
    id: number;
    title: string;
    description: string;
    director: string;
    genre: string;
    releaseDate: string;
    duration: number;
    language: string;
    ageRating: string;
    rating: number;
    views: number;
    status: 'nowShowing' | 'comingSoon';
    poster: string;
    trailerUrl: string;
};

type ViewMode = 'grid' | 'list';
type SortKey = 'rating' | 'releaseDate' | 'duration' | 'title' | 'views';
type TabKey = 'all' | 'nowShowing' | 'comingSoon' | 'today';

const AGE_RATING_COLORS: Record<string, string> = {
    P: 'bg-green-500',
    T13: 'bg-yellow-500',
    T16: 'bg-orange-500',
    T18: 'bg-red-600',
};



const FORMAT_OPTIONS = ['Tất cả', '2D', '3D', 'IMAX', '4DX'];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'rating', label: 'Đánh giá cao nhất' },
    { key: 'views', label: 'Xem nhiều nhất' },
    { key: 'releaseDate', label: 'Mới nhất' },
    { key: 'duration', label: 'Thời lượng' },
    { key: 'title', label: 'Tên A-Z' },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i <= Math.round(rating / 2) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
            <span className="ml-1 text-sm font-semibold text-gray-900">{rating}</span>
        </div>
    );
}

function MovieGridCard({ movie, index, onPlayTrailer }: { movie: MovieType; index: number; onPlayTrailer: (url: string, title: string) => void }) {
    const [liked, setLiked] = useState(false);
    const isComingSoon = movie.status === 'comingSoon';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative bg-white dark:bg-[#111111] border border-transparent dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(220,38,38,0.15)] transition-all duration-300 hover:-translate-y-2"
        >
            {/* Poster */}
            <div className="relative aspect-[2/3] overflow-hidden">
                <ImageWithFallback
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    {isComingSoon ? (
                        <div className="text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-white text-sm mb-3 font-medium flex items-center justify-center gap-1.5 drop-shadow-md">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Ra mắt: {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                            </p>
                            <Link
                                to={`/movies/${movie.id}`}
                                className="block w-full bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-2xl text-sm font-bold hover:bg-white/20 transition-colors shadow-lg"
                            >
                                Xem Chi Tiết
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Link
                                to={`/movies/${movie.id}`}
                                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-3 rounded-2xl text-sm font-black hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 transition-all"
                            >
                                <Ticket className="w-5 h-5" />
                                ĐẶT VÉ NGAY
                            </Link>
                            <button
                                onClick={() => onPlayTrailer(movie.trailerUrl, movie.title)}
                                className="flex items-center justify-center gap-2 w-full bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-2xl text-sm font-bold hover:bg-white/20 transition-colors border border-white/10"
                            >
                                <Play className="w-4 h-4" />
                                XEM TRAILER
                            </button>
                        </div>
                    )}
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isComingSoon ? (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-black shadow-lg uppercase tracking-wider">
                            Sắp chiếu
                        </span>
                    ) : (
                        <span className="bg-gradient-to-r from-red-600/90 to-orange-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-black shadow-lg uppercase tracking-wider">
                            Đang chiếu
                        </span>
                    )}
                    <span className={`${AGE_RATING_COLORS[movie.ageRating] || 'bg-gray-500'} text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg w-max`}>
                        {movie.ageRating}
                    </span>
                </div>

                {/* Like button */}
                <button
                    onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
                    className="absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 hover:scale-110 transition-all border border-white/10"
                >
                    <Heart className={`w-4 h-4 ${liked ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-white'}`} />
                </button>

                {/* Rating badge */}
                <div className="absolute top-3 right-3 opacity-0 flex items-center gap-1 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {movie.rating}
                </div>
            </div>

            {/* Info */}
            <div className="p-5">
                <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {movie.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1 font-medium">{movie.genre}</p>
                
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                    <StarRating rating={movie.rating} />
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {movie.duration}p
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MovieListCard({ movie, index, onPlayTrailer }: { movie: MovieType; index: number; onPlayTrailer: (url: string, title: string) => void }) {
    const [liked, setLiked] = useState(false);
    const isComingSoon = movie.status === 'comingSoon';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="group bg-white dark:bg-[#111111] dark:border dark:border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-0"
        >
            {/* Poster */}
            <div className="relative w-full sm:w-48 aspect-[2/3] sm:aspect-auto flex-shrink-0 overflow-hidden">
                <ImageWithFallback
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isComingSoon ? (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-black shadow-md uppercase tracking-wider">SẮP CHIẾU</span>
                    ) : (
                        <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">ĐANG CHIẾU</span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-5 flex flex-col justify-between min-w-0 border-l border-transparent dark:border-gray-800">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                            {movie.title}
                        </h3>
                        <button
                            onClick={() => setLiked(!liked)}
                            className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                            <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`${AGE_RATING_COLORS[movie.ageRating] || 'bg-gray-500'} text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm`}>
                            {movie.ageRating}
                        </span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">{movie.genre}</span>
                        {movie.language && (
                            <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2.5 py-1 rounded-full font-medium">{movie.language}</span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{movie.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 px-2.5 py-1 rounded-lg font-bold">
                            <Star className="w-4 h-4 fill-current" />
                            {movie.rating}/10
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 text-orange-500" />
                            {movie.duration} phút
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                        </div>
                        {(movie.views ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 font-medium text-gray-500">
                                <Eye className="w-4 h-4" />
                                {((movie.views ?? 0) / 1000).toFixed(1)}k view
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Đạo diễn: <span className="text-gray-800 dark:text-gray-200 font-bold">{movie.director}</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {isComingSoon ? (
                        <Link
                            to={`/movies/${movie.id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            Ra mắt {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                        </Link>
                    ) : (
                        <Link
                            to={`/movies/${movie.id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-black hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <Ticket className="w-5 h-5" />
                            ĐẶT VÉ NGAY
                        </Link>
                    )}
                    <button
                        onClick={() => onPlayTrailer(movie.trailerUrl, movie.title)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Xem Trailer
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function Movies() {
    const [movies, setMovies] = useState<MovieType[]>([]);
    const [todayMovieIds, setTodayMovieIds] = useState<number[]>([]);
    // Age rating labels state
    const [ageRatingLabels, setAgeRatingLabels] = useState<Record<string, string>>({});

    useEffect(() => {
        // Fetch age rating labels once
        axiosClient.get('/age-ratings')
            .then(res => setAgeRatingLabels(res as unknown as Record<string, string>))
            .catch(err => console.error('Failed to load age rating labels:', err));
            
        const fetchTodayShowtimes = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const res = await axiosClient.get(`/showtimes/daily?date=${today}`);
                const data = Array.isArray(res) ? res : (res as any).data;
                const ids = data.map((st: any) => st.movie.id);
                setTodayMovieIds(Array.from(new Set(ids)));
            } catch (err) {
                console.error('Failed to fetch today showtimes:', err);
            }
        };
        fetchTodayShowtimes();
    }, []);

    const [isLoading, setIsLoading] = useState(true);

    const [tab, setTab] = useState<TabKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedAgeRatings, setSelectedAgeRatings] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState('Tất cả');
    const [sortKey, setSortKey] = useState<SortKey>('rating');
    const [sortAsc, setSortAsc] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [selectedTrailer, setSelectedTrailer] = useState<{ url: string, title: string } | null>(null);

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

    const handlePlayTrailer = (url: string, title: string) => {
        if (url) {
            setSelectedTrailer({ url, title });
        } else {
            alert('Phim này chưa cập nhật Trailer!');
        }
    };

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const res = await axiosClient.get('/movies');
                const data = Array.isArray(res) ? res : (res as any).data;
                const formatted = data.map((m: any) => {
                    const releaseDateStr = m.release_date || m.releaseDate || '';
                    const releaseDate = new Date(releaseDateStr);
                    const now = new Date();
                    const status = releaseDate > now ? 'comingSoon' : 'nowShowing';

                    // Ensure poster URL is absolute
                    const rawPoster = m.posterUrl || m.poster_url || m.poster || '';
                    const poster = rawPoster && !rawPoster.startsWith('http') ? `${BACKEND_IMAGE_URL}${rawPoster}` : rawPoster;

                    return {
                        id: m.id,
                        title: m.title || '',
                        description: m.description || '',
                        director: m.director || 'Đang cập nhật',
                        genre: m.genre || 'Hành động',
                        releaseDate: releaseDateStr,
                        duration: m.duration || 120,
                        language: m.language || 'Phụ đề Việt',
                        ageRating: m.ageRestriction || m.age_restriction || 'P',
                        rating: m.rating !== undefined && m.rating !== null ? Number(m.rating) : 0,
                        views: m.views || Math.floor(Math.random() * 5000) + 1000,
                        status: status,
                        poster: poster,
                        trailerUrl: m.trailerUrl || m.trailer_url || ''
                    };
                });
                setMovies(formatted);
            } catch (error) {
                console.error("Lỗi khi tải danh sách phim:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Extract all unique genres
    const allGenres = useMemo(() =>
        Array.from(new Set(movies.flatMap(m => m.genre.split(', ').map(g => g.trim())))).sort(),
        [movies]
    );

    const allAgeRatings = useMemo(() =>
        Array.from(new Set(movies.map(m => m.ageRating))).sort(),
        [movies]
    );

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
        setCurrentPage(1);
    };

    const toggleAgeRating = (rating: string) => {
        setSelectedAgeRatings(prev =>
            prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
        );
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGenres([]);
        setSelectedAgeRatings([]);
        setSelectedFormat('Tất cả');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || selectedGenres.length > 0 || selectedAgeRatings.length > 0 || selectedFormat !== 'Tất cả';

    const filteredMovies = useMemo(() => {
        let result = movies.filter(movie => {
            if (tab === 'nowShowing' && movie.status !== 'nowShowing') return false;
            if (tab === 'comingSoon' && movie.status !== 'comingSoon') return false;
            if (tab === 'today' && !todayMovieIds.includes(movie.id)) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!movie.title.toLowerCase().includes(q) &&
                    !movie.genre.toLowerCase().includes(q) &&
                    !movie.director.toLowerCase().includes(q)) return false;
            }

            if (selectedGenres.length > 0) {
                const movieGenres = movie.genre.split(', ').map(g => g.trim());
                if (!selectedGenres.some(g => movieGenres.includes(g))) return false;
            }

            if (selectedAgeRatings.length > 0 && !selectedAgeRatings.includes(movie.ageRating)) return false;

            return true;
        });

        result = [...result].sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'rating') cmp = a.rating - b.rating;
            else if (sortKey === 'views') cmp = (a.views ?? 0) - (b.views ?? 0);
            else if (sortKey === 'releaseDate') cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
            else if (sortKey === 'duration') cmp = a.duration - b.duration;
            else if (sortKey === 'title') cmp = a.title.localeCompare(b.title, 'vi');
            return sortAsc ? cmp : -cmp;
        });

        return result;
    }, [movies, tab, searchQuery, selectedGenres, selectedAgeRatings, selectedFormat, sortKey, sortAsc]);

    const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
    const paginatedMovies = filteredMovies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const nowShowingCount = movies.filter(m => m.status === 'nowShowing').length;
    const comingSoonCount = movies.filter(m => m.status === 'comingSoon').length;

    const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || '';

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-[#0a0a0a] dark:to-[#111111] transition-colors duration-500">
            <Header />

            {/* Page Hero */}
            <section className="relative bg-[#0a0a0a] py-16 lg:py-24 overflow-hidden">
                {/* Cinematic Background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(220,38,38,0.2),_transparent_70%)]"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Film className="w-8 h-8 text-white" />
                        <h1 className="text-4xl font-black text-white">Phim Chiếu Rạp</h1>
                    </div>
                    <p className="text-white/80 text-lg mb-8 max-w-xl">
                        Khám phá hàng trăm bộ phim đang chiếu và sắp chiếu tại CineVerse
                    </p>

                    {isLoading && (
                        <div className="text-white bg-white/20 px-4 py-2 rounded-xl inline-block mb-4">
                            Đang tải danh sách phim...
                        </div>
                    )}

                    {/* Search bar */}
                    <div className="relative max-w-2xl mt-4">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm phim, đạo diễn, thể loại..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-14 pr-14 py-4 rounded-2xl bg-white/10 dark:bg-black/50 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white/20 transition-all font-medium text-lg"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs + Controls row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    {/* Tabs */}
                    <div className="flex bg-white dark:bg-[#111111] dark:border dark:border-gray-800 rounded-2xl p-1.5 shadow-md gap-1 self-start overflow-x-auto max-w-full no-scrollbar">
                        {([
                            { key: 'all', label: 'Tất Cả', count: movies.length },
                            { key: 'nowShowing', label: 'Đang Chiếu', count: nowShowingCount },
                            { key: 'comingSoon', label: 'Sắp Chiếu', count: comingSoonCount },
                            { key: 'today', label: 'Hôm Nay', count: todayMovieIds.length },
                        ] as const).map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => { setTab(key); setCurrentPage(1); }}
                                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center whitespace-nowrap ${tab === key
                                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {label}
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Sort */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                <ArrowUpDown className="w-4 h-4 text-orange-500" />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                            <AnimatePresence>
                                {showSortDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#111111] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-30 overflow-hidden"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => {
                                                    if (sortKey === opt.key) setSortAsc(!sortAsc);
                                                    else { setSortKey(opt.key); setSortAsc(false); }
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors ${sortKey === opt.key ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/10' : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {opt.label}
                                                {sortKey === opt.key && (
                                                    sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-bold transition-all shadow-sm ${showFilters || hasActiveFilters
                                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-transparent'
                                : 'bg-white dark:bg-[#111111] text-gray-900 dark:text-white border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Bộ Lọc</span>
                            {hasActiveFilters && (
                                <span className="bg-white text-red-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-black shadow-inner">
                                    {selectedGenres.length + selectedAgeRatings.length + (selectedFormat !== 'Tất cả' ? 1 : 0) + (searchQuery ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        {/* View mode */}
                        <div className="flex bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-3">
                                        <Filter className="w-5 h-5 text-orange-500" />
                                        Bộ Lọc Nâng Cao
                                    </h3>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm bg-red-50 dark:bg-red-900/20 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1.5"
                                        >
                                            <X className="w-4 h-4" /> Xóa Bộ Lọc
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Genre filter */}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider">Thể Loại</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {allGenres.map(genre => (
                                                <button
                                                    key={genre}
                                                    onClick={() => toggleGenre(genre)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selectedGenres.includes(genre)
                                                        ? 'bg-red-600 dark:bg-red-600 text-white border-red-600 shadow-md'
                                                        : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500'
                                                        }`}
                                                >
                                                    {genre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Age rating filter */}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider">Giới Hạn Tuổi</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {allAgeRatings.map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => toggleAgeRating(rating)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selectedAgeRatings.includes(rating)
                                                        ? `${AGE_RATING_COLORS[rating]} text-white border-transparent shadow-md`
                                                        : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500'
                                                        }`}
                                                >
                                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${selectedAgeRatings.includes(rating) ? 'bg-white/20' : AGE_RATING_COLORS[rating]
                                                        } text-white font-black`}>
                                                        {rating}
                                                    </span>
                                                    {ageRatingLabels[rating] || rating}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Format filter */}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 uppercase tracking-wider">Định Dạng Chiếu</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {FORMAT_OPTIONS.map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => { setSelectedFormat(fmt); setCurrentPage(1); }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selectedFormat === fmt
                                                        ? 'bg-orange-500 dark:bg-orange-600 text-white border-orange-500 shadow-md'
                                                        : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500'
                                                        }`}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Active filter chips */}
                                {hasActiveFilters && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex flex-wrap gap-3 items-center">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Đang lọc:</span>
                                            {searchQuery && (
                                                <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50">
                                                    "{searchQuery}"
                                                    <button onClick={() => setSearchQuery('')} className="hover:bg-red-200 dark:hover:bg-red-800 p-0.5 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            )}
                                            {selectedGenres.map(g => (
                                                <span key={g} className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50">
                                                    {g}
                                                    <button onClick={() => toggleGenre(g)} className="hover:bg-red-200 dark:hover:bg-red-800 p-0.5 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                            {selectedAgeRatings.map(r => (
                                                <span key={r} className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/50">
                                                    {r}
                                                    <button onClick={() => toggleAgeRating(r)} className="hover:bg-orange-200 dark:hover:bg-orange-800 p-0.5 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                            {selectedFormat !== 'Tất cả' && (
                                                <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                                    {selectedFormat}
                                                    <button onClick={() => setSelectedFormat('Tất cả')} className="hover:bg-yellow-200 dark:hover:bg-yellow-800 p-0.5 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results count + trending */}
                <div className="flex items-center justify-between mb-8">
                    <p className="text-gray-800 dark:text-gray-300 font-medium">
                        Hiển thị <span className="font-black text-gray-900 dark:text-white text-xl mx-1">{filteredMovies.length}</span> phim
                        {hasActiveFilters && <span className="text-red-600 dark:text-red-400 font-bold ml-1">(đã lọc)</span>}
                    </p>
                    {!hasActiveFilters && tab === 'nowShowing' && (
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-black tracking-wide">
                            <TrendingUp className="w-5 h-5" />
                            PHIM HOT TUẦN NÀY
                        </div>
                    )}
                </div>

                {/* Movie grid/list */}
                {paginatedMovies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <Film className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy phim</h3>
                        <p className="text-gray-600 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                        >
                            Xóa bộ lọc
                        </button>
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {paginatedMovies.map((movie, i) => (
                            <MovieGridCard key={movie.id} movie={movie} index={i} onPlayTrailer={handlePlayTrailer} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {paginatedMovies.map((movie, i) => (
                            <MovieListCard key={movie.id} movie={movie} index={i} onPlayTrailer={handlePlayTrailer} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-12 mb-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-5 py-3 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:border-red-400 dark:hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            ← Trước
                        </button>
                        <div className="hidden sm:flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-12 h-12 rounded-xl text-base font-black transition-all ${currentPage === page
                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-[0_4px_15px_rgba(220,38,38,0.3)] scale-110'
                                        : 'bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-red-400 dark:hover:border-red-500 shadow-sm'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <span className="sm:hidden text-gray-500 font-bold">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-5 py-3 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:border-red-400 dark:hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            Sau →
                        </button>
                    </div>
                )}
            </div>

            <Footer />

            {/* Trailer Modal */}
            {selectedTrailer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-black rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative">
                        <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
                            <h3 className="font-bold text-lg">{selectedTrailer.title} - Trailer</h3>
                            <button
                                onClick={() => setSelectedTrailer(null)}
                                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="relative w-full pt-[56.25%] bg-black">
                            <iframe
                                src={getYouTubeEmbedUrl(selectedTrailer.url) + '?autoplay=1'}
                                title="YouTube video player"
                                className="absolute top-0 left-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
