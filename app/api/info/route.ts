import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  const cacheKey = `anime:${id}`;

  try {
    try {
      const { data: cachedEntry } = await supabase
        .from('api_cache')
        .select('data')
        .eq('key', cacheKey)
        .single();

      if (cachedEntry && cachedEntry.data) {
        return NextResponse.json(cachedEntry.data);
      }
    } catch (cacheErr) {}

    const targetUrl = `https://tioanime.com/anime/${id}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Anime no encontrado' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('h1.title').text().trim();
    
    if (!title) {
       return NextResponse.json({ error: 'Anime no encontrado' }, { status: 404 });
    }

    let poster = '';
    try {
      const searchRes = await fetch(`https://tioanime.com/directorio?q=${encodeURIComponent(id)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(4000)
      });
      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const $$ = cheerio.load(searchHtml);
        $$('article').each((_, el) => {
          const href = $$(el).find('a').attr('href') || '';
          if (href.includes(id)) {
            let p = $$(el).find('.thumb img').attr('src') || $$(el).find('img').attr('src') || '';
            if (p) {
              poster = p.startsWith('http') ? p : `https://tioanime.com${p}`;
            }
          }
        });
        if (!poster) {
          const firstImg = $$('article').first().find('.thumb img').attr('src');
          if (firstImg) {
            poster = firstImg.startsWith('http') ? firstImg : `https://tioanime.com${firstImg}`;
          }
        }
      }
    } catch (e) {}

    if (!poster || poster.includes('logo') || poster.includes('banner')) {
      poster = `https://picsum.photos/seed/${id}/300/450`;
    }

    const description = $('p.sinopsis').text().trim();
    const type = $('.anime-type-peli').text().trim() || 'TV';
    const genres = $('p.genres a').map((_, el) => $(el).text().trim()).get();
    const status = $('.status').text().trim() || 'En emisión';

    const scripts = $('script').map((_, el) => $(el).html()).get();
    const scriptWithInfo = scripts.find(s => s && s.includes('var episodes ='));
    
    let episodes: any[] = [];
    if (scriptWithInfo) {
      const regex = /var episodes = (\[.*?\]);/s;
      const match = scriptWithInfo.match(regex);
      if (match && match[1]) {
        try {
          const rawEpisodes = JSON.parse(match[1]);
          episodes = rawEpisodes.map((epNum: any) => ({
            number: epNum,
            id: `${id}-${epNum}`
          })).reverse();
        } catch(e) {}
      }
    }

    const animeInfo = { id, title, poster, description, type, genres, status, episodes };

    try {
      if (episodes.length > 0) {
        await supabase.from('api_cache').insert({ key: cacheKey, data: animeInfo });
      }
    } catch (e) {}

    return NextResponse.json(animeInfo);

  } catch (error) {
    console.error('Error Info API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}