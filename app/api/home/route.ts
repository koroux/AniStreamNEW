import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

async function scrapeList(urlTarget: string) {
  try {
    const response = await fetch(urlTarget, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return [];

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
      
      const type = $el.find('.anime-type-peli').text().trim() || 'TV';

      if (id && title) {
        animes.push({ id, title, poster, type, rating: '4.8' });
      }
    });

    return animes;
  } catch (error) {
    console.error(`Error scraping ${urlTarget}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const trending = await scrapeList('https://tioanime.com/directorio?status=1&sort=recent');
    const newReleases = await scrapeList('https://tioanime.com/directorio?sort=recent');
    const classics = await scrapeList('https://tioanime.com/directorio?status=2&sort=-recent');

    return NextResponse.json({
      trending: trending.slice(0, 10),
      newReleases: newReleases.slice(0, 10),
      classics: classics.slice(0, 10)
    });
  } catch (error) {
    console.error('Error home API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}