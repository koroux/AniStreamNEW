import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface TMDBMetaResult {
  title: string;
  title_es: string;
  title_original: string;
  candidate_titles: string[];
  year: string;
  type: 'Película' | 'Serie';
  poster: string;
  banner: string;
  synopsis: string;
  rating: string;
  genres: string[];
  tmdbId: number;
}

interface CineCalidadCandidate {
  url: string;
  cardTitle: string;
  cardYear: string;
  isCardSerie: boolean;
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'the', 'of', 'and', 'y', 'en', 'a', 'to',
  'in', 'for', 'con', 'por', 'o', 'al'
]);

function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function cleanForSearch(str: string): string {
  return (str || '')
    .replace(/[:.,;!?()"'¡¿\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTranslations(detail: any): string[] {
  const transList = detail.translations?.translations || [];
  return transList
    .filter((t: any) => t.iso_639_1 === 'es')
    .map((t: any) => t.data?.title || t.data?.name)
    .filter(Boolean);
}

function formatMovieMeta(detail: any): TMDBMetaResult {
  const titleEs = detail.title || 'Sin título';
  const titleOriginal = detail.original_title || '';
  const latamTitles = extractTranslations(detail);
  const candidateTitles = Array.from(new Set([titleEs, titleOriginal, ...latamTitles])).filter(Boolean);

  return {
    title: titleEs,
    title_es: titleEs,
    title_original: titleOriginal,
    candidate_titles: candidateTitles,
    year: (detail.release_date || '').substring(0, 4),
    type: 'Película',
    poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : '',
    banner: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : (detail.poster_path ? `https://image.tmdb.org/t/p/w1280${detail.poster_path}` : ''),
    synopsis: detail.overview || 'Sinopsis no disponible.',
    rating: typeof detail.vote_average === 'number' ? detail.vote_average.toFixed(1) : '0.0',
    genres: Array.isArray(detail.genres) ? detail.genres.map((g: any) => g.name) : [],
    tmdbId: detail.id
  };
}

function formatTvMeta(detail: any): TMDBMetaResult {
  const titleEs = detail.name || 'Sin título';
  const titleOriginal = detail.original_name || '';
  const latamTitles = extractTranslations(detail);
  const candidateTitles = Array.from(new Set([titleEs, titleOriginal, ...latamTitles])).filter(Boolean);

  return {
    title: titleEs,
    title_es: titleEs,
    title_original: titleOriginal,
    candidate_titles: candidateTitles,
    year: (detail.first_air_date || '').substring(0, 4),
    type: 'Serie',
    poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : '',
    banner: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : (detail.poster_path ? `https://image.tmdb.org/t/p/w1280${detail.poster_path}` : ''),
    synopsis: detail.overview || 'Sinopsis no disponible.',
    rating: typeof detail.vote_average === 'number' ? detail.vote_average.toFixed(1) : '0.0',
    genres: Array.isArray(detail.genres) ? detail.genres.map((g: any) => g.name) : [],
    tmdbId: detail.id
  };
}

function slugSimilarity(title: string, slug: string): number {
  if (!slug) return 0;
  const normTitle = normalizeStr(title).replace(/\s+/g, '-');
  const normSlug = normalizeStr(slug.replace(/-/g, ' ')).replace(/\s+/g, '-');
  if (normTitle === normSlug) return 100;
  if (normTitle.includes(normSlug) || normSlug.includes(normTitle)) return 50;
  const tTokens = new Set(normTitle.split('-').filter(Boolean));
  const sTokens = new Set(normSlug.split('-').filter(Boolean));
  const common = Array.from(tTokens).filter(t => sTokens.has(t));
  return common.length * 10;
}

async function fetchTMDBMetaRaw(idOrSlug: string): Promise<TMDBMetaResult | null> {
  const token = process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error('TMDB_READ_TOKEN is not configured');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  try {
    // 1. Detectar tipo explícito al inicio: /^(movie|tv)-(\d+)(?:-|$)/
    const typedMatch = idOrSlug.match(/^(movie|tv)-(\d+)(?:-|$)/);
    if (typedMatch) {
      const mediaType = typedMatch[1]; // 'movie' | 'tv'
      const directTmdbId = parseInt(typedMatch[2], 10);

      if (mediaType === 'movie') {
        const movieRes = await fetch(
          `https://api.themoviedb.org/3/movie/${directTmdbId}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        );
        if (movieRes.ok) {
          const detail = await movieRes.json();
          return formatMovieMeta(detail);
        }
        return null;
      } else {
        const tvRes = await fetch(
          `https://api.themoviedb.org/3/tv/${directTmdbId}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        );
        if (tvRes.ok) {
          const detail = await tvRes.json();
          return formatTvMeta(detail);
        }
        return null;
      }
    }

    // 2. Fallback para IDs numéricos sin prefijo (URLs viejas tipo "44006-chicago-fire" o "238-el-padrino")
    const legacyMatch = idOrSlug.match(/^(\d+)(?:-(.*))?$/);
    if (legacyMatch) {
      const directTmdbId = parseInt(legacyMatch[1], 10);
      const slug = legacyMatch[2] || '';

      const [movieRes, tvRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/${directTmdbId}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/${directTmdbId}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        )
      ]);

      const movieDetail = movieRes.ok ? await movieRes.json() : null;
      const tvDetail = tvRes.ok ? await tvRes.json() : null;

      // Si ambos existen y viene slug, comparar cuál coincide mejor con el slug
      if (movieDetail && tvDetail && slug) {
        const movieScore = Math.max(
          slugSimilarity(movieDetail.title || '', slug),
          slugSimilarity(movieDetail.original_title || '', slug)
        );
        const tvScore = Math.max(
          slugSimilarity(tvDetail.name || '', slug),
          slugSimilarity(tvDetail.original_name || '', slug)
        );
        if (tvScore > movieScore) {
          return formatTvMeta(tvDetail);
        }
        return formatMovieMeta(movieDetail);
      }

      if (movieDetail) return formatMovieMeta(movieDetail);
      if (tvDetail) return formatTvMeta(tvDetail);
    }

    // 3. Fallback: Búsqueda por texto si no viene prefijo numérico (ej: "el-padrino")
    const query = idOrSlug.replace(/-/g, ' ');

    const movieSearchRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=es-ES`,
      { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
    );

    if (movieSearchRes.ok) {
      const movieData = await movieSearchRes.json();
      if (movieData.results && movieData.results.length > 0) {
        const topResult = movieData.results[0];
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${topResult.id}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          return formatMovieMeta(detail);
        }
      }
    }

    const tvSearchRes = await fetch(
      `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=es-ES`,
      { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
    );

    if (tvSearchRes.ok) {
      const tvData = await tvSearchRes.json();
      if (tvData.results && tvData.results.length > 0) {
        const topResult = tvData.results[0];
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/tv/${topResult.id}?language=es-ES&append_to_response=translations`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          return formatTvMeta(detail);
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Error in fetchTMDBMeta:', err);
    throw err;
  }
}

const getCachedTMDBMeta = unstable_cache(
  async (idOrSlug: string) => fetchTMDBMetaRaw(idOrSlug),
  ['movies-info-tmdb-meta'],
  { revalidate: 3600 }
);

const getCachedTVSeasons = unstable_cache(
  async (tvTmdbId: number) => {
    const token = process.env.TMDB_READ_TOKEN;
    if (!token) return [];

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${tvTmdbId}?language=es-ES`, {
      headers,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 }
    });

    if (!tvRes.ok) return [];

    const tvJson = await tvRes.json();
    const validSeasons = (tvJson.seasons || []).filter(
      (s: any) => s.season_number > 0 && s.episode_count > 0
    );

    const seasonPromises = validSeasons.map(async (s: any) => {
      try {
        const sRes = await fetch(
          `https://api.themoviedb.org/3/tv/${tvTmdbId}/season/${s.season_number}?language=es-ES`,
          { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        );

        if (!sRes.ok) return null;
        const sJson = await sRes.json();

        return {
          seasonNumber: s.season_number,
          name: s.name || `Temporada ${s.season_number}`,
          episodeCount: s.episode_count,
          poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '',
          episodes: (sJson.episodes || []).map((ep: any) => ({
            episodeNumber: ep.episode_number,
            seasonNumber: s.season_number,
            title: ep.name || `Episodio ${ep.episode_number}`,
            synopsis: ep.overview || '',
            still: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : '',
            runtime: ep.runtime || 0,
            airDate: ep.air_date || ''
          }))
        };
      } catch (seasonErr) {
        console.error(`Error fetching season ${s.season_number}:`, seasonErr);
        return null;
      }
    });

    const resolvedSeasons = await Promise.all(seasonPromises);
    return resolvedSeasons.filter(Boolean);
  },
  ['movies-info-tv-seasons'],
  { revalidate: 3600 }
);

