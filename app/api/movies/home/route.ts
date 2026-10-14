import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const moviesAndSeries = [
    {
      id: 'dune-part-two',
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      type: 'Película',
      rating: '4.9',
      synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.'
    },
    {
      id: 'deadpool-and-wolverine',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      type: 'Película',
      rating: '4.8',
      synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible, Deadpool, han quedado atrás.'
    },
    {
      id: 'interstellar',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      type: 'Película',
      rating: '4.9',
      synopsis: 'Un grupo de científicos y exploradores, encabezados por Cooper, utilizan un agujero de gusano para superar las limitaciones de los viajes espaciales.'
    },
    {
      id: 'the-batman',
      title: 'The Batman',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
      type: 'Película',
      rating: '4.8',
      synopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City que se conecta con su propia familia.'
    },
    {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      type: 'Película',
      rating: '4.9',
      synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer, su papel en el Proyecto Manhattan y el desarrollo de la bomba atómica.'
    },
    {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      type: 'Serie',
      rating: '4.9',
      synopsis: 'Veinte años después de que la civilización moderna haya sido destruida, Joel es contratado para contrabandear a Ellie fuera de una zona de cuarentena.'
    },
    {
      id: 'stranger-things',
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      type: 'Serie',
      rating: '4.9',
      synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio que involucra experimentos secretos y fuerzas sobrenaturales.'
    },
    {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      type: 'Serie',
      rating: '4.9',
      synopsis: 'Un profesor de química de secundaria diagnosticado con cáncer de pulmón inoperable se asocia con un ex alumno para fabricar y vender metanfetamina.'
    },
    {
      id: 'house-of-the-dragon',
      title: 'La Casa del Dragón',
      poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
      type: 'Serie',
      rating: '4.8',
      synopsis: 'La historia de la Casa Targaryen ambientada 200 años antes de los eventos de Juego de Tronos.'
    },
    {
      id: 'the-boys',
      title: 'The Boys',
      poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
      type: 'Serie',
      rating: '4.8',
      synopsis: 'Un grupo de vigilantes se propone derribar a los Superhéroes corruptos que abusan de sus superpoderes.'
    }
  ];

  return NextResponse.json({
    trending: moviesAndSeries.slice(0, 5),
    movies: moviesAndSeries.filter(i => i.type === 'Película'),
    series: moviesAndSeries.filter(i => i.type === 'Serie')
  });
}
