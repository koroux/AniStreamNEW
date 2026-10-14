import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const cleanId = id.toLowerCase();

  const isSerieRequested = cleanId.includes('serie') || cleanId.includes('last-of-us') || cleanId.includes('stranger') || cleanId.includes('breaking') || cleanId.includes('dragon') || cleanId.includes('boys') || cleanId.includes('game-of-thrones') || cleanId.includes('chernobyl') || cleanId.includes('succession');

  const titleMap: Record<string, { title: string; tmdb: string }> = {
    'dune-part-two': { title: 'Duna Parte Dos', tmdb: '693134' },
    'deadpool-and-wolverine': { title: 'Deadpool y Wolverine', tmdb: '533535' },
    'interstellar': { title: 'Interestelar', tmdb: '157336' },
    'the-batman': { title: 'The Batman', tmdb: '414906' },
    'oppenheimer': { title: 'Oppenheimer', tmdb: '872585' },
    'the-last-of-us': { title: 'The Last of Us', tmdb: '100088' },
    'stranger-things': { title: 'Stranger Things', tmdb: '66732' },
    'breaking-bad': { title: 'Breaking Bad', tmdb: '1396' },
    'house-of-the-dragon': { title: 'La Casa del Dragon', tmdb: '94997' },
    'the-boys': { title: 'The Boys', tmdb: '76479' },
    'spider-man-across-the-spider-verse': { title: 'Spider-Man Across the Spider-Verse', tmdb: '569094' },
    'avatar-the-way-of-water': { title: 'Avatar El camino del agua', tmdb: '76600' },
    'john-wick-4': { title: 'John Wick 4', tmdb: '603692' },
    'guardians-of-the-galaxy-vol-3': { title: 'Guardianes de la Galaxia Vol 3', tmdb: '447365' },
    'barbie': { title: 'Barbie', tmdb: '346698' },
    'inception': { title: 'El Origen', tmdb: '27205' },
    'the-dark-knight': { title: 'The Dark Knight', tmdb: '155' },
    'game-of-thrones': { title: 'Juego de Tronos', tmdb: '1399' },
    'chernobyl': { title: 'Chernobyl', tmdb: '87108' },
    'succession': { title: 'Succession', tmdb: '81329' }
  };

  const itemMeta = titleMap[cleanId] || { title: id.replace(/-/g, ' '), tmdb: '693134' };
  const movieTitle = itemMeta.title;
  const tmdbId = itemMeta.tmdb;

  let scrapedServers: any[] = [];
  let scrapedPoster = '';
  let scrapedBanner = '';
  let scrapedSynopsis = '';
  let scrapedTitle = movieTitle.toUpperCase();

  try {
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(movieTitle)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (searchRes.ok) {
      const searchHtml = await searchRes.text();
      const $s = cheerio.load(searchHtml);
      let detailUrl = '';
      
      // Buscar coincidencia estricta de tipo
      $s('article, .item, .post-item').each((_, el) => {
        const $el = $s(el);
        const link = $el.find('a').attr('href') || '';
        const isLinkSerie = link.includes('/serie/') || link.includes('/series/');

        if (detailUrl) return;

        if (isSerieRequested && isLinkSerie) {
          detailUrl = link;
        } else if (!isSerieRequested && !isLinkSerie) {
          detailUrl = link;
        }
      });

      if (!detailUrl) {
        detailUrl = $s('article a, .item a, .post-item a').first().attr('href') || '';
      }
      
      if (detailUrl) {
        const detailRes = await fetch(detailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://www.cinecalidad.am/'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          const $d = cheerio.load(detailHtml);

          scrapedTitle = $d('h1').first().text().trim() || scrapedTitle;
          scrapedPoster = $d('.poster img, .imagen img, img.wp-post-image').attr('src') || '';
          scrapedBanner = scrapedPoster;
          scrapedSynopsis = $d('.synopsis p, .description p, .entry-content p').first().text().trim();

          // Extraer ÚNICAMENTE IFRAMES O ENLACES DE REPRODUCTORES (Hlswish, Voe, Doodstream, etc.)
          $d('iframe, [data-video], .server-item, .enlace-server, li[data-server], .options li').each((_, el) => {
            const $el = $d(el);
            const src = $el.attr('src') || $el.attr('data-video') || $el.attr('data-url') || '';
            const text = $el.text().trim() || $el.attr('title') || '';

            if (src && (src.includes('voe') || src.includes('dood') || src.includes('vimeo') || src.includes('hlswish') || src.includes('embed') || src.includes('player') || src.includes('stream'))) {
              let name = 'Servidor HD Latino';
              const lowerText = text.toLowerCase();
              const lowerSrc = src.toLowerCase();

              if (lowerSrc.includes('voe') || lowerText.includes('voe')) name = 'Voe (CineCalidad Latino)';
              else if (lowerSrc.includes('dood') || lowerText.includes('dood')) name = 'Doodstream (1080p)';
              else if (lowerSrc.includes('vimeo') || lowerSrc.includes('hlswish') || lowerText.includes('vimeo') || lowerText.includes('hlswish')) name = 'Hlswish / Vimeos';
              
              const finalSrc = src.startsWith('http') ? src : 'https:' + src;
              if (!scrapedServers.some(s => s.url === finalSrc)) {
                scrapedServers.push({ name, url: finalSrc });
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scraping CineCalidad iframes:', err);
  }

  // Respaldos de servidores de video limpios garantizados por TMDB ID
  const reliableServers = isSerieRequested ? [
    { name: 'Voe (Oficial Latino)', url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=1&episode=1` },
    { name: 'Hlswish / Vimeos', url: `https://multiembed.mov/?tmdb=${tmdbId}&s=1&e=1` },
    { name: 'Doodstream (1080p)', url: `https://player.vidsrc.net/embed/tv/${tmdbId}/1/1` }
  ] : [
    { name: 'Voe (Oficial Latino)', url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}` },
    { name: 'Hlswish / Vimeos', url: `https://multiembed.mov/?tmdb=${tmdbId}` },
    { name: 'Doodstream (1080p)', url: `https://player.vidsrc.net/embed/movie/${tmdbId}` }
  ];

  for (const srv of reliableServers) {
    if (!scrapedServers.some(s => s.name === srv.name)) {
      scrapedServers.push(srv);
    }
  }

  const episodes = isSerieRequested ? [
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
    title: scrapedTitle,
    poster: scrapedPoster || `https://picsum.photos/seed/${cleanId}/500/750`,
    banner: scrapedBanner || `https://picsum.photos/seed/${cleanId}banner/1280/720`,
    synopsis: scrapedSynopsis || 'Disfruta de este título en alta calidad con servidores rápidos en español latino.',
    rating: '4.9',
    genres: ['Cine y TV'],
    type: isSerieRequested ? 'Serie' : 'Película',
    servers: scrapedServers,
    episodes
  });
}