function scoreMatch(
  queryTitles: string[],
  cardTitle: string,
  queryYear: string,
  cardYear: string,
  isSerie: boolean,
  cardIsSerie: boolean
): number {
  // Solo permitir matches del mismo tipo (película con película, serie con serie)
  if (isSerie !== cardIsSerie) return 0;

  const normCard = normalizeStr(cardTitle);
  if (!normCard) return 0;

  const cardTokens = new Set(
    normCard.split(/\s+/).filter(w => w.length > 0 && !STOPWORDS.has(w))
  );

  const yearMatch = Boolean(queryYear && cardYear && queryYear === cardYear);
  let maxScore = 0;

  for (const q of queryTitles) {
    const normQ = normalizeStr(q);
    if (!normQ) continue;

    // Coincidencia exacta del título normalizado
    if (normCard === normQ) {
      let score = 120;
      if (yearMatch) score += 40;
      score += 20; // type match
      if (score > maxScore) maxScore = score;
      continue;
    }

    const qTokens = new Set(
      normQ.split(/\s+/).filter(w => w.length > 0 && !STOPWORDS.has(w))
    );
    if (qTokens.size === 0) continue;

    const common = Array.from(qTokens).filter(t => cardTokens.has(t));
    if (common.length === 0) continue;

    let score = common.length * 10;
    if (yearMatch) score += 40;
    score += 20; // type match

    // Bonus por palabras clave largas/únicas
    for (const t of common) {
      if (t.length >= 5) score += 10;
      else if (t.length >= 4) score += 5;
    }

    // Cobertura de la consulta (recall)
    const recall = common.length / qTokens.size;
    score += Math.round(recall * 20);

    // Precisión respecto a la tarjeta (penaliza palabras sobrantes)
    const precision = cardTokens.size > 0 ? common.length / cardTokens.size : 0;
    score += Math.round(precision * 20);

    // Contención de texto completo
    if (normCard.includes(normQ) || normQ.includes(normCard)) {
      score += 15;
    }

    if (score > maxScore) maxScore = score;
  }

  return maxScore;
}

