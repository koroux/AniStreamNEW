'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Loader2, Film, Star, Play, Search, SearchX } from 'lucide-react';

function MoviesSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error buscando películas/series:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar user={user} isGuest={!user} />

      <main className="container mx-auto px-6 pt-32 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-black mb-2">
            {query.trim() ? (
              <>Resultados para: <span className="text-orange-500">&quot;{query}&quot;</span></>
            ) : (
              'Búsqueda de Películas y Series'
            )}
          </h1>
          <p className="text-neutral-400 text-sm">
            {query.trim()
              ? `Se encontraron ${results.length} título(s) en TMDB.`
              : 'Escribe algo en el buscador para encontrar películas y series.'}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-neutral-400">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
            <p className="text-base font-semibold">Buscando en el catálogo de TMDB...</p>
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-28 text-neutral-500 text-center">
            <Search size={56} className="mb-4 opacity-40 text-neutral-400" />
            <p className="text-xl font-bold text-neutral-300 mb-1">Escribe algo para buscar</p>
            <p className="text-sm text-neutral-500">Busca por título en español o título original de películas y series.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((item: any) => (
              <Link
                key={item.id}
                href={`/movies/${item.id}`}
                className="group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                      <Film size={36} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Play size={12} className="fill-current" /> Ver ahora
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
                    <span className="bg-white/10 px-2 py-0.5 rounded">{item.type}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={12} className="fill-current" />
                      {item.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-neutral-500 text-center">
            <SearchX size={56} className="mb-4 opacity-40 text-neutral-400" />
            <p className="text-xl font-bold text-neutral-300 mb-1">
              No se encontraron resultados para &quot;{query}&quot;
            </p>
            <p className="text-sm text-neutral-500">
              Intenta con otro término o revisa que el nombre esté bien escrito.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MoviesSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
      }
    >
      <MoviesSearchContent />
    </Suspense>
  );
}
