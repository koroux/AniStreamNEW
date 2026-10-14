import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TMDB_READ_TOKEN is not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=es-ES&page=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    const results = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => {
        const title = item.title || item.name || 'Sin título';
        const type = item.media_type === 'tv' ? 'Serie' : 'Película';
        return {
          id: generateSlug(title),
          tmdbId: item.id,
          title,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
          type,
          rating: typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '4.8',
          synopsis: item.overview || 'Sinopsis no disponible.'
        };
      });

    return NextResponse.json(results);
  } catch (err) {
    console.error('Error in movies search API:', err);
    return NextResponse.json([]);
  }
}
