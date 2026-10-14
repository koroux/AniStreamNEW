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
      poster: 'https://picsum.photos/seed/dune2/300/450',
      banner: 'https://picsum.photos/seed/dune2banner/1200/600',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia. Ante la disyuntiva entre el amor de su vida y el destino del universo conocido, se esfuerza por evitar un futuro terrible que solo él puede prever.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'deadpool-and-wolverine': {
      id: 'deadpool-and-wolverine',
      title: 'Deadpool y Wolverine',
      poster: 'https://picsum.photos/seed/deadpool/300/450',
      banner: 'https://picsum.photos/seed/deadpoolbanner/1200/600',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible, Deadpool, han quedado atrás. Cuando su mundo natal se enfrenta a una amenaza existencial, Wade debe volverse a poner el traje con a regañadientes.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-last-of-us': {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      poster: 'https://picsum.photos/seed/tlou/300/450',
      banner: 'https://picsum.photos/seed/tloubanner/1200/600',
      synopsis: 'Veinte años después de que la civilización moderna haya sido destruida, Joel es contratado para contrabandear a Ellie fuera de una zona de cuarentena opresiva. Lo que comienza como un trabajo pequeño pronto se convierte en un viaje brutal y desgarrador.',
      rating: '4.9',
      genres: ['Drama', 'Acción', 'Terror', 'Aventura'],
      type: 'Serie',
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
      poster: 'https://picsum.photos/seed/stranger/300/450',
      banner: 'https://picsum.photos/seed/strangerbanner/1200/600',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio que involucra experimentos secretos, fuerzas sobrenaturales aterradoras y una niña extraña con poderes telequinéticos.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Terror', 'Drama', 'Misterio'],
      type: 'Serie',
      episodes: [
        { number: 1, title: 'Capítulo Uno: La desaparición de Will Byers' },
        { number: 2, title: 'Capítulo Dos: La chica de Maple Street' },
        { number: 3, title: 'Capítulo Tres: Luz navideña' },
        { number: 4, title: 'Capítulo Cuatro: El cuerpo' }
      ]
    },
    'oppenheimer': {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      poster: 'https://picsum.photos/seed/oppenheimer/300/450',
      banner: 'https://picsum.photos/seed/oppenheimerbanner/1200/600',
      synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer, su papel en el Proyecto Manhattan y el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
      rating: '4.9',
      genres: ['Drama', 'Historia', 'Biografía'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-boys': {
      id: 'the-boys',
      title: 'The Boys',
      poster: 'https://picsum.photos/seed/theboys/300/450',
      banner: 'https://picsum.photos/seed/theboysbanner/1200/600',
      synopsis: 'Un grupo de vigilantes se propone derribar a los Superhéroes corruptos que abusan de sus superpoderes y están respaldados por una megacorporación.',
      rating: '4.8',
      genres: ['Acción', 'Comedia negra', 'Ciencia Ficción'],
      type: 'Serie',
      episodes: [
        { number: 1, title: 'Episodio 1: La regla del juego' },
        { number: 2, title: 'Episodio 2: Cherry' },
        { number: 3, title: 'Episodio 3: ¡Get Some!' }
      ]
    }
  };

  const info = catalog[id] || {
    id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    poster: `https://picsum.photos/seed/${id}/300/450`,
    banner: `https://picsum.photos/seed/${id}banner/1200/600`,
    synopsis: 'Disfruta de este increíble título con la mejor calidad y servidores rápidos en español latino y subtitulado.',
    rating: '4.8',
    genres: ['Entretenimiento', 'Cine y TV'],
    type: 'Película',
    episodes: [{ number: 1, title: 'Reproducción Principal' }]
  };

  return NextResponse.json(info);
}
