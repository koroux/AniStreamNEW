import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchTMDBMeta(slug: string): Promise<{
  title: string;
  type: 'Película' | 'Serie';
  poster: string;
  banner: string;
  synopsis: string;
  rating: string;
  genres: string[];
  tmdbId: number;
} | null> {
  const query = slug.replace(/-/g, ' ');
  const token = process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error('TMDB_READ_TOKEN is not configured');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  try {
    // 1. Buscar como Película
    const movieSearchRes = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=es-ES`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });

    if (movieSearchRes.ok) {
      const movieData = await movieSearchRes.json();
      if (movieData.results && movieData.results.length > 0) {
        const topResult = movieData.results[0];
        const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${topResult.id}?language=es-ES`, {
          headers,
          signal: AbortSignal.timeout(8000)
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          return {
            title: detail.title || topResult.title,
            type: 'Película',
            poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : '',
            banner: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : (detail.poster_path ? `https://image.tmdb.org/t/p/w1280${detail.poster_path}` : ''),
            synopsis: detail.overview || 'Sinopsis no disponible.',
            rating: typeof detail.vote_average === 'number' ? detail.vote_average.toFixed(1) : '4.8',
            genres: Array.isArray(detail.genres) ? detail.genres.map((g: any) => g.name) : [],
            tmdbId: detail.id
          };
        }
      }
    }

    // 2. Si no hay resultados de película, buscar como Serie (TV)
    const tvSearchRes = await fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=es-ES`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });

    if (tvSearchRes.ok) {
      const tvData = await tvSearchRes.json();
      if (tvData.results && tvData.results.length > 0) {
        const topResult = tvData.results[0];
        const detailRes = await fetch(`https://api.themoviedb.org/3/tv/${topResult.id}?language=es-ES`, {
          headers,
          signal: AbortSignal.timeout(8000)
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          return {
            title: detail.name || topResult.name,
            type: 'Serie',
            poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : '',
            banner: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : (detail.poster_path ? `https://image.tmdb.org/t/p/w1280${detail.poster_path}` : ''),
            synopsis: detail.overview || 'Sinopsis no disponible.',
            rating: typeof detail.vote_average === 'number' ? detail.vote_average.toFixed(1) : '4.8',
            genres: Array.isArray(detail.genres) ? detail.genres.map((g: any) => g.name) : [],
            tmdbId: detail.id
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Error in fetchTMDBMeta:', err);
    throw err;
  }
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

