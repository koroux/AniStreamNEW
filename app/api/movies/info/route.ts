import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const cleanId = id.toLowerCase();

  const isSerieRequested = cleanId.includes('serie') || cleanId.includes('last-of-us') || cleanId.includes('stranger') || cleanId.includes('breaking') || cleanId.includes('dragon') || cleanId.includes('boys') || cleanId.includes('game-of-thrones') || cleanId.includes('chernobyl') || cleanId.includes('succession');

  const titleMap: Record<string, string> = {
    'dune-part-two': 'Duna Parte Dos',
    'deadpool-and-wolverine': 'Deadpool y Wolverine',
    'interstellar': 'Interestelar',
    'the-batman': 'The Batman',
    'oppenheimer': 'Oppenheimer',
    'the-last-of-us': 'The Last of Us',
    'stranger-things': 'Stranger Things',
    'breaking-bad': 'Breaking Bad',
    'house-of-the-dragon': 'La Casa del Dragon',
    'the-boys': 'The Boys',
    'spider-man-across-the-spider-verse': 'Spider-Man Across the Spider-Verse',
    'avatar-the-way-of-water': 'Avatar El camino del agua',
    'john-wick-4': 'John Wick 4',
    'guardians-of-the-galaxy-vol-3': 'Guardianes de la Galaxia Vol 3',
    'barbie': 'Barbie',
    'inception': 'El Origen',
    'the-dark-knight': 'The Dark Knight',
    'game-of-thrones': 'Juego de Tronos',
    'chernobyl': 'Chernobyl',
    'succession': 'Succession'
  };

  const movieTitle = titleMap[cleanId] || id.replace(/-/g, ' ');

  let scrapedServers: any[] = [];
  let scrapedPoster = '';
  let scrapedBanner = '';
  let scrapedSynopsis = '';
  let scrapedTitle = id.replace(/-/g, ' ').toUpperCase();
  let detailUrl = '';

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
      
      // Buscar el resultado que coincida estrictamente con Película o Serie según corresponda
      $s('article, .item, .post-item').each((_, el) => {
        const $el = $s(el);
        const link = $el.find('a').attr('href') || '';
        const isLinkSerie = link.includes('/serie/') || link.includes('/series/');

        if (detailUrl) return; // Ya encontrado

        if (isSerieRequested && isLinkSerie) {
          detailUrl = link;
        } else if (!isSerieRequested && !isLinkSerie) {
          detailUrl = link;
        }
      });

      // Si no hubo coincidencia estricta, tomamos el primer resultado disponible
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

          $d('iframe, [data-video], .server-item, .enlace-server, li[data-server], .options li').each((_, el) => {
            const $el = $d(el);
            const src = $el.attr('src') || $el.attr('data-video') || $el.attr('data-url') || '';
            const text = $el.text().trim() || $el.attr('title') || 'Servidor CineCalidad';

            if (src && (src.includes('voe') || src.includes('dood') || src.includes('vimeo') || src.includes('embed') || src.includes('player') || src.includes('cinecalidad'))) {
              let name = 'Servidor HD Latino';
              const lowerText = text.toLowerCase();
              const lowerSrc = src.toLowerCase();

              if (lowerSrc.includes('voe') || lowerText.includes('voe')) name = 'Voe (CineCalidad Latino)';
              else if (lowerSrc.includes('dood') || lowerText.includes('dood')) name = 'Doodstream (1080p)';
              else if (lowerSrc.includes('vimeo') || lowerText.includes('vimeo')) name = 'Vimeos (HD Latino)';
              
              if (!scrapedServers.some(s => s.url === src)) {
                scrapedServers.push({ name, url: src });
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scraping CineCalidad detail:', err);
  }

  if (detailUrl) {
    scrapedServers.unshift({
      name: 'Servidor Oficial CineCalidad (Directo)',
      url: detailUrl
    });
  }

  if (scrapedServers.length === 0) {
    scrapedServers = [
      { name: 'Servidor Oficial CineCalidad', url: 'https://www.cinecalidad.am/' }
    ];
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
    synopsis: scrapedSynopsis || 'Disfruta de este título en alta calidad con los servidores oficiales extraídos de CineCalidad en español latino.',
    rating: '4.9',
    genres: ['Cine y TV'],
    type: isSerieRequested ? 'Serie' : 'Película',
    servers: scrapedServers,
    episodes
  });
}
