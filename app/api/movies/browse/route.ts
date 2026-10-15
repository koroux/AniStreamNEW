import { NextResponse } from 'next/server';

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

  const type = searchParams.get('type') || 'all'; // 'all' | 'movie' | 'tv'
  const genre = searchParams.get('genre'); // ID numérico de TMDB (ej: "27") o undefined
  const pageStr = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || 'popularity'; // 'popularity' | 'rating' | 'recent'

  const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
  const today = new Date().toISOString().split('T')[0];

  const sortMovieMap: Record<string, string> = {
    popularity: 'popularity.desc',
    rating: 'vote_average.desc',
    recent: 'primary_release_date.desc'
  };

  const sortTvMap: Record<string, string> = {
    popularity: 'popularity.desc',
    rating: 'vote_average.desc',
    recent: 'first_air_date.desc'
  };

  const movieSort = sortMovieMap[sort] || 'popularity.desc';
  const tvSort = sortTvMap[sort] || 'popularity.desc';

  const genreParam = (genre && genre !== '0' && genre !== 'Todos' && genre !== 'null' && genre !== 'undefined')
    ? `&with_genres=${encodeURIComponent(genre)}`
    : '';

  const voteFilter = sort === 'rating' ? '&vote_count.gte=50' : '';
  const dateFilterMovie = sort === 'recent' ? `&primary_release_date.lte=${today}` : '';
  const dateFilterTv = sort === 'recent' ? `&first_air_date.lte=${today}` : '';

  try {
    // 1. Obtener listas de géneros para mapear nombres y alimentar los filtros
    const [movieGenresRes, tvGenresRes] = await Promise.all([
      fetch('https://api.themoviedb.org/3/genre/movie/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000) }),
      fetch('https://api.themoviedb.org/3/genre/tv/list?language=es-ES', { headers, signal: AbortSignal.timeout(8000) })
    ]);

    // Mapas de equivalencia conceptual entre películas y series de TMDB
    const MOVIE_TO_TV_GENRE_ID: Record<number, number> = {
      28: 10759,    // Acción → Action & Adventure
      878: 10765,   // Ciencia ficción → Sci-Fi & Fantasy
      10752: 10768  // Bélica → War & Politics
    };

    const TV_TO_MOVIE_GENRE_ID: Record<number, number> = {
      10759: 28,
      10765: 878,
      10768: 10752
    };

    // Géneros de TV que tienen equivalente en película (no deben aparecer como chips separados)
    const TV_GENRES_WITH_MOVIE_EQUIVALENT = new Set([10759, 10765, 10768]);

    interface GenreItem {
      id: number;
      name: string;
      types: ('movie' | 'tv')[];
      equivalentTvId?: number | null;
      equivalentMovieId?: number | null;
    }

    const genreMap = new Map<number, string>();
    const genresMap = new Map<number, GenreItem>();

    if (movieGenresRes.ok) {
      const data = await movieGenresRes.json();
      (data.genres || []).forEach((g: any) => {
        genreMap.set(g.id, g.name);
        const eqTv = MOVIE_TO_TV_GENRE_ID[g.id] || null;
        genresMap.set(g.id, {
          id: g.id,
          name: g.name,
          types: eqTv ? ['movie', 'tv'] : ['movie'],
          equivalentTvId: eqTv,
          equivalentMovieId: null
        });
      });
    }

    if (tvGenresRes.ok) {
      const data = await tvGenresRes.json();
      (data.genres || []).forEach((g: any) => {
        genreMap.set(g.id, g.name);

        // Si este género de TV tiene equivalente en movie, no añadir como chip duplicado
        if (TV_GENRES_WITH_MOVIE_EQUIVALENT.has(g.id)) {
          return;
        }

        const existing = genresMap.get(g.id);
        if (existing) {
          // Mismo ID en ambos (ej: 16 Animación, 35 Comedia, 18 Drama, etc.)
          if (!existing.types.includes('tv')) {
            existing.types.push('tv');
          }
        } else {
          // Exclusivo de TV (ej: 10762 Kids, 10764 Reality, etc.)
          genresMap.set(g.id, {
            id: g.id,
            name: g.name,
            types: ['tv'],
            equivalentTvId: null,
            equivalentMovieId: null
          });
        }
      });
    }

    // Normalizar nombres de géneros en español para los badges de items de series equivalentes
    genreMap.set(10759, 'Acción');
    genreMap.set(10765, 'Ciencia ficción');
    genreMap.set(10768, 'Bélica');

    const genresList = Array.from(genresMap.values());
    genresList.sort((a, b) => a.name.localeCompare(b.name, 'es'));

    // Determinar qué endpoints llamar según tipo y compatibilidad de género
    const requestedGenreId = (genre && genre !== '0' && genre !== 'Todos' && genre !== 'null' && genre !== 'undefined')
      ? parseInt(genre, 10)
      : null;

    let genreItem: GenreItem | null = null;
    let movieGenreId: number | null = null;
    let tvGenreId: number | null = null;

    if (requestedGenreId !== null) {
      genreItem = genresList.find(g => g.id === requestedGenreId) || null;

      if (genreItem) {
        movieGenreId = genreItem.types.includes('movie') ? genreItem.id : (genreItem.equivalentMovieId || null);
        tvGenreId = genreItem.equivalentTvId || (genreItem.types.includes('tv') ? genreItem.id : null);
      } else if (TV_TO_MOVIE_GENRE_ID[requestedGenreId]) {
        movieGenreId = TV_TO_MOVIE_GENRE_ID[requestedGenreId];
        tvGenreId = requestedGenreId;
        genreItem = genresList.find(g => g.id === movieGenreId) || null;
      }
    }

    let shouldFetchMovie = false;
    let shouldFetchTv = false;

    if (!requestedGenreId) {
      if (type === 'all' || type === 'movie') shouldFetchMovie = true;
      if (type === 'all' || type === 'tv') shouldFetchTv = true;
    } else {
      if (type === 'movie') {
        if (movieGenreId !== null) {
          shouldFetchMovie = true;
        } else {
          return NextResponse.json({
            items: [],
            page: pageNum,
            totalPages: 0,
            hasMore: false,
            genres: genresList
          });
        }
      } else if (type === 'tv') {
        if (tvGenreId !== null) {
          shouldFetchTv = true;
        } else {
          return NextResponse.json({
            items: [],
            page: pageNum,
            totalPages: 0,
            hasMore: false,
            genres: genresList
          });
        }
      } else {
        // type === 'all'
        if (movieGenreId !== null) shouldFetchMovie = true;
        if (tvGenreId !== null) shouldFetchTv = true;
      }
    }

    const movieGenreParam = movieGenreId ? `&with_genres=${movieGenreId}` : '';
    const tvGenreParam = tvGenreId ? `&with_genres=${tvGenreId}` : '';

    const formatItem = (item: any, typeOverride: 'Película' | 'Serie') => {
      const title = item.title || item.name || 'Sin título';
      const mediaType: 'movie' | 'tv' = typeOverride === 'Serie' ? 'tv' : 'movie';
      const itemGenres = (item.genre_ids || []).map((id: number) => genreMap.get(id)).filter(Boolean);
      return {
        id: generateItemId(item, mediaType),
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

    let moviesList: any[] = [];
    let tvList: any[] = [];
    let movieTotalPages = 1;
    let tvTotalPages = 1;

    // 2. Discover según selección
    if (shouldFetchMovie) {
      try {
        const mUrl = `https://api.themoviedb.org/3/discover/movie?language=es-ES&sort_by=${movieSort}&page=${pageNum}${movieGenreParam}${voteFilter}${dateFilterMovie}`;
        const mRes = await fetch(mUrl, { headers, signal: AbortSignal.timeout(8000) });
        if (mRes.ok) {
          const mData = await mRes.json();
          movieTotalPages = mData.total_pages || 1;
          moviesList = (mData.results || []).map((m: any) => formatItem(m, 'Película'));
        }
      } catch (err) {
        console.error('Error fetching discover movie:', err);
      }
    }

    if (shouldFetchTv) {
      try {
        const tvUrl = `https://api.themoviedb.org/3/discover/tv?language=es-ES&sort_by=${tvSort}&page=${pageNum}${tvGenreParam}${voteFilter}${dateFilterTv}`;
        const tvRes = await fetch(tvUrl, { headers, signal: AbortSignal.timeout(8000) });
        if (tvRes.ok) {
          const tvData = await tvRes.json();
          tvTotalPages = tvData.total_pages || 1;
          tvList = (tvData.results || []).map((t: any) => formatItem(t, 'Serie'));
        }
      } catch (err) {
        console.error('Error fetching discover tv:', err);
      }
    }

    let items: any[] = [];
    let totalPages = 1;

    if (shouldFetchMovie && !shouldFetchTv) {
      items = moviesList;
      totalPages = movieTotalPages;
    } else if (shouldFetchTv && !shouldFetchMovie) {
      items = tvList;
      totalPages = tvTotalPages;
    } else if (shouldFetchMovie && shouldFetchTv) {
      // type === 'all': Mezclar alternando película y serie
      const maxLen = Math.max(moviesList.length, tvList.length);
      const interleaved: any[] = [];
      for (let i = 0; i < maxLen; i++) {
        if (i < moviesList.length) interleaved.push(moviesList[i]);
        if (i < tvList.length) interleaved.push(tvList[i]);
      }
      items = interleaved;
      totalPages = Math.max(movieTotalPages, tvTotalPages);
    }

    // Deduplicar por id
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
    const cappedTotalPages = Math.min(500, totalPages);
    const hasMore = pageNum < cappedTotalPages && uniqueItems.length > 0;

    return NextResponse.json({
      items: uniqueItems,
      page: pageNum,
      totalPages: cappedTotalPages,
      hasMore,
      genres: genresList
    });

  } catch (err) {
    console.error('Error in movies browse API:', err);
    return NextResponse.json({ error: 'Error al obtener catálogo de TMDB' }, { status: 500 });
  }
}
