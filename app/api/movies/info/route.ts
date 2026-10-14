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
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia. Ante la disyuntiva entre el amor de su vida y el destino del universo conocido, se esfuerza por evitar un futuro terrible que solo él puede prever.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'deadpool-and-wolverine': {
      id: 'deadpool-and-wolverine',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible, Deadpool, han quedado atrás. Cuando su mundo natal se enfrenta a una amenaza existencial, Wade debe volverse a poner el traje a regañadientes.',
      rating: '4.8',
      genres: ['Acción', 'Comedia', 'Ciencia Ficción'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'interstellar': {
      id: 'interstellar',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      synopsis: 'Un grupo de científicos y exploradores, encabezados por Cooper, utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales y conquistar las vastas distancias.',
      rating: '4.9',
      genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-batman': {
      id: 'the-batman',
      title: 'The Batman',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
      synopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City que se conecta con su propia familia mientras se enfrenta a Enigma.',
      rating: '4.8',
      genres: ['Crimen', 'Misterio', 'Drama'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'oppenheimer': {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer, su papel en el Proyecto Manhattan y el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
      rating: '4.9',
      genres: ['Drama', 'Historia', 'Biografía'],
      type: 'Película',
      episodes: [{ number: 1, title: 'Película Completa (Latino / Subtitulado)' }]
    },
    'the-last-of-us': {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      synopsis: 'Veinte años después de que la civilización moderna haya sido destruida, Joel es contratado para contrabandear a Ellie fuera de una zona de cuarentena opresiva.',
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
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio que involucra experimentos secretos, fuerzas sobrenaturales aterradoras y una niña extraña.',
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
    'breaking-bad': {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      synopsis: 'Un profesor de química de secundaria con cáncer terminal se asocia con un ex alumno para fabricar y vender metanfetamina y asegurar el futuro financiero de su familia.',
      rating: '4.9',
      genres: ['Drama', 'Crimen', 'Suspenso'],
      type: 'Serie',
      episodes: [
        { number: 1, title: 'Episodio 1: Piloto' },
        { number: 2, title: 'Episodio 2: El gato está en la bolsa' },
        { number: 3, title: 'Episodio 3: Y la bolsa está en el río' }
      ]
    },
    'house-of-the-dragon': {
      id: 'house-of-the-dragon',
      title: 'La Casa del Dragón',
      poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
      synopsis: 'La guerra civil de los Targaryen se desata 200 años antes de los eventos de Juego de Tronos.',
      rating: '4.8',
      genres: ['Fantasía', 'Drama', 'Acción'],
      type: 'Serie',
      episodes: [
        { number: 1, title: 'Episodio 1: Los herederos del dragón' },
        { number: 2, title: 'Episodio 2: El príncipe rebelde' },
        { number: 3, title: 'Episodio 3: El segundo de su nombre' }
      ]
    },
    'the-boys': {
      id: 'the-boys',
      title: 'The Boys',
      poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
      synopsis: 'Un grupo de vigilantes se propone derribar a los Superhéroes corruptos que abusan de sus superpoderes.',
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
    poster: `https://picsum.photos/seed/${id}/500/750`,
    banner: `https://picsum.photos/seed/${id}banner/1280/720`,
    synopsis: 'Disfruta de este increíble título con la mejor calidad y servidores rápidos en español latino y subtitulado.',
    rating: '4.8',
    genres: ['Entretenimiento', 'Cine y TV'],
    type: 'Película',
    episodes: [{ number: 1, title: 'Reproducción Principal' }]
  };

  return NextResponse.json(info);
}
