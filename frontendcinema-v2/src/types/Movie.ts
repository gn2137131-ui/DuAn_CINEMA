export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: number;
  rating: number;
  ageRating: string;
  description: string;
  poster: string;
  banner: string;
  director: string;
  cast: string[];
  releaseDate: string;
  status: 'nowShowing' | 'comingSoon';
  language?: string;
  trailer?: string;
  views?: number;
}
