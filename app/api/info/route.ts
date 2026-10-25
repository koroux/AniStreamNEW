import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

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
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Falta ID' }, { status: 400, headers: corsHeaders });
  }

  const cacheKey = `anime:${id}`;

  try {
    try {
      const { data: cachedEntry } = await supabase
        .from('api_cache')
        .select('data')
        .eq('key', cacheKey)
        .single();

      if (cachedEntry && cachedEntry.data) {
        const cachedPoster = cachedEntry.data.poster || '';
        const isBadPoster = !cachedPoster || 
                            cachedPoster.includes('picsum') || 
                            cachedPoster.includes('/thumbs/') || 
                            cachedPoster.includes('logo') || 
                            cachedPoster.includes('banner') || 
                            !cachedPoster.includes('/uploads/portadas/');
        if (!isBadPoster) {
          return NextResponse.json(cachedEntry.data, { headers: corsHeaders });
        }
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
      return NextResponse.json({ error: 'Anime no encontrado' }, { status: response.status, headers: corsHeaders });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('h1.title').text().trim();
    
    if (!title) {
       return NextResponse.json({ error: 'Anime no encontrado' }, { status: 404, headers: corsHeaders });
    }

    // 1. Extraer poster directamente del HTML de la ficha del anime en TioAnime (buscar /uploads/portadas/)
    let poster = '';
    const rawPoster = $('img[src*="/uploads/portadas/"]').first().attr('src') || 
                      $('.thumb img').first().attr('src') || 
                      $('article.anime-single img[src*="/uploads/"]').first().attr('src') || 
                      '';

    if (rawPoster && !rawPoster.includes('logo') && !rawPoster.includes('banner')) {
      poster = rawPoster.startsWith('http') ? rawPoster : `https://tioanime.com${rawPoster}`;
    }

    // 2. Fallback secundario: si no vino en el HTML principal, buscar en el directorio
    if (!poster) {
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
              let p = $$(el).find('img[src*="/uploads/portadas/"]').attr('src') || 
                      $$(el).find('.thumb img').attr('src') || 
                      $$(el).find('img').attr('src') || '';
              if (p && !p.includes('logo') && !p.includes('banner')) {
                poster = p.startsWith('http') ? p : `https://tioanime.com${p}`;
              }
            }
          });
          if (!poster) {
            const firstImg = $$('article').first().find('img[src*="/uploads/portadas/"]').attr('src') || 
                             $$('article').first().find('.thumb img').attr('src') || 
                             $$('article').first().find('img').attr('src');
            if (firstImg && !firstImg.includes('logo') && !firstImg.includes('banner')) {
              poster = firstImg.startsWith('http') ? firstImg : `https://tioanime.com${firstImg}`;
            }
          }
        }
      } catch (e) {}
    }

    if (!poster || poster.includes('logo') || poster.includes('banner')) {
      poster = `https://picsum.photos/seed/${id}/300/450`;
    }

    const description = $('p.sinopsis').text().trim();
    const type = $('.anime-type-peli').first().text().trim() || 'TV';
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
        await supabase.from('api_cache').upsert({ key: cacheKey, data: animeInfo }, { onConflict: 'key' });
      }
    } catch (e) {}

    return NextResponse.json(animeInfo, { headers: corsHeaders });

  } catch (error) {
    console.error('Error Info API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: corsHeaders });
  }
}