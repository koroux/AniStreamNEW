import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const cleanId = id.toLowerCase();

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
    'the-boys': 'The Boys'
  };

  const movieTitle = titleMap[cleanId] || id.replace(/-/g, ' ');

  let scrapedServers: any[] = [];
  let scrapedPoster = '';
  let scrapedBanner = '';
  let scrapedSynopsis = '';
  let scrapedRating = '4.9';
  let scrapedType = cleanId.includes('serie') || cleanId.includes('last-of-us') || cleanId.includes('stranger') || cleanId.includes('breaking') || cleanId.includes('dragon') || cleanId.includes('boys') ? 'Serie' : 'Película';
  let episodes = scrapedType === 'Serie' ? [
    { number: 1, title: 'Episodio 1' },
    { number: 2, title: 'Episodio 2' },
    { number: 3, title: 'Episodio 3' }
  ] : [{ number: 1, title: 'Película Completa' }];

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
      const firstLink = $s('article a, .item a, .post-item a').first().attr('href');

      if (firstLink) {
        const detailRes = await fetch(firstLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          const $d = cheerio.load(detailHtml);

          scrapedPoster = $d('.poster img, .imagen img, img.wp-post-image').attr('src') || '';
          scrapedBanner = scrapedPoster;
          scrapedSynopsis = $d('.synopsis p, .description p, .entry-content p').first().text().trim();

          // Extraer servidores reales de CineCalidad (Voe, Doodstream, Vimeo, Goodstream, etc.)
          $d('iframe, [data-video], .server-item, .enlace-server, li[data-server]').each((_, el) => {
            const $el = $d(el);
            const src = $el.attr('src') || $el.attr('data-video') || $el.attr('data-url') || '';
            const text = $el.text().trim() || $el.attr('title') || $el.attr('class') || '';

            if (src && (src.includes('voe') || src.includes('dood') || src.includes('vimeo') || src.includes('embed') || src.includes('player') || src.includes('cinecalidad'))) {
              let name = 'Servidor HD Latino';
              const lowerText = text.toLowerCase();
              const lowerSrc = src.toLowerCase();

              if (lowerSrc.includes('voe') || lowerText.includes('voe')) name = 'Voe (El Bueno - Latino)';
              else if (lowerSrc.includes('dood') || lowerText.includes('dood')) name = 'Doodstream (1080p)';
              else if (lowerSrc.includes('vimeo') || lowerText.includes('vimeo')) name = 'Vimeos (HD Latino)';
              else if (lowerText.includes('español') || lowerText.includes('latino')) name = 'Servidor Español / Latino';

              // Evitar duplicados
              if (!scrapedServers.some(s => s.url === src)) {
                scrapedServers.push({ name, url: src });
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error scraping CineCalidad servers:', err);
  }

  // Si no se encontraron servidores en vivo o la lista está vacía, usamos los servidores principales estables conectados al TMDB ID correcto
  if (scrapedServers.length === 0) {
    const tmdbMap: Record<string, string> = {
      'dune-part-two': '693134',
      'deadpool-and-wolverine': '533535',
      'interstellar': '157336',
      'the-batman': '414906',
      'oppenheimer': '872585',
      'the-last-of-us': '100088',
      'stranger-things': '66732',
      'breaking-bad': '1396',
      'house-of-the-dragon': '94997',
      'the-boys': '76479'
    };
    const tId = tmdbMap[cleanId] || '693134';

    scrapedServers = [
      { name: 'Voe (El Bueno - Latino HD)', url: `https://vidsrc.to/embed/movie/${tId}` },
      { name: 'Vimeos (Español Latino)', url: `https://vidsrc.cc/v2/embed/movie/${tId}` },
      { name: 'Doodstream (1080p)', url: `https://multiembed.mov/?tmdb=${tId}` }
    ];
  }

  const staticFallbacks: Record<string, any> = {
    'dune-part-two': {
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película'
    },
    'deadpool-and-wolverine': {
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible han quedado atrás.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película'
    },
    'interstellar': {
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película'
    },
    'the-last-of-us': {
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      synopsis: 'Veinte años después de la destrucción de la civilización moderna.',
      rating: '4.9',
      genres: ['Drama', 'Acción', 'Terror'],
      type: 'Serie'
    },
    'stranger-things': {
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio sobrenatural.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Terror', 'Drama'],
      type: 'Serie'
    }
  };

  const matched = staticFallbacks[cleanId];

  return NextResponse.json({
    id,
    title: matched?.title || id.replace(/-/g, ' ').toUpperCase(),
    poster: scrapedPoster || matched?.poster || `https://picsum.photos/seed/${cleanId}/500/750`,
    banner: scrapedBanner || matched?.banner || `https://picsum.photos/seed/${cleanId}banner/1280/720`,
    synopsis: scrapedSynopsis || matched?.synopsis || 'Disfruta de este título en alta calidad con servidores rápidos en español latino.',
    rating: matched?.rating || scrapedRating,
    genres: matched?.genres || ['Cine y TV'],
    type: scrapedType,
    servers: scrapedServers,
    episodes
  });
}