async function searchMovieOnCineCalidad(queryTitle: string, isSerie: boolean): Promise<string> {
  try {
    const cleanTitle = queryTitle
      .replace(/[:.,;!?()"'¡¿\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': CHROME_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return '';

    const html = await res.text();
    const $ = cheerio.load(html);
    const normalizedQuery = normalizeStr(cleanTitle);

    let bestMatchUrl = '';
    let bestScore = -1;

    const items = $('article, .item, .post-item').toArray();

    for (const el of items) {
      const $el = $(el);
      const link = $el.find('a').attr('href') || '';
      const cardTitle = $el.find('h2, .title, .name').text().trim() || $el.find('img').attr('alt') || '';
      const normalizedCardTitle = normalizeStr(cardTitle);

      const isLinkSerie = link.includes('/ver-serie/') || link.includes('/ver-el-episodio/');
      const isLinkPelicula = link.includes('/ver-pelicula/');
      const expectedTypeMatch = isSerie ? isLinkSerie : isLinkPelicula;

      if (!link) continue;

      let score = 0;
      if (normalizedCardTitle === normalizedQuery) {
        score = 100;
      } else if (normalizedCardTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedCardTitle)) {
        score = 50;
      } else {
        continue;
      }

      if (expectedTypeMatch) {
        score += 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatchUrl = link;
        if (score >= 150) {
          break;
        }
      }
    }

    if (bestScore < 50) {
      return '';
    }

    // Si es serie y el match es una página de serie (/ver-serie/), extraemos el link del primer episodio
    if (isSerie && bestMatchUrl.includes('/ver-serie/')) {
      try {
        const seriesRes = await fetch(bestMatchUrl, {
          headers: {
            'User-Agent': CHROME_USER_AGENT,
            'Referer': 'https://www.cinecalidad.am/'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (seriesRes.ok) {
          const seriesHtml = await seriesRes.text();
          const $$ = cheerio.load(seriesHtml);
          const epLink = 
            $$('.episodios li.eps-navigation').first().attr('data-href') ||
            $$('li.eps-navigation a').first().attr('href') ||
            $$('.episodios a').first().attr('href') || '';

          if (epLink) {
            return epLink;
          }
        }
      } catch (seriesErr) {
        console.error('Error fetching series page for episode extraction:', seriesErr);
      }
    }

    return bestMatchUrl;
  } catch (err) {
    console.error('Error in searchMovieOnCineCalidad:', err);
    return '';
  }
}

function extractServersFromMoviePage(html: string): Array<{ nombre: string; url: string }> {
  const servers: Array<{ nombre: string; url: string }> = [];

  try {
    const $ = cheerio.load(html);

    $('#playeroptionsul li[data-option]').each((_, el) => {
      const $el = $(el);
      const url = $el.attr('data-option') || '';
      
      // Extraer solo el primer nodo de texto directo (excluir spans anidados)
      let nombre = '';
      $el.contents().each((_, node) => {
        if (node.type === 'text' && !nombre) {
          nombre = (node as any).data?.trim() || '';
        }
      });
      if (!nombre) nombre = 'Servidor HD';

      const className = $el.attr('class') || '';

      const isTrailerClass = className.includes('dooplay_player_option_trailer');
      const isTrailerUrl = url.includes('youtube.com');
      const isTrailerName = nombre.toLowerCase().includes('trailer');

      if (!isTrailerClass && !isTrailerUrl && !isTrailerName && url) {
        if (!servers.some(s => s.url === url)) {
          const finalUrl = url.startsWith('http') ? url : 'https:' + url;
          servers.push({ nombre, url: finalUrl });
        }
      }
    });

    return servers;
  } catch (err) {
    console.error('Error extracting servers from HTML:', err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';

  if (!id) {
    return NextResponse.json({ error: 'ID o slug requerido' }, { status: 400 });
  }

  let tmdbMeta = null;
  try {
    tmdbMeta = await fetchTMDBMeta(id);
  } catch (err) {
    return NextResponse.json({ error: 'Error conectando con TMDB' }, { status: 500 });
  }

  if (!tmdbMeta) {
    return NextResponse.json({ error: 'Título no encontrado en TMDB' }, { status: 404 });
  }

  const isSerie = tmdbMeta.type === 'Serie';
  let servers: Array<{ nombre: string; url: string }> = [];

  try {
    const detailUrl = await searchMovieOnCineCalidad(tmdbMeta.title, isSerie);

    if (detailUrl) {
      const res = await fetch(detailUrl, {
        headers: {
          'User-Agent': CHROME_USER_AGENT,
          'Referer': 'https://www.cinecalidad.am/'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const html = await res.text();
        servers = extractServersFromMoviePage(html);
      }
    }
  } catch (err) {
    console.error('Error in info API route:', err);
  }

  const episodes = isSerie ? [
    { number: 1, title: 'Episodio 1' },
    { number: 2, title: 'Episodio 2' },
    { number: 3, title: 'Episodio 3' },
    { number: 4, title: 'Episodio 4' },
    { number: 5, title: 'Episodio 5' },
    { number: 6, title: 'Episodio 6' },
    { number: 7, title: 'Episodio 7' },
    { number: 8, title: 'Episodio 8' }
  ] : [{ number: 1, title: 'Película Completa (Español Latino)' }];

  return NextResponse.json({
    id,
    title: tmdbMeta.title,
    poster: tmdbMeta.poster,
    banner: tmdbMeta.banner,
    synopsis: tmdbMeta.synopsis,
    rating: tmdbMeta.rating,
    genres: tmdbMeta.genres,
    type: tmdbMeta.type,
    servers: servers.map(s => ({ name: s.nombre, url: s.url })),
    episodes
  });
}
