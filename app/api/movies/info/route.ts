import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const tmdbDatabase: Record<string, any> = {
  'dune-part-two': {
    title: 'Dune Parte 2',
    type: 'Película',
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
    synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
    rating: '4.9',
    genres: ['Ciencia Ficción', 'Aventura']
  },
  'deadpool-and-wolverine': {
    title: 'Deadpool y Wolverine',
    type: 'Película',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
    synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible han quedado atrás.',
    rating: '4.8',
    genres: ['Acción', 'Comedia']
  },
  'interstellar': {
    title: 'Interestelar',
    type: 'Película',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
    synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.',
    rating: '4.9',
    genres: ['Ciencia Ficción', 'Drama']
  },
  'the-batman': {
    title: 'The Batman',
    type: 'Película',
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
    synopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City.',
    rating: '4.8',
    genres: ['Crimen', 'Misterio']
  },
  'oppenheimer': {
    title: 'Oppenheimer',
    type: 'Película',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer y el Proyecto Manhattan.',
    rating: '4.9',
    genres: ['Drama', 'Historia']
  },
  'the-last-of-us': {
    title: 'The Last of Us',
    type: 'Serie',
    poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    synopsis: 'Veinte años después de la destrucción de la civilización moderna.',
    rating: '4.9',
    genres: ['Drama', 'Acción']
  },
  'stranger-things': {
    title: 'Stranger Things',
    type: 'Serie',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio sobrenatural.',
    rating: '4.9',
    genres: ['Ciencia Ficción', 'Terror']
  },
  'breaking-bad': {
    title: 'Breaking Bad',
    type: 'Serie',
    poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    synopsis: 'Un profesor de química de secundaria con cáncer terminal se asocia con un ex alumno.',
    rating: '4.9',
    genres: ['Drama', 'Crimen']
  },
  'house-of-the-dragon': {
    title: 'La Casa del Dragón',
    type: 'Serie',
    poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
    synopsis: 'La guerra civil de los Targaryen se desata 200 años antes de Juego de Tronos.',
    rating: '4.8',
    genres: ['Fantasía', 'Drama']
  },
  'the-boys': {
    title: 'The Boys',
    type: 'Serie',
    poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
    banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
    synopsis: 'Un grupo de vigilantes se propone derribar a los superhéroes corruptos.',
    rating: '4.8',
    genres: ['Acción', 'Ciencia Ficción']
  }
};

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
      const nombre = $el.text().trim() || 'Servidor HD';
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
  const cleanId = id.toLowerCase();

  const tmdbMeta = tmdbDatabase[cleanId] || {
    title: id.replace(/-/g, ' ').toUpperCase(),
    type: 'Película',
    poster: `https://picsum.photos/seed/${cleanId}/500/750`,
    banner: `https://picsum.photos/seed/${cleanId}banner/1280/720`,
    synopsis: 'Disfruta de este título en alta calidad con múltiples servidores.',
    rating: '4.8',
    genres: ['Cine y TV']
  };

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

  // Eliminados todos los fallbacks hardcodeados con vidsrc. Si no hay servidores reales, devuelve array vacío [].
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
