const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function unpackerEval(htmlContent) {
  try {
    const packerRegex = /\}\s*\('(.*)',\s*(\d+),\s*(\d+),\s*'(.*)'\.split\(\|'\)\)/s;
    const match = htmlContent.match(packerRegex);
    if (!match) return null;

    const payload = match[1].replace(/\\'/g, "'");
    const radix = parseInt(match[2], 10);
    const symtab = match[4].split('|');

    const unbase = (val, r) => {
      const alpha = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let res = 0;
      for (let i = 0; i < val.length; i++) {
        res = (res * r) + alpha.indexOf(val[i]);
      }
      return res;
    };

    return payload.replace(/\b\w+\b/g, (word) => {
      const index = unbase(word, radix);
      return (index < symtab.length && symtab[index] !== "") ? symtab[index] : word;
    });
  } catch (e) {
    return null;
  }
}

async function extract(embedUrl) {
  if (!embedUrl || typeof embedUrl !== 'string') return null;
  const lower = embedUrl.toLowerCase();

  // Vimeos: imposible de extraer
  if (lower.includes('vimeo')) {
    return null;
  }

  // Filemoon
  if (lower.includes('filemoon')) {
    try {
      const origin = new URL(embedUrl).origin;
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': CHROME_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': `${origin}/`
        },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const html = await res.text();
        const unpacked = unpackerEval(html);
        if (unpacked) {
          const fileMatch = unpacked.match(/file:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i) ||
                            unpacked.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
          if (fileMatch && fileMatch[1]) return fileMatch[1];
        }
        const directMatch = html.match(/file:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i) ||
                            html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
        if (directMatch && directMatch[1]) return directMatch[1];
      }
    } catch (e) {}
  }

  // Doodstream
  if (lower.includes('dood') || lower.includes('ds2play') || lower.includes('myvidplay')) {
    try {
      const domain = new URL(embedUrl).origin;
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': CHROME_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': `${domain}/`
        },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const html = await res.text();
        const md5Match = html.match(/\/pass_md5\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/);
        if (md5Match && md5Match[0]) {
          const passMd5Url = `${domain}${md5Match[0]}`;
          const md5Res = await fetch(passMd5Url, {
            headers: {
              'User-Agent': CHROME_USER_AGENT,
              'Referer': embedUrl,
              'X-Requested-With': 'XMLHttpRequest'
            },
            signal: AbortSignal.timeout(5000)
          });
          if (md5Res.ok) {
            const baseCdnUrl = (await md5Res.text()).trim();
            if (baseCdnUrl.startsWith('http')) {
              const tokenMatch = html.match(/\?token=([^&"']+)/);
              const token = tokenMatch ? tokenMatch[1] : '';
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              let rand = '';
              for (let i = 0; i < 10; i++) rand += chars[Math.floor(Math.random() * chars.length)];
              return `${baseCdnUrl}${rand}?token=${token}&expiry=${Date.now()}`;
            }
          }
        }
      }
    } catch (e) {}
  }

  // VOE
  if (lower.includes('voe')) {
    try {
      const voeHeaders = {
        'User-Agent': CHROME_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://voe.sx/'
      };
      const res = await fetch(embedUrl, { headers: voeHeaders, signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        let text = await res.text();
        const robustMatch = text.match(/["'](?:hls|mp4)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
        if (robustMatch && robustMatch[1]) return robustMatch[1];

        const base64Matches = text.match(/['"]([A-Za-z0-9+/=]{40,})['"]/g);
        if (base64Matches) {
          for (const b64 of base64Matches) {
            const clean = b64.replace(/['"]/g, '');
            try {
              const reversed = clean.split('').reverse().join('');
              const decoded = Buffer.from(reversed, 'base64').toString('utf-8');
              const m3u8 = decoded.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/i);
              if (m3u8) return m3u8[0];
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  return null;
}

module.exports = { extract };
