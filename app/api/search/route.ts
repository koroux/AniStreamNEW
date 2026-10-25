import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

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
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([], { headers: corsHeaders });
  }

  try {
    const targetUrl = `https://tioanime.com/directorio?q=${encodeURIComponent(query)}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return NextResponse.json([], { headers: corsHeaders });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const animes: any[] = [];

    $('article').each((_, element) => {
      const $el = $(element);
      const href = $el.find('a').attr('href') || '';
      const id = href.replace('/anime/', '').replace(/^\//, '');
      const title = $el.find('.title').text().trim();
      
      let poster = $el.find('.thumb img').attr('src') || $el.find('img').attr('src') || '';
      if (poster && !poster.startsWith('http')) {
        poster = 'https://tioanime.com' + poster;
      }
      
      const type = $el.find('.anime-type-peli').text().trim() || 'TV';

      if (id && title) {
        animes.push({ id, title, poster, type, rating: '4.8' });
      }
    });

    return NextResponse.json(animes, { headers: corsHeaders });

  } catch (error) {
    console.error('Error Search API:', error);
    return NextResponse.json([], { status: 500, headers: corsHeaders });
  }
}