import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeId = searchParams.get('id');
  const epNumber = searchParams.get('ep');

  if (!animeId || !epNumber) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  try {
    const targetUrl = `https://tioanime.com/ver/${animeId}-${epNumber}`;
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Episodio no encontrado' }, { status: 503 });
    }

    const html = await response.text();
    const match = html.match(/var videos = (\[.*?\]);/s);

    if (!match || !match[1]) {
      return NextResponse.json({ error: 'No se encontraron videos' }, { status: 404 });
    }

    const rawServers = JSON.parse(match[1]);
    
    const servers = rawServers
      .map((s: any) => {
        let cleanUrl = s[1];
        if (cleanUrl.includes('<iframe')) {
          const srcMatch = cleanUrl.match(/src="([^"]+)"/);
          if (srcMatch && srcMatch[1]) cleanUrl = srcMatch[1];
        }
        return {
          name: s[0],
          url: cleanUrl
        };
      })
      // Filtramos servidores como Mega que requieren redirección o pestaña nueva y no se prestan para iframe limpio
      .filter((s: any) => !s.name.toLowerCase().includes('mega') && s.url.startsWith('http'));

    return NextResponse.json({ servers });

  } catch (error) {
    console.error('Error Video API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}