'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Loader2, Film, Tv, Star, Play, Filter, Flame, Award, Clock, Check } from 'lucide-react';

interface GenreItem {
  id: number;
  name: string;
  types: ('movie' | 'tv')[];
  equivalentTvId?: number | null;
  equivalentMovieId?: number | null;
}

export default function MoviesBrowsePage() {
  const [items, setItems] = useState<any[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filtros server-side
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'recent'>('popularity');

  const [user, setUser] = useState<any>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  // Reseteo automático de selectedGenre si no aplica al tipo seleccionado
  useEffect(() => {
    if (selectedGenre !== null && genres.length > 0) {
      const g = genres.find((x) => x.id === selectedGenre);
      if (g && Array.isArray(g.types)) {
        if (filterType === 'movie' && !g.types.includes('movie')) {
          setSelectedGenre(null);
        } else if (filterType === 'tv' && !g.types.includes('tv')) {
          setSelectedGenre(null);
        }
      }
    }
  }, [filterType, genres, selectedGenre]);

  // Filtrar géneros visibles según filterType
  const visibleGenres = genres.filter((g) => {
    if (filterType === 'movie') return g.types && g.types.includes('movie');
    if (filterType === 'tv') return g.types && g.types.includes('tv');
    return true; // 'all' -> mostrar todos
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Función para obtener datos de la API
  const fetchPage = useCallback(
    async (pageNum: number, typeVal: string, genreVal: number | null, sortVal: string) => {
      const params = new URLSearchParams();
      params.set('type', typeVal);
      params.set('sort', sortVal);
      params.set('page', pageNum.toString());
      if (genreVal !== null) {
        params.set('genre', genreVal.toString());
      }

      const res = await fetch(`/api/movies/browse?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Error fetching browse data');
      }
      return res.json();
    },
    []
  );

  // Al montar o cambiar de filtros (type, genre, sort): resetear y cargar página 1
  useEffect(() => {
    let isCancelled = false;

    const loadInitial = async () => {
      setLoading(true);
      setItems([]);
      setPage(1);
      setHasMore(true);
      isFetchingRef.current = true;

      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const data = await fetchPage(1, filterType, selectedGenre, sortBy);
        if (!isCancelled) {
          setItems(data.items || []);
          setHasMore(Boolean(data.hasMore));
          if (data.genres && Array.isArray(data.genres) && data.genres.length > 0) {
            setGenres(data.genres);
          }
        }
      } catch (err) {
        console.error('Error loading initial browse page:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    loadInitial();

    return () => {
      isCancelled = true;
    };
  }, [filterType, selectedGenre, sortBy, fetchPage]);

  // Cargar siguiente página para scroll infinito
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loading || loadingMore) return;

    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = page + 1;

    try {
      const data = await fetchPage(nextPage, filterType, selectedGenre, sortBy);
      const newItems = data.items || [];

      setItems((prev) => {
        const map = new Map<string, any>();
        prev.forEach((item) => map.set(item.id, item));
        newItems.forEach((item: any) => map.set(item.id, item));
        return Array.from(map.values());
      });

      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error('Error loading more browse items:', err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [page, hasMore, loading, loadingMore, filterType, selectedGenre, sortBy, fetchPage]);

  // Observer de intersección nativo para scroll infinito
  useEffect(() => {
    const target = loaderRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore && !isFetchingRef.current) {
          loadMore();
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, loading, loadingMore]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24 selection:bg-orange-600 selection:text-white">
      <Navbar user={user} isGuest={!user} />

      <div className="container mx-auto px-4 md:px-6 pt-28 md:pt-32">
        {/* ENCABEZADO Y FILTROS PRINCIPALES */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-orange-600/20 text-orange-400 border border-orange-500/20">
                Catálogo TMDB
              </span>
              <span className="text-xs text-neutral-400">Miles de títulos en streaming</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Catálogo Completo</h1>
            <p className="text-neutral-400 text-sm md:text-base mt-1 max-w-xl">
              Filtra por tipo, género y orden con reproducción directa y servidores en español latino.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* TABS DE TIPO: Todos / Películas / Series */}
            <div className="flex items-center bg-neutral-900/90 p-1.5 rounded-xl border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('movie')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterType === 'movie'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film size={14} /> Películas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('tv')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterType === 'tv'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tv size={14} /> Series
              </button>
            </div>

            {/* SELECTOR DE ORDEN */}
            <div className="flex items-center bg-neutral-900/90 p-1.5 rounded-xl border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => setSortBy('popularity')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sortBy === 'popularity'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Más populares"
              >
                <Flame size={14} /> Popularidad
              </button>
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sortBy === 'rating'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Mejor calificadas"
              >
                <Award size={14} /> Valoradas
              </button>
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Estrenos más recientes"
              >
                <Clock size={14} /> Recientes
              </button>
            </div>
          </div>
        </div>

        {/* CHIPS HORIZONTALES DE GÉNEROS */}
        {visibleGenres.length > 0 && (
          <div className="relative mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs uppercase tracking-wider pl-1 pr-2 flex-shrink-0">
                <Filter size={15} />
                <span>Género:</span>
              </div>

              {/* Botón Todos */}
              <button
                type="button"
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  selectedGenre === null
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                    : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 border border-white/5'
                }`}
              >
                Todos los géneros
              </button>

              {visibleGenres.map((g) => {
                const isActive = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                        : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 border border-white/5'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ESTADO INICIAL DE CARGA */}
        {loading && items.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <p className="text-neutral-400 text-sm">Consultando catálogo de TMDB...</p>
          </div>
        ) : (
          <>
            {/* GRID RESPONSIVE DE TÍTULOS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/movies/${item.id}`}
                  className="group relative flex flex-col bg-neutral-900/60 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-orange-950/20"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        {item.type === 'Serie' ? <Tv size={36} /> : <Film size={36} />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                        <Play size={12} className="fill-current" /> Ver ahora
                      </span>
                    </div>

                    {/* Badge de tipo arriba a la derecha */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 md:p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {item.genres && Array.isArray(item.genres) && item.genres.length > 0 && (
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                          {item.genres.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-neutral-400 pt-2 border-t border-white/5">
                      <span className="text-[11px] text-neutral-400 font-medium">Latino / HD</span>
                      {item.rating && item.rating !== '0.0' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star size={12} className="fill-current" />
                          {item.rating}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[10px]">Sin votos</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ESTADO VACÍO */}
            {items.length === 0 && !loading && (
              <div className="text-center py-24 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 mx-auto mb-4">
                  <Filter size={28} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No se encontraron títulos</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  Prueba cambiando el género, el tipo o el orden seleccionado para ver más resultados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setSelectedGenre(null);
                    setSortBy('popularity');
                  }}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  Restablecer filtros
                </button>
              </div>
            )}

            {/* TRIGGER DE SCROLL INFINITO & SPINNER */}
            <div ref={loaderRef} className="h-24 flex items-center justify-center mt-8">
              {loadingMore && (
                <div className="flex items-center gap-2.5 text-orange-500 font-bold text-sm bg-neutral-900/90 px-5 py-2.5 rounded-full border border-white/10 shadow-xl">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Cargando más títulos...</span>
                </div>
              )}
              {!hasMore && items.length > 0 && !loadingMore && (
                <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Check size={14} className="text-orange-500" />
                  <span>Has llegado al final del catálogo</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
