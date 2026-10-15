import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

function generateItemId(item: any, mediaType: 'movie' | 'tv'): string {
  const title = item.title || item.name || 'sin-titulo';
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return slug ? `${mediaType}-${item.id}-${slug}` : `${mediaType}-${item.id}`;
}

const getHomeData = unstable_cache(
  async () => {
    const token = process.env.TMDB_READ_TOKEN;
    if (!token) {
      throw new Error('TMDB_READ_TOKEN is not configured');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    const [movieGenresRes, tvGenresRes, trendingMovieRes, trendingTvRes, nowPlayingRes, onAirRes, topMovieRes] = await Promise.all([
      fetch('https://api.themoviedb.org/3/genre/movie/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/genre/tv/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/trending/movie/week?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/trending/tv/week?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/movie/now_playing?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/tv/on_the_air?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetch('https://api.themoviedb.org/3/movie/top_rated?language=es-ES', { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } })
    ]);

    const genreMap = new Map<number, string>();
    if (movieGenresRes.ok) {
      const data = await movieGenresRes.json();
      (data.genres || []).forEach((g: any) => genreMap.set(g.id, g.name));
    }
    if (tvGenresRes.ok) {
      const data = await tvGenresRes.json();
      (data.genres || []).forEach((g: any) => genreMap.set(g.id, g.name));
    }

    const formatItem = (item: any, typeOverride?: 'Película' | 'Serie') => {
      const title = item.title || item.name || 'Sin título';
      const type = typeOverride || (item.name || item.first_air_date ? 'Serie' : 'Película');
      const mediaType = type === 'Serie' ? 'tv' : 'movie';
      const itemGenres = (item.genre_ids || []).map((id: number) => genreMap.get(id)).filter(Boolean);
      return {
        id: generateItemId(item, mediaType),
        tmdbId: item.id,
        title,
        type,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        banner: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : ''),
        synopsis: item.overview || 'Sinopsis no disponible.',
        rating: typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '0.0',
        genres: itemGenres
      };
    };

    let trendingMovies: any[] = [];
    let trendingTv: any[] = [];
    let nowPlaying: any[] = [];
    let onAir: any[] = [];
    let topMovies: any[] = [];

    if (trendingMovieRes.ok) {
      const data = await trendingMovieRes.json();
      trendingMovies = (data.results || []).map((m: any) => formatItem(m, 'Película'));
    }
    if (trendingTvRes.ok) {
      const data = await trendingTvRes.json();
      trendingTv = (data.results || []).map((tv: any) => formatItem(tv, 'Serie'));
    }
    if (nowPlayingRes.ok) {
      const data = await nowPlayingRes.json();
      nowPlaying = (data.results || []).map((m: any) => formatItem(m, 'Película'));
    }
    if (onAirRes.ok) {
      const data = await onAirRes.json();
      onAir = (data.results || []).map((tv: any) => formatItem(tv, 'Serie'));
    }
    if (topMovieRes.ok) {
      const data = await topMovieRes.json();
      topMovies = (data.results || []).map((m: any) => formatItem(m, 'Película'));
    }

    const trending = [...trendingMovies.slice(0, 5), ...trendingTv.slice(0, 5)];
    
    // Deduplicación estricta de películas
    const allMoviesRaw = [...nowPlaying, ...topMovies];
    const movies = Array.from(new Map(allMoviesRaw.map(m => [m.id, m])).values());
    const series = onAir;

    return {
      trending,
      movies,
      series,
      newReleases: [...nowPlaying.slice(0, 10), ...onAir.slice(0, 10)]
    };
  },
  ['movies-home-data'],
  { revalidate: 1800 } // 30 minutos de caché
);

export async function GET() {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TMDB_READ_TOKEN is not configured' }, { status: 500 });
  }

  try {
    const data = await getHomeData();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching TMDB home data:', err);
    return NextResponse.json({ error: 'Error al conectar con TMDB' }, { status: 500 });
  }
}
