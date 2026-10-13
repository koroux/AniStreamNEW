import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function extractDirectStream(serverName: string, embedUrl: string): Promise<string | null> {
  const normalized = serverName.toLowerCase();

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://tioanime.com/'
    };

    // 1. VOE Extractor (busca hls .m3u8 o mp4 en el script interno)
    if (normalized.includes('voe') || embedUrl.includes('voe.sx')) {
      const res = await fetch(embedUrl, { headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const text = await res.text();
        const hlsMatch = text.match(/'hls':\s*'([^']+)'/) || text.match(/"hls":\s*"([^"]+)"/);
        if (hlsMatch && hlsMatch[1]) return hlsMatch[1];
        
        const mp4Match = text.match(/'mp4':\s*'([^']+)'/) || text.match(/"mp4":\s*"([^"]+)"/);
        if (mp4Match && mp4Match[1]) return mp4Match[1];
      }
    }

    // 2. YourUpload Extractor (busca file: 'https://...mp4' en jwplayer)
    if (normalized.includes('yourupload') || embedUrl.includes('yourupload.com')) {
      const res = await fetch(embedUrl, { headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const text = await res.text();
        const fileMatch = text.match(/file:\s*'([^']+\.mp4[^']*)'/i) || text.match(/file:\s*"([^"]+\.mp4[^"]*)"/i);
        if (fileMatch && fileMatch[1]) return fileMatch[1];
      }
    }

    // 3. Si el enlace ya es directo .m3u8 o .mp4
    if (embedUrl.includes('.m3u8') || embedUrl.endsWith('.mp4')) {
      return embedUrl;
    }

  } catch (err) {
    // Si falla la extracción, el backend continúa sin romper la app
  }

  return null;
}

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
    
    // Procesamos cada servidor y tratamos de extraer el stream directo (.m3u8 / .mp4)
    const servers = await Promise.all(
      rawServers
        .filter((s: any) => !s[0].toLowerCase().includes('mega') && s[1])
        .map(async (s: any) => {
          let cleanUrl = s[1];
          if (cleanUrl.includes('<iframe')) {
            const srcMatch = cleanUrl.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) cleanUrl = srcMatch[1];
          }

          const directStream = await extractDirectStream(s[0], cleanUrl);

          return {
            name: s[0],
            embedUrl: cleanUrl,
            url: directStream || cleanUrl,
            isDirect: Boolean(directStream)
          };
        })
    );

    return NextResponse.json({ servers });

  } catch (error) {
    console.error('Error Video API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}