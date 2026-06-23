import { Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';

import { Movie } from '../types/Movie';


interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movies/${movie.id}`} className="group">
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl shadow-black/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-all duration-300 transform hover:-translate-y-2 border border-slate-800 hover:border-red-500/50">
        <div className="relative aspect-[2/3] overflow-hidden">
          {/* Status badge */}
          {movie.status === 'comingSoon' ? (
            <span className="absolute top-3 left-3 z-10 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-semibold">Sắp chiếu</span>
          ) : (
            <span className="absolute top-3 left-3 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Đang chiếu</span>
          )}
          <ImageWithFallback
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
            <Star className="w-4 h-4 fill-current" />
            <span>{movie.rating}</span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-t from-slate-950 to-slate-900">
          <h3 className="font-bold text-lg mb-2 line-clamp-1 text-slate-100">{movie.title}</h3>
          <p className="text-slate-400 text-sm mb-2">{movie.genre}</p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>{movie.duration} phút</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
