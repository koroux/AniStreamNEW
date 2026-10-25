import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

async function extractDirectStream(serverName: string, embedUrl: string): Promise<string | null> {
  const normalized = serverName.toLowerCase();

  try {
    // 1. VOE Extractor usando stream-bypass o decodificador integrado
    if (normalized.includes('voe') || embedUrl.includes('voe.sx')) {
      // Intento usando stream-bypass con try/catch
      try {
        const { extract } = require('stream-bypass');
        const directUrl = await extract(embedUrl);
        if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
          return directUrl;
        }
      } catch (sbError) {
        // Si stream-bypass falla, continúa con el fallback
      }
      const voeHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://voe.sx/'
      };

      const res = await fetch(embedUrl, { headers: voeHeaders, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        let text = await res.text();

        // Si Voe usa redirección por script (window.location.href = '...')
        const redirectMatch = text.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
        if (redirectMatch && redirectMatch[1]) {
          try {
            const redirectUrl = redirectMatch[1].startsWith('http') ? redirectMatch[1] : `https://voe.sx${redirectMatch[1]}`;
            const redRes = await fetch(redirectUrl, { headers: voeHeaders, signal: AbortSignal.timeout(4000) });
            if (redRes.ok) {
              text = await redRes.text();
            }
          } catch (e) {}
        }

        // A. Regex Robusto para HLS (.m3u8) o MP4
        const robustMatch = text.match(/["'](?:hls|mp4)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
        if (robustMatch && robustMatch[1]) {
          return robustMatch[1];
        }

        // B. Búsqueda en script con id __NEXT_DATA__
        const nextDataMatch = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        if (nextDataMatch && nextDataMatch[1]) {
          try {
            const nextJson = JSON.parse(nextDataMatch[1]);
            const findStream = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              if (typeof obj.hls === 'string' && (obj.hls.includes('.m3u8') || obj.hls.startsWith('http'))) return obj.hls;
              if (typeof obj.mp4 === 'string' && (obj.mp4.includes('.mp4') || obj.mp4.startsWith('http'))) return obj.mp4;
              for (const k of Object.keys(obj)) {
                const found = findStream(obj[k]);
                if (found) return found;
              }
              return null;
            };
            const streamFound = findStream(nextJson);
            if (streamFound) return streamFound;
          } catch (e) {}
        }

        // C. Búsqueda de objeto JSON en variables JS (ej. sources = { ... })
        const sourcesObjMatch = text.match(/(?:var|let|const)?\s*(?:sources|source)\s*=\s*(\{[\s\S]*?\});/i);
        if (sourcesObjMatch && sourcesObjMatch[1]) {
          try {
            const parsed = JSON.parse(sourcesObjMatch[1].replace(/'/g, '"'));
            if (parsed.hls && typeof parsed.hls === 'string') return parsed.hls;
            if (parsed.mp4 && typeof parsed.mp4 === 'string') return parsed.mp4;
          } catch (e) {}
        }

        // D. Petición a API interna si existe (como /api/...)
        const apiMatch = text.match(/["'](\/(?:api|source|player)\/[^"']+)["']/i);
        if (apiMatch && apiMatch[1]) {
          try {
            const domain = new URL(embedUrl).origin;
            const apiUrl = apiMatch[1].startsWith('http') ? apiMatch[1] : `${domain}${apiMatch[1]}`;
            const apiRes = await fetch(apiUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://voe.sx/'
              },
              signal: AbortSignal.timeout(4000)
            });
            if (apiRes.ok) {
              const apiText = await apiRes.text();
              const apiRegexMatch = apiText.match(/["'](?:hls|mp4)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
              if (apiRegexMatch && apiRegexMatch[1]) return apiRegexMatch[1];

              try {
                const apiJson = JSON.parse(apiText);
                if (apiJson.hls) return apiJson.hls;
                if (apiJson.mp4) return apiJson.mp4;
                if (apiJson.file) return apiJson.file;
                if (apiJson.url) return apiJson.url;
              } catch (e) {}
            }
          } catch (e) {}
        }
      }
    }

    // 2. YourUpload Extractor (busca file: 'https://...mp4' en jwplayer)
    if (normalized.includes('yourupload') || embedUrl.includes('yourupload.com')) {
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://tioanime.com/'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const text = await res.text();
        const fileMatch = text.match(/file:\s*'([^']+\.mp4[^']*)'/i) || text.match(/file:\s*"([^"]+\.mp4[^"]*)"/i);
        if (fileMatch && fileMatch[1]) {
          const directCandidate = fileMatch[1].trim();
          if (directCandidate.startsWith('http') && !directCandidate.includes('novideo')) {
            return directCandidate;
          }
        }
      }
    }

    // 3. Si el enlace ya es directo .m3u8 o .mp4
    if (embedUrl.startsWith('http') && !embedUrl.includes('novideo') && (embedUrl.includes('.m3u8') || embedUrl.endsWith('.mp4'))) {
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
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Episodio no encontrado' }, { status: 503, headers: corsHeaders });
    }

    const html = await response.text();
    const match = html.match(/var videos = (\[.*?\]);/s);

    if (!match || !match[1]) {
      return NextResponse.json({ error: 'No se encontraron videos' }, { status: 404, headers: corsHeaders });
    }

    const rawServers = JSON.parse(match[1]);
    
    // Procesamos cada servidor y filtramos servidores caídos/rotos (YourUpload, Mega)
    const servers = await Promise.all(
      rawServers
        .filter((s: any) => {
          const name = s[0].toLowerCase();
          return !name.includes('mega') && !name.includes('yourupload') && s[1];
        })
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

    // Extraer enlaces oficiales de descarga del sitio (ej. Mega)
    const downloadLinks: any[] = [];
    const tableMatch = html.match(/<table[^>]*table-downloads[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch && tableMatch[1]) {
      const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      rows.forEach(tr => {
        const serverMatch = tr.match(/<td>([^<]+)<\/td>/i);
        const linkMatch = tr.match(/href="([^"]+)"/i);
        if (serverMatch && linkMatch && linkMatch[1]) {
          downloadLinks.push({
            server: serverMatch[1].trim(),
            url: linkMatch[1]
          });
        }
      });
    }

    return NextResponse.json({ servers, downloadLinks }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error Video API:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: corsHeaders });
  }
}