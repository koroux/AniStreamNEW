import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const cleanId = id.toLowerCase();

  const tmdbMap: Record<string, string> = {
    'dune-part-two': '693134',
    'deadpool-and-wolverine': '533535',
    'interstellar': '157336',
    'the-batman': '414906',
    'oppenheimer': '872585',
    'the-last-of-us': '100088',
    'stranger-things': '66732',
    'breaking-bad': '1396',
    'house-of-the-dragon': '94997',
    'the-boys': '76479',
    'spider-man-across-the-spider-verse': '569094',
    'avatar-the-way-of-water': '76600',
    'john-wick-4': '603692',
    'guardians-of-the-galaxy-vol-3': '447365',
    'barbie': '346698',
    'inception': '27205',
    'the-dark-knight': '155',
    'game-of-thrones': '1399',
    'chernobyl': '87108',
    'succession': '81329'
  };

  let tmdbId = tmdbMap[cleanId];
  if (!tmdbId) {
    let hash = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hash = (hash << 5) - hash + cleanId.charCodeAt(i);
      hash |= 0;
    }
    const sampleIds = ['693134', '533535', '157336', '414906', '872585', '27205', '155', '680', '13', '238', '278'];
    tmdbId = sampleIds[Math.abs(hash) % sampleIds.length];
  }

  const staticDetails: Record<string, any> = {
    'dune-part-two': { title: 'Duna: Parte Dos', poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg', banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg', synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza.', rating: '4.9', genres: ['Ciencia Ficción'], type: 'Película' },
    'deadpool-and-wolverine': { title: 'Deadpool y Wolverine', poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg', synopsis: 'Un apático Wade Wilson se afana en la vida civil.', rating: '4.8', genres: ['Acción'], type: 'Película' },
    'interstellar': { title: 'Interestelar', poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano.', rating: '4.9', genres: ['Ciencia Ficción'], type: 'Película' },
    'the-last-of-us': { title: 'The Last of Us', poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg', synopsis: 'Veinte años después de la destrucción de la civilización moderna.', rating: '4.9', genres: ['Drama'], type: 'Serie' },
    'stranger-things': { title: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg', synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio.', rating: '4.9', genres: ['Ciencia Ficción'], type: 'Serie' }
  };

  const matched = staticDetails[cleanId];
  const type = cleanId.includes('serie') || cleanId.includes('last-of-us') || cleanId.includes('stranger') || cleanId.includes('breaking') || cleanId.includes('dragon') || cleanId.includes('boys') || cleanId.includes('thrones') || cleanId.includes('chernobyl') || cleanId.includes('succession') ? 'Serie' : 'Película';
  const isSerie = type === 'Serie';

  const servers = isSerie ? [
    { name: 'Servidor MultiEmbed HD (Latino)', url: `https://multiembed.mov/?tmdb=${tmdbId}&s=1&e=1` },
    { name: 'Servidor VidSrc XYZ', url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=1&episode=1` },
    { name: 'Servidor VidSrc Net', url: `https://player.vidsrc.net/embed/tv/${tmdbId}/1/1` }
  ] : [
    { name: 'Servidor MultiEmbed HD (Latino)', url: `https://multiembed.mov/?tmdb=${tmdbId}` },
    { name: 'Servidor VidSrc XYZ', url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}` },
    { name: 'Servidor VidSrc Net', url: `https://player.vidsrc.net/embed/movie/${tmdbId}` }
  ];

  const episodes = isSerie ? [
    { number: 1, title: 'Episodio 1' },
    { number: 2, title: 'Episodio 2' },
    { number: 3, title: 'Episodio 3' },
    { number: 4, title: 'Episodio 4' },
    { number: 5, title: 'Episodio 5' },
    { number: 6, title: 'Episodio 6' },
    { number: 7, title: 'Episodio 7' },
    { number: 8, title: 'Episodio 8' }
  ] : [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }];

  return NextResponse.json({
    id,
    title: matched?.title || id.replace(/-/g, ' ').toUpperCase(),
    poster: matched?.poster || `https://picsum.photos/seed/${cleanId}/500/750`,
    banner: matched?.banner || `https://picsum.photos/seed/${cleanId}banner/1280/720`,
    synopsis: matched?.synopsis || 'Disfruta de este título en alta calidad con servidores rápidos en español latino.',
    rating: matched?.rating || '4.8',
    genres: matched?.genres || ['Cine y TV'],
    type,
    servers,
    episodes
  });
}
