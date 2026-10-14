import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateItemId(item: any): string {
  const title = item.title || item.name || 'sin-titulo';
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${item.id}-${slug}`; // 238-el-padrino
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TMDB_READ_TOKEN is not configured' }, { status: 500 });
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  try {
    const [movieGenresRes, tvGenresRes, moviesRes, tvRes] = await Promise.all([
      fetch('https://api.themoviedb.org/3/genre/movie/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000) }),
      fetch('https://api.themoviedb.org/3/genre/tv/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000) }),
      fetch('https://api.themoviedb.org/3/discover/movie?language=es-ES&sort_by=popularity.desc&page=1', { headers, signal: AbortSignal.timeout(8000) }),
      fetch('https://api.themoviedb.org/3/discover/tv?language=es-ES&sort_by=popularity.desc&page=1', { headers, signal: AbortSignal.timeout(8000) })
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

    const uniqueGenresSet = new Set<string>();
    genreMap.forEach((gName) => {
      if (gName) uniqueGenresSet.add(gName);
    });
    const sortedGenres = Array.from(uniqueGenresSet).sort((a, b) => a.localeCompare(b, 'es'));

    const formatItem = (item: any, typeOverride: 'Película' | 'Serie') => {
      const title = item.title || item.name || 'Sin título';
      const itemGenres = (item.genre_ids || []).map((id: number) => genreMap.get(id)).filter(Boolean);
      return {
        id: generateItemId(item),
        tmdbId: item.id,
        title,
        type: typeOverride,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        banner: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : ''),
        synopsis: item.overview || 'Sinopsis no disponible.',
        rating: typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '0.0',
        genres: itemGenres
      };
    };

    let movies: any[] = [];
    let series: any[] = [];

    if (moviesRes.ok) {
      const data = await moviesRes.json();
      movies = (data.results || []).map((m: any) => formatItem(m, 'Película'));
    }
    if (tvRes.ok) {
      const data = await tvRes.json();
      series = (data.results || []).map((tv: any) => formatItem(tv, 'Serie'));
    }

    return NextResponse.json({
      movies,
      series,
      genres: ['Todos', ...sortedGenres]
    });

  } catch (err) {
    console.error('Error in movies browse API:', err);
    return NextResponse.json({ error: 'Error al obtener catálogo de TMDB' }, { status: 500 });
  }
}
