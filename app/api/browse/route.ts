import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre') || 'all';
  const order = searchParams.get('order') || 'recent';
  const page = searchParams.get('page') || '1';

  try {
    let targetUrl = `https://tioanime.com/directorio?sort=${order}&p=${page}`;
    if (genre !== 'all') {
      targetUrl += `&genero%5B%5D=${genre}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return NextResponse.json([]);

    const html = await response.text();
    const $ = cheerio.load(html);
    const animes: any[] = [];

    $('article').each((_, element) => {
      const $el = $(element);
      const href = $el.find('a').attr('href') || '';
      const id = href.replace('/anime/', '').replace(/^\//, '');
      const title = $el.find('.title').text().trim();
      let poster = $el.find('img').attr('src') || '';
      if (poster && !poster.startsWith('http')) {
        poster = 'https://tioanime.com' + poster;
      }
      if (!poster || poster.includes('logo') || poster.includes('banner')) {
        poster = `https://tioanime.com/uploads/thumbs/${id}.jpg`;
      }
      const type = $el.find('.anime-type-peli').text().trim() || 'TV';

      if (id && title) {
        animes.push({ id, title, poster, type, rating: '4.8' });
      }
    });

    // Extraer número total de páginas de la paginación si existe
    let totalPages = 1;
    $('.pagination .page-item a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const pMatch = href.match(/p=(\d+)/);
      if (pMatch && pMatch[1]) {
        const pNum = parseInt(pMatch[1], 10);
        if (pNum > totalPages) totalPages = pNum;
      }
    });

    return NextResponse.json({
      animes,
      currentPage: parseInt(page, 10) || 1,
      totalPages: Math.max(totalPages, 1),
      hasMore: animes.length > 0 && (parseInt(page, 10) || 1) < totalPages
    });

  } catch (error) {
    console.error('Error browse API:', error);
    return NextResponse.json({ error: 'Error filtrando animes' }, { status: 500 });
  }
}