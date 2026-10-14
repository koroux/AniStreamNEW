import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const catalog: Record<string, any> = {
    'dune-part-two': {
      id: 'dune-part-two',
      tmdbId: '693134',
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/693134' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/693134' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=693134' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'deadpool-and-wolverine': {
      id: 'deadpool-and-wolverine',
      tmdbId: '533535',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible han quedado atrás.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/533535' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/533535' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=533535' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'interstellar': {
      id: 'interstellar',
      tmdbId: '157336',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/157336' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/157336' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=157336' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-batman': {
      id: 'the-batman',
      tmdbId: '414906',
      title: 'The Batman',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
      synopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City.',
      rating: '4.8',
      genres: ['Crimen', 'Misterio', 'Drama'],
      type: 'Película',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/414906' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/414906' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=414906' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'oppenheimer': {
      id: 'oppenheimer',
      tmdbId: '872585',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer y el Proyecto Manhattan.',
      rating: '4.9',
      genres: ['Drama', 'Historia', 'Biografía'],
      type: 'Película',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/872585' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/872585' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=872585' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-last-of-us': {
      id: 'the-last-of-us',
      tmdbId: '100088',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      synopsis: 'Veinte años después de la destrucción de la civilización moderna.',
      rating: '4.9',
      genres: ['Drama', 'Acción', 'Terror'],
      type: 'Serie',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/tv/100088' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/tv/100088' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=100088' }
      ],
      episodes: [
        { number: 1, title: 'Episodio 1: Cuando estés perdido en la oscuridad' },
        { number: 2, title: 'Episodio 2: Infected' },
        { number: 3, title: 'Episodio 3: Mucho, mucho tiempo' },
        { number: 4, title: 'Episodio 4: Por favor, tómate de mi mano' }
      ]
    },
    'stranger-things': {
      id: 'stranger-things',
      tmdbId: '66732',
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio sobrenatural.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Terror', 'Drama'],
      type: 'Serie',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/tv/66732' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/tv/66732' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=66732' }
      ],
      episodes: [
        { number: 1, title: 'Capítulo Uno: La desaparición de Will Byers' },
        { number: 2, title: 'Capítulo Dos: La chica de Maple Street' },
        { number: 3, title: 'Capítulo Tres: Luz navideña' },
        { number: 4, title: 'Capítulo Cuatro: El cuerpo' }
      ]
    },
    'breaking-bad': {
      id: 'breaking-bad',
      tmdbId: '1396',
      title: 'Breaking Bad',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      synopsis: 'Un profesor de química de secundaria con cáncer terminal se asocia con un ex alumno.',
      rating: '4.9',
      genres: ['Drama', 'Crimen'],
      type: 'Serie',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/tv/1396' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/tv/1396' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=1396' }
      ],
      episodes: [
        { number: 1, title: 'Episodio 1: Piloto' },
        { number: 2, title: 'Episodio 2: El gato está en la bolsa' },
        { number: 3, title: 'Episodio 3: Y la bolsa está en el río' }
      ]
    },
    'house-of-the-dragon': {
      id: 'house-of-the-dragon',
      tmdbId: '94997',
      title: 'La Casa del Dragón',
      poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
      synopsis: 'La guerra civil de los Targaryen se desata 200 años antes de Juego de Tronos.',
      rating: '4.8',
      genres: ['Fantasía', 'Drama'],
      type: 'Serie',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/tv/94997' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/tv/94997' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=94997' }
      ],
      episodes: [
        { number: 1, title: 'Episodio 1: Los herederos del dragón' },
        { number: 2, title: 'Episodio 2: El príncipe rebelde' },
        { number: 3, title: 'Episodio 3: El segundo de su nombre' }
      ]
    },
    'the-boys': {
      id: 'the-boys',
      tmdbId: '76479',
      title: 'The Boys',
      poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
      synopsis: 'Un grupo de vigilantes se propone derribar a los superhéroes corruptos.',
      rating: '4.8',
      genres: ['Acción', 'Ciencia Ficción'],
      type: 'Serie',
      servers: [
        { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/tv/76479' },
        { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/tv/76479' },
        { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=76479' }
      ],
      episodes: [
        { number: 1, title: 'Episodio 1: La regla del juego' },
        { number: 2, title: 'Episodio 2: Cherry' },
        { number: 3, title: 'Episodio 3: ¡Get Some!' }
      ]
    }
  };

  const info = catalog[id] || {
    id,
    tmdbId: '550',
    title: id.replace(/-/g, ' ').toUpperCase(),
    poster: `https://picsum.photos/seed/${id}/500/750`,
    banner: `https://picsum.photos/seed/${id}banner/1280/720`,
    synopsis: 'Disfruta de este título en alta calidad con servidores rápidos en español latino.',
    rating: '4.8',
    genres: ['Cine y TV'],
    type: 'Película',
    servers: [
      { name: 'Servidor Principal HD (Latino)', url: 'https://vidsrc.to/embed/movie/550' },
      { name: 'Servidor Alternativo 1080p', url: 'https://vidsrc.cc/v2/embed/movie/550' },
      { name: 'Servidor MultiEmbed', url: 'https://multiembed.mov/?tmdb=550' }
    ],
    episodes: [{ number: 1, title: 'Reproducción Principal' }]
  };

  return NextResponse.json(info);
}
