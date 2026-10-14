import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Catálogo curado impecable, libre de anuncios y banners promocionales, con sus IDs exactos
  const curatedMovies = [
    {
      id: 'dune-part-two',
      title: 'Duna: Parte Dos',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/xOMo8DxX7P6bPCtqg6p9sW31yv7.jpg',
      rating: '4.9',
      type: 'Película',
      quality: '4K UHD'
    },
    {
      id: 'deadpool-and-wolverine',
      title: 'Deadpool y Wolverine',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/y2Ca1neKke2mGPMaHzlCDNVPnsK.jpg',
      rating: '4.8',
      type: 'Película',
      quality: '1080p HD'
    },
    {
      id: 'interstellar',
      title: 'Interestelar',
      poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      rating: '4.9',
      type: 'Película',
      quality: '1080p HD'
    },
    {
      id: 'the-batman',
      title: 'The Batman',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/5hNEdNSboScUPwm8g2F3s6G2A5l.jpg',
      rating: '4.8',
      type: 'Película',
      quality: '1080p HD'
    },
    {
      id: 'oppenheimer',
      title: 'Oppenheimer',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      rating: '4.9',
      type: 'Película',
      quality: '4K UHD'
    },
    {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      rating: '4.9',
      type: 'Serie',
      quality: '1080p HD'
    },
    {
      id: 'stranger-things',
      title: 'Stranger Things',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      rating: '4.9',
      type: 'Serie',
      quality: '4K UHD'
    },
    {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      rating: '4.9',
      type: 'Serie',
      quality: '1080p HD'
    },
    {
      id: 'house-of-the-dragon',
      title: 'La Casa del Dragón',
      poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/etp0kzncgDBg4Uo5C8A6QJ8nO6E.jpg',
      rating: '4.8',
      type: 'Serie',
      quality: '1080p HD'
    },
    {
      id: 'the-boys',
      title: 'The Boys',
      poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg',
      banner: 'https://image.tmdb.org/t/p/w1280/mYnpKiwcUiaF9Z7d425kUq2Wd1t.jpg',
      rating: '4.8',
      type: 'Serie',
      quality: '1080p HD'
    }
  ];

  return NextResponse.json({
    trending: curatedMovies.slice(0, 5),
    newReleases: curatedMovies,
    series: curatedMovies.filter(m => m.type === 'Serie')
  });
}
