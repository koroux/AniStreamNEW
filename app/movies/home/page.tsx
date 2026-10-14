'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Play, Plus, Check, Loader2, Star, Info, Film, Tv } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MoviesHomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addingFav, setAddingFav] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        const { data: favs } = await supabase
          .from('user_favorites')
          .select('anime_id')
          .eq('user_id', parsed.id);
        if (favs) setFavorites(favs.map(f => f.anime_id));
      }

      try {
        const res = await fetch('/api/movies/home');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const trending = data?.trending || [];
  const currentAnime = trending[displayIndex] || trending[0];

  // Rotación y crossfade idénticos a la experiencia Netflix solicitada
  useEffect(() => {
    if (trending.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % trending.length;
        setIsTransitioning(true);
        setTimeout(() => {
          setDisplayIndex(next);
          setIsTransitioning(false);
        }, 350);
        return next;
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [trending.length]);

  const handleSelectIndex = (index: number) => {
    if (index === displayIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => {
      setDisplayIndex(index);
      setIsTransitioning(false);
    }, 350);
  };

  const toggleFavorite = async (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Inicia sesión para guardar en tu lista');
      return;
    }
    setAddingFav(item.id);
    const isFav = favorites.includes(item.id);

    if (isFav) {
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('anime_id', item.id);
      setFavorites(favorites.filter(id => id !== item.id));
    } else {
      await supabase.from('user_favorites').insert({
        user_id: user.id,
        anime_id: item.id,
        title: item.title,
        poster: item.poster
      });
      setFavorites([...favorites, item.id]);
    }
    setAddingFav(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24 overflow-x-hidden">
      <Navbar user={user} isGuest={!user} />

      {/* HERO SECTION CON CROSS-FADE NETFLIX */}
      {currentAnime && (
        <div className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-16 px-6 md:px-16 overflow-hidden">
          {/* Fondo con doble capa crossfade */}
          <div className="absolute inset-0 z-0">
            <img 
              src={currentAnime.banner || currentAnime.poster} 
              alt={currentAnime.title}
              className={`w-full h-full object-cover transition-all duration-700 ${isTransitioning ? 'scale-102 opacity-60 blur-sm' : 'scale-100 opacity-100 blur-0'}`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-90" />
          </div>

          {/* Contenido Principal con Desplazamiento Sutil */}
          <div className={`relative z-10 max-w-2xl transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-orange-950/50">
                {currentAnime.type === 'Serie' ? <Tv size={12} /> : <Film size={12} />}
                {currentAnime.type || 'Película'}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <Star size={14} className="fill-current" />
                <span>{currentAnime.rating || '4.8'}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-lg">
              {currentAnime.title}
            </h1>

            <p className="text-neutral-300 text-sm md:text-base line-clamp-3 mb-8 drop-shadow leading-relaxed">
              {currentAnime.synopsis}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link 
                href={`/movies/${currentAnime.id}`}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-orange-900/40"
              >
                <Play className="fill-current" size={20} />
                <span>Reproducir</span>
              </Link>

              <button 
                onClick={(e) => toggleFavorite(currentAnime, e)}
                disabled={addingFav === currentAnime.id}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all"
              >
                {addingFav === currentAnime.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : favorites.includes(currentAnime.id) ? (
                  <>
                    <Check size={20} className="text-green-400" />
                    <span>En mi lista</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    <span>Mi Lista</span>
                  </>
                )}
              </button>

              <Link 
                href={`/movies/${currentAnime.id}`}
                className="bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/10 text-white font-semibold p-3.5 rounded-xl flex items-center justify-center transition-all"
              >
                <Info size={22} />
              </Link>
            </div>
          </div>

          {/* Selector lateral estilo Netflix mejorado */}
          <div className="hidden lg:flex absolute right-10 bottom-16 z-20 flex-col gap-3 max-w-xs">
            {trending.slice(0, 5).map((item: any, idx: number) => {
              const isActive = idx === displayIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectIndex(idx)}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all text-left group ${isActive ? 'bg-white/20 border border-white/30 backdrop-blur-xl shadow-xl' : 'bg-black/40 hover:bg-black/60 border border-white/5'}`}
                >
                  <img 
                    src={item.poster} 
                    alt={item.title} 
                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-orange-400 mb-0.5">{item.type || 'Película'}</span>
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                  </div>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${isActive ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50' : 'bg-white/30'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN DE PELÍCULAS Y SERIES */}
      <div className="container mx-auto px-6 mt-12 space-y-12">
        {/* Películas Populares */}
        {data?.movies?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Film className="text-orange-500" size={24} />
                Películas Destacadas
              </h2>
              <Link href="/movies/browse" className="text-sm font-semibold text-orange-500 hover:underline">Ver todas</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {data.movies.map((movie: any) => (
                <Link key={movie.id} href={`/movies/${movie.id}`} className="group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl">
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
                    <img 
                      src={movie.poster} 
                      alt={movie.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Play size={12} className="fill-current" /> Ver ahora
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">{movie.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
                      <span className="bg-white/10 px-2 py-0.5 rounded">{movie.type}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold"><Star size={12} className="fill-current" />{movie.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Series de TV */}
        {data?.series?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Tv className="text-orange-500" size={24} />
                Series de TV Populares
              </h2>
              <Link href="/movies/browse" className="text-sm font-semibold text-orange-500 hover:underline">Ver todas</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {data.series.map((serie: any) => (
                <Link key={serie.id} href={`/movies/${serie.id}`} className="group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl">
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
                    <img 
                      src={serie.poster} 
                      alt={serie.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Play size={12} className="fill-current" /> Ver episodios
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">{serie.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
                      <span className="bg-white/10 px-2 py-0.5 rounded">{serie.type}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold"><Star size={12} className="fill-current" />{serie.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