async function fetchCineCalidadSearch(query: string): Promise<CineCalidadCandidate[]> {
  const clean = cleanForSearch(query);
  if (!clean) return [];

  try {
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(clean)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': CHROME_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: CineCalidadCandidate[] = [];

    $('article').each((_, el) => {
      const $el = $(el);
      const link = $el.find('a').attr('href') || '';
      if (!link) return;

      const cardTitle =
        $el.find('img').attr('alt') ||
        $el.find('.in_title').text().trim() ||
        $el.find('h2, .title, .name').first().text().trim() ||
        '';

      const fullText = $el.text();
      const yearMatch = fullText.match(/\b(19\d{2}|20\d{2})\b/) || link.match(/\b(19\d{2}|20\d{2})\b/);
      const cardYear = yearMatch ? yearMatch[1] : '';

      const isCardSerie = link.includes('/ver-serie/') || link.includes('/ver-el-episodio/');

      results.push({
        url: link,
        cardTitle,
        cardYear,
        isCardSerie
      });
    });

    return results;
  } catch (err) {
    return [];
  }
}

async function searchMovieOnCineCalidad(
  queryTitles: string[],
  isSerie: boolean,
  queryYear: string
): Promise<string> {
  try {
    const validTitles = Array.from(new Set(queryTitles.map(t => cleanForSearch(t)).filter(Boolean)));
    if (validTitles.length === 0) return '';

    // 1. Buscar en paralelo con cada título candidato
    const searchPromises = validTitles.map(title => fetchCineCalidadSearch(title));
    const searchBatches = await Promise.all(searchPromises);

    // 2. Unificar candidatos eliminando duplicados por URL
    const candidatesMap = new Map<string, CineCalidadCandidate>();
    for (const batch of searchBatches) {
      for (const item of batch) {
        if (!candidatesMap.has(item.url)) {
          candidatesMap.set(item.url, item);
        }
      }
    }

    let allCandidates = Array.from(candidatesMap.values());
    const MATCH_THRESHOLD = 30;

    // 3. Scoring de candidatos obtenidos
    let scoredCandidates = allCandidates
      .map(c => ({
        ...c,
        score: scoreMatch(queryTitles, c.cardTitle, queryYear, c.cardYear, isSerie, c.isCardSerie)
      }))
      .filter(c => c.score >= MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    // 4. Fallback final: si ningún candidato supera el umbral, buscar por los términos más largos y únicos
    if (scoredCandidates.length === 0) {
      const allTokens = validTitles
        .flatMap(t => normalizeStr(t).split(/\s+/))
        .filter(w => w.length >= 4 && !STOPWORDS.has(w));

      const uniqueTokens = Array.from(new Set(allTokens))
        .sort((a, b) => b.length - a.length)
        .slice(0, 2);

      if (uniqueTokens.length > 0) {
        const fallbackBatches = await Promise.all(uniqueTokens.map(tok => fetchCineCalidadSearch(tok)));
        for (const batch of fallbackBatches) {
          for (const item of batch) {
            if (!candidatesMap.has(item.url)) {
              candidatesMap.set(item.url, item);
            }
          }
        }

        allCandidates = Array.from(candidatesMap.values());
        scoredCandidates = allCandidates
          .map(c => ({
            ...c,
            score: scoreMatch(queryTitles, c.cardTitle, queryYear, c.cardYear, isSerie, c.isCardSerie)
          }))
          .filter(c => c.score >= MATCH_THRESHOLD)
          .sort((a, b) => b.score - a.score);
      }
    }

    if (scoredCandidates.length === 0) {
      return '';
    }

    const bestMatch = scoredCandidates[0];
    let bestMatchUrl = bestMatch.url;

    // 5. Si es serie y el match es una página de serie (/ver-serie/), extraemos el link del primer episodio
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
            $$('.episodios a').first().attr('href') ||
            '';

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

      // Extraer solo el primer nodo de texto directo (excluir spans anidados como "Recomendado")
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';

  if (!id) {
    return NextResponse.json({ error: 'ID o slug requerido' }, { status: 400, headers: corsHeaders });
  }

  let tmdbMeta: TMDBMetaResult | null = null;
  try {
    tmdbMeta = await getCachedTMDBMeta(id);
  } catch (err) {
    return NextResponse.json({ error: 'Error conectando con TMDB' }, { status: 500, headers: corsHeaders });
  }

  if (!tmdbMeta) {
    return NextResponse.json({ error: 'Título no encontrado en TMDB' }, { status: 404, headers: corsHeaders });
  }

  const isSerie = tmdbMeta.type === 'Serie';
  let servers: Array<{ nombre: string; url: string }> = [];

  try {
    const candidateTitles = tmdbMeta.candidate_titles && tmdbMeta.candidate_titles.length > 0
      ? tmdbMeta.candidate_titles
      : [tmdbMeta.title_es, tmdbMeta.title_original, tmdbMeta.title].filter(Boolean);

    const detailUrl = await searchMovieOnCineCalidad(candidateTitles, isSerie, tmdbMeta.year);

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

  let seasonsData: any[] = [];
  if (isSerie && tmdbMeta.tmdbId) {
    try {
      seasonsData = await getCachedTVSeasons(tmdbMeta.tmdbId);
    } catch (seriesErr) {
      console.error('Error fetching series seasons from TMDB:', seriesErr);
    }
  }

  const responsePayload: any = {
    id,
    title: tmdbMeta.title,
    title_es: tmdbMeta.title_es,
    title_original: tmdbMeta.title_original,
    poster: tmdbMeta.poster,
    banner: tmdbMeta.banner,
    synopsis: tmdbMeta.synopsis,
    rating: tmdbMeta.rating,
    genres: tmdbMeta.genres,
    type: tmdbMeta.type,
    servers: servers.map(s => ({ name: s.nombre, url: s.url }))
  };

  if (isSerie) {
    responsePayload.seasons = seasonsData;
  }

  return NextResponse.json(responsePayload, { headers: corsHeaders });
}
