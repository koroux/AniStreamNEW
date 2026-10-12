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
    // A. MEMORIA: Revisar Supabase primero
    try {
      const { data: cachedEntry } = await supabase
        .from('api_cache')
        .select('data')
        .eq('key', cacheKey)
        .single();

      if (cachedEntry && cachedEntry.data) {
        console.log(`⚡ CACHÉ HIT: Info recuperada para "${id}"`);
        return NextResponse.json(cachedEntry.data);
      }
    } catch (cacheErr) {
      console.warn('Cache lookup failed, proceeding to direct scraping');
    }

    // B. SCRAPING DIRECTO (Sin Proxies)
    console.log(`🌐 SCRAPING DIRECTO: Buscando info fresca para "${id}"...`);
    const targetUrl = `https://www3.animeflv.net/anime/${id}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www3.animeflv.net/'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error de conexión con la fuente' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('h1.Title').text().trim();
    
    if (!title) {
       return NextResponse.json({ error: 'Anime no encontrado' }, { status: 404 });
    }

    let poster = $('.Image figure img').attr('src') || '';
    if (poster.startsWith('/')) {
      poster = `https://www3.animeflv.net${poster}`;
    }

    const description = $('.Description p').text().trim();
    const type = $('.Type').text().trim();
    const genres = $('nav.Nvgnrs a').map((_, el) => $(el).text().trim()).get();
    const status = $('.AnmStts span').text().trim();

    const scripts = $('script').map((_, el) => $(el).html()).get();
    const scriptWithEpisodes = scripts.find(s => s?.includes('var episodes ='));
    
    let episodes: any[] = [];
    if (scriptWithEpisodes) {
      const regex = /var episodes = (\[.*?\]);/s;
      const match = scriptWithEpisodes.match(regex);
      if (match && match[1]) {
        try {
          const rawEpisodes = JSON.parse(match[1]);
          episodes = rawEpisodes.map((ep: any[]) => ({
            number: ep[0],
            id: ep[1]
          })).reverse();
        } catch(e) {}
      }
    }

    const animeInfo = { id, title, poster, description, type, genres, status, episodes };

    // C. GUARDADO EN SUPABASE
    if (episodes.length > 0) {
      try {
        await supabase.from('api_cache').insert({ key: cacheKey, data: animeInfo });
        console.log(`💾 INFO GUARDADA: "${id}" en Supabase.`);
      } catch (insertErr) {
        console.warn('Cache insert failed:', insertErr);
      }
    }

    return NextResponse.json(animeInfo);

  } catch (error) {
    console.error('Error Info API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}