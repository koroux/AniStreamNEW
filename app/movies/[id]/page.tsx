'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Play, Plus, Check, Loader2, Star, ArrowLeft, Tv, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedEp, setSelectedEp] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        const { data: fav } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', parsed.id)
          .eq('anime_id', id)
          .single();
        if (fav) setIsFavorite(true);
      }

      try {
        const res = await fetch(`/api/movies/info?id=${id}`);
        const data = await res.json();
        setItem(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) {
      alert('Inicia sesión para guardar en tu lista');
      return;
    }
    if (isFavorite) {
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('anime_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('user_favorites').insert({
        user_id: user.id,
        anime_id: id,
        title: item.title,
        poster: item.poster
      });
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Título no encontrado</h1>
        <button onClick={() => router.back()} className="bg-orange-600 px-6 py-2.5 rounded-xl font-bold">Volver</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <Navbar user={user} isGuest={!user} />

      {!isPlaying && (
        <div className="container mx-auto px-6 pt-24 pb-2">
          <Link href="/movies/home" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-semibold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
            <ArrowLeft size={16} /> Volver a Series y Películas
          </Link>
        </div>
      )}

      {/* REPRODUCTOR O BANNER */}
      {isPlaying ? (
        <div className="w-full h-[80vh] bg-black pt-20 relative flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsPlaying(false)}
            className="absolute top-24 left-6 z-30 bg-black/70 hover:bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/10"
          >
            <ArrowLeft size={18} /> Volver a sinopsis
          </button>
          
          <div className="w-full h-full container mx-auto px-6 py-6">
            <iframe 
              src={`https://vidsrc.xyz/embed/${item.type === 'Serie' ? 'tv' : 'movie'}?imdb=${id}&season=1&episode=${selectedEp}`}
              className="w-full h-full rounded-2xl border border-white/10 shadow-2xl"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-[70vh] min-h-[500px] flex items-end pb-12 px-6 md:px-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={item.banner || item.poster} 
              alt={item.title} 
              className="w-full h-full object-cover opacity-50 blur-sm scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          </div>

          <div className="relative z-10 max-w-4xl flex flex-col md:flex-row gap-8 items-end md:items-center">
            <img 
              src={item.poster} 
              alt={item.title} 
              className="w-48 h-72 object-cover rounded-2xl shadow-2xl border border-white/20 hidden md:block flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  {item.type === 'Serie' ? <Tv size={12} /> : <Film size={12} />}
                  {item.type}
                </span>
                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                  <Star size={14} className="fill-current" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{item.title}</h1>

              <p className="text-neutral-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
                {item.synopsis}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-orange-900/40"
                >
                  <Play className="fill-current" size={20} />
                  <span>Reproducir {item.type === 'Serie' ? `Ep. ${selectedEp}` : ''}</span>
                </button>

                <button 
                  onClick={toggleFavorite}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all"
                >
                  {isFavorite ? (
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EPISODIOS O CAPÍTULOS (SI ES SERIE) */}
      {item.type === 'Serie' && item.episodes && !isPlaying && (
        <div className="container mx-auto px-6 mt-12">
          <h2 className="text-2xl font-black text-white mb-6">Episodios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {item.episodes.map((ep: any) => (
              <div 
                key={ep.number}
                onClick={() => { setSelectedEp(ep.number); setIsPlaying(true); }}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-neutral-900 border transition-all cursor-pointer group ${selectedEp === ep.number ? 'border-orange-500 bg-neutral-800' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-600/20 group-hover:bg-orange-600 text-orange-400 group-hover:text-white flex items-center justify-center font-bold transition-all">
                  <Play size={20} className="fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-neutral-400 font-semibold block">Episodio {ep.number}</span>
                  <h4 className="text-sm font-bold text-white truncate">{ep.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
