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
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      servers: [
        { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyvoe1' },
        { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummydood1' },
        { name: 'Goodstream (Castellano/Latino)', url: 'https://vidsrc.to/embed/movie/693134' },
        { name: 'Servidor HD Directo', url: 'https://vidsrc.cc/v2/embed/movie/693134' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Castellano)' }]
    },
    'deadpool-and-wolverine': {
      id: 'deadpool-and-wolverine',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible han quedado atrás.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película',
      servers: [
        { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyvoe2' },
        { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummydood2' },
        { name: 'Goodstream (Latino)', url: 'https://vidsrc.to/embed/movie/533535' },
        { name: 'Servidor HD Directo', url: 'https://vidsrc.cc/v2/embed/movie/533535' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Castellano)' }]
    },
    'interstellar': {
      id: 'interstellar',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      synopsis: 'Un grupo de científicos y exploradores utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      servers: [
        { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyvoe3' },
        { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummydood3' },
        { name: 'Goodstream (Latino)', url: 'https://vidsrc.to/embed/movie/157336' },
        { name: 'Servidor HD Directo', url: 'https://vidsrc.cc/v2/embed/movie/157336' }
      ],
      episodes: [{ number: 1, title: 'Película Completa (Latino / Castellano)' }]
    },
    'the-last-of-us': {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      synopsis: 'Veinte años después de la destrucción de la civilización moderna.',
      rating: '4.9',
      genres: ['Drama', 'Acción', 'Terror'],
      type: 'Serie',
      servers: [
        { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyserie1' },
        { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummyseriesdood1' },
        { name: 'Goodstream (Latino)', url: 'https://vidsrc.to/embed/tv/100088' },
        { name: 'Servidor HD Directo', url: 'https://vidsrc.cc/v2/embed/tv/100088' }
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
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio sobrenatural.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Terror', 'Drama'],
      type: 'Serie',
      servers: [
        { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyserie2' },
        { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummyseriesdood2' },
        { name: 'Goodstream (Latino)', url: 'https://vidsrc.to/embed/tv/66732' },
        { name: 'Servidor HD Directo', url: 'https://vidsrc.cc/v2/embed/tv/66732' }
      ],
      episodes: [
        { number: 1, title: 'Capítulo Uno: La desaparición de Will Byers' },
        { number: 2, title: 'Capítulo Dos: La chica de Maple Street' },
        { number: 3, title: 'Capítulo Tres: Luz navideña' },
        { number: 4, title: 'Capítulo Cuatro: El cuerpo' }
      ]
    }
  };

  const info = catalog[id] || {
    id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    poster: `https://picsum.photos/seed/${id}/500/750`,
    banner: `https://picsum.photos/seed/${id}banner/1280/720`,
    synopsis: 'Disfruta de este título en alta calidad con los mejores servidores en español latino.',
    rating: '4.8',
    genres: ['Cine y TV'],
    type: 'Película',
    servers: [
      { name: 'Voe (El Bueno - Latino HD)', url: 'https://voe.sx/e/dummyvoedef' },
      { name: 'Doodstream (1080p)', url: 'https://dood.wf/e/dummydooddef' },
      { name: 'Goodstream (Latino)', url: 'https://vidsrc.to/embed/movie/550' }
    ],
    episodes: [{ number: 1, title: 'Reproducción Principal' }]
  };

  return NextResponse.json(info);
}
