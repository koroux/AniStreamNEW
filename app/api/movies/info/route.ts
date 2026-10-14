import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';

  const cleanId = id.toLowerCase();

  const catalog: Record<string, any> = {
    'dune-part-two': {
      tmdbId: '693134',
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película'
    },
    'deadpool-and-wolverine': {
      tmdbId: '533535',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible han quedado atrás.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película'
    },
    'interstellar': {
      tmdbId: '157336',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película'
    },
    'the-batman': {
      tmdbId: '414906',
      title: 'The Batman',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
      synopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City.',
      rating: '4.8',
      genres: ['Crimen', 'Misterio', 'Drama'],
      type: 'Película'
    },
    'oppenheimer': {
      tmdbId: '872585',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer y el Proyecto Manhattan.',
      rating: '4.9',
      genres: ['Drama', 'Historia', 'Biografía'],
      type: 'Película'
    },
    'the-last-of-us': {
      tmdbId: '100088',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      synopsis: 'Veinte años después de la destrucción de la civilización moderna.',
      rating: '4.9',
      genres: ['Drama', 'Acción', 'Terror'],
      type: 'Serie'
    },
    'stranger-things': {
      tmdbId: '66732',
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio sobrenatural.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Terror', 'Drama'],
      type: 'Serie'
    },
    'breaking-bad': {
      tmdbId: '1396',
      title: 'Breaking Bad',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      synopsis: 'Un profesor de química de secundaria con cáncer terminal se asocia con un ex alumno.',
      rating: '4.9',
      genres: ['Drama', 'Crimen'],
      type: 'Serie'
    },
    'house-of-the-dragon': {
      tmdbId: '94997',
      title: 'La Casa del Dragón',
      poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
      synopsis: 'La guerra civil de los Targaryen se desata 200 años antes de Juego de Tronos.',
      rating: '4.8',
      genres: ['Fantasía', 'Drama'],
      type: 'Serie'
    },
    'the-boys': {
      tmdbId: '76479',
      title: 'The Boys',
      poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
      synopsis: 'Un grupo de vigilantes se propone derribar a los superhéroes corruptos.',
      rating: '4.8',
      genres: ['Acción', 'Ciencia Ficción'],
      type: 'Serie'
    }
  };

  let matched = catalog[cleanId];
  if (!matched) {
    const key = Object.keys(catalog).find(k => cleanId.includes(k) || k.includes(cleanId));
    if (key) {
      matched = catalog[key];
    }
  }

  let tmdbId = '693134';
  let title = id.replace(/-/g, ' ').toUpperCase();
  let type = cleanId.includes('serie') || cleanId.includes('the-last-of-us') || cleanId.includes('stranger') || cleanId.includes('breaking') || cleanId.includes('dragon') || cleanId.includes('boys') ? 'Serie' : 'Película';

  if (matched) {
    tmdbId = matched.tmdbId;
    title = matched.title;
    type = matched.type;
  } else {
    let hash = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hash = (hash << 5) - hash + cleanId.charCodeAt(i);
      hash |= 0;
    }
    const sampleIds = ['693134', '533535', '157336', '414906', '872585', '27205', '155', '680', '13', '238', '278'];
    tmdbId = sampleIds[Math.abs(hash) % sampleIds.length];
  }

  const poster = matched?.poster || `https://picsum.photos/seed/${cleanId}/500/750`;
  const banner = matched?.banner || `https://picsum.photos/seed/${cleanId}banner/1280/720`;
  const synopsis = matched?.synopsis || 'Disfruta de este título en alta calidad con los mejores servidores en español latino.';
  const rating = matched?.rating || '4.8';
  const genres = matched?.genres || ['Cine y TV'];

  const isSerie = type === 'Serie';

  const servers = isSerie ? [
    { name: 'Servidor Principal HD (Latino)', url: `https://vidsrc.to/embed/tv/${tmdbId}/1/1` },
    { name: 'Servidor Alternativo 1080p', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/1/1` },
    { name: 'Servidor MultiEmbed', url: `https://multiembed.mov/?tmdb=${tmdbId}&s=1&e=1` }
  ] : [
    { name: 'Servidor Principal HD (Latino)', url: `https://vidsrc.to/embed/movie/${tmdbId}` },
    { name: 'Servidor Alternativo 1080p', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}` },
    { name: 'Servidor MultiEmbed', url: `https://multiembed.mov/?tmdb=${tmdbId}` }
  ];

  const episodes = isSerie ? [
    { number: 1, title: 'Episodio 1' },
    { number: 2, title: 'Episodio 2' },
    { number: 3, title: 'Episodio 3' },
    { number: 4, title: 'Episodio 4' },
    { number: 5, title: 'Episodio 5' },
    { number: 6, title: 'Episodio 6' }
  ] : [
    { number: 1, title: 'Película Completa (Latino / Subtitulado)' }
  ];

  return NextResponse.json({
    id,
    tmdbId,
    title,
    poster,
    banner,
    synopsis,
    rating,
    genres,
    type,
    servers,
    episodes
  });
}
