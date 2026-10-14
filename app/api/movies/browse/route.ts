import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const catalog = [
    { id: 'dune-part-two', title: 'Duna: Parte Dos', poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05NxlIF.jpg', rating: '4.9', type: 'Película', genre: 'Ciencia Ficción' },
    { id: 'deadpool-and-wolverine', title: 'Deadpool y Wolverine', poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', rating: '4.8', type: 'Película', genre: 'Acción' },
    { id: 'interstellar', title: 'Interestelar', poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', rating: '4.9', type: 'Película', genre: 'Ciencia Ficción' },
    { id: 'the-batman', title: 'The Batman', poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', rating: '4.8', type: 'Película', genre: 'Acción' },
    { id: 'oppenheimer', title: 'Oppenheimer', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', rating: '4.9', type: 'Película', genre: 'Drama' },
    { id: 'the-last-of-us', title: 'The Last of Us', poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', rating: '4.9', type: 'Serie', genre: 'Drama' },
    { id: 'stranger-things', title: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', rating: '4.9', type: 'Serie', genre: 'Ciencia Ficción' },
    { id: 'breaking-bad', title: 'Breaking Bad', poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', rating: '4.9', type: 'Serie', genre: 'Drama' },
    { id: 'house-of-the-dragon', title: 'La Casa del Dragón', poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg', rating: '4.8', type: 'Serie', genre: 'Fantasía' },
    { id: 'the-boys', title: 'The Boys', poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvkgvFLhVMi6PWY.jpg', rating: '4.8', type: 'Serie', genre: 'Acción' },
    { id: 'spider-man-across-the-spider-verse', title: 'Spider-Man: A través del Spider-Verso', poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', rating: '4.9', type: 'Película', genre: 'Animación' },
    { id: 'avatar-the-way-of-water', title: 'Avatar: El camino del agua', poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', rating: '4.8', type: 'Película', genre: 'Ciencia Ficción' },
    { id: 'john-wick-4', title: 'John Wick 4', poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', rating: '4.8', type: 'Película', genre: 'Acción' },
    { id: 'guardians-of-the-galaxy-vol-3', title: 'Guardianes de la Galaxia Vol. 3', poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg', rating: '4.8', type: 'Película', genre: 'Acción' },
    { id: 'barbie', title: 'Barbie', poster: 'https://image.tmdb.org/t/p/w500/iuFNkhmIp57WDXG1iXl0nKjW9g8.jpg', rating: '4.7', type: 'Película', genre: 'Comedia' },
    { id: 'inception', title: 'El Origen', poster: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', rating: '4.9', type: 'Película', genre: 'Ciencia Ficción' },
    { id: 'the-dark-knight', title: 'Batman: El Caballero de la Noche', poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', rating: '4.9', type: 'Película', genre: 'Acción' },
    { id: 'game-of-thrones', title: 'Juego de Tronos', poster: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', rating: '4.9', type: 'Serie', genre: 'Fantasía' },
    { id: 'chernobyl', title: 'Chernóbil', poster: 'https://image.tmdb.org/t/p/w500/hlLXt2StEbGrmku7t2iNq1m96l.jpg', rating: '4.9', type: 'Serie', genre: 'Drama' },
    { id: 'succession', title: 'Succession', poster: 'https://image.tmdb.org/t/p/w500/7ZAw6trS9y5Y5c4p5G4JpT0q5s0.jpg', rating: '4.8', type: 'Serie', genre: 'Drama' }
  ];

  return NextResponse.json({
    movies: catalog.filter(c => c.type === 'Película'),
    series: catalog.filter(c => c.type === 'Serie'),
    trending: catalog.slice(0, 8),
    genres: ['Todos', 'Acción', 'Ciencia Ficción', 'Drama', 'Fantasía', 'Animación', 'Comedia']
  });
}
