'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Play, Plus, Check, Loader2, Star, ArrowLeft, Tv, Film, Server } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEp, setSelectedEp] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [serverIndex, setServerIndex] = useState<number>(0);

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
        if (data?.seasons && data.seasons.length > 0) {
          setSelectedSeason(data.seasons[0].seasonNumber);
          if (data.seasons[0].episodes && data.seasons[0].episodes.length > 0) {
            setSelectedEp(data.seasons[0].episodes[0].episodeNumber);
          }
        }
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
        title: item?.title || '',
        poster: item?.poster || ''
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
        <Link href="/movies/home" className="bg-orange-600 px-6 py-2.5 rounded-xl font-bold">Volver al Inicio</Link>
      </div>
    );
  }

  const isSerie = item.type === 'Serie';
  const servers = Array.isArray(item.servers) ? item.servers : [];
  const currentServer = servers[serverIndex] || servers[0] || null;

  let currentEmbedUrl = currentServer?.url || '';
  if (isSerie && currentEmbedUrl) {
    if (currentEmbedUrl.includes('season=')) {
      currentEmbedUrl = currentEmbedUrl.replace(/episode=\d+/, `episode=${selectedEp}`);
    } else if (currentEmbedUrl.includes('/tv/')) {
      currentEmbedUrl = currentEmbedUrl.replace(/\/\d+\/\d+$/, `/1/${selectedEp}`);
    } else if (currentEmbedUrl.includes('multiembed.mov')) {
      currentEmbedUrl = currentEmbedUrl.includes('&s=') 
        ? currentEmbedUrl.replace(/&s=\d+&e=\d+/, `&s=1&e=${selectedEp}`)
        : `${currentEmbedUrl}&s=1&e=${selectedEp}`;
    }
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

      {/* REPRODUCTOR SEGURO SIN POPUPS (SANDBOXED IFRAME) */}
      {isPlaying ? (
        <div className="w-full min-h-[90vh] bg-black pt-20 relative flex flex-col items-center justify-center">
          <div className="w-full container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30">
            <button 
              onClick={() => setIsPlaying(false)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/10 font-semibold"
            >
              <ArrowLeft size={18} /> Volver a sinopsis
            </button>

            <span className="text-sm font-bold text-neutral-200 truncate">
              {item.title} {isSerie ? `- T${selectedSeason} Ep. ${selectedEp}` : ''}
            </span>

            {/* SELECTOR DE SERVIDORES LIMPIOS */}
            {servers.length > 0 && (
              <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                <Server size={16} className="text-orange-500 ml-2 flex-shrink-0" />
                {servers.map((srv: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setServerIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${serverIndex === idx ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {srv.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full h-[72vh] container mx-auto px-6 pb-6">
            <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative flex items-center justify-center">
              {currentEmbedUrl ? (
                <iframe
                  key={currentEmbedUrl}
                  src={currentEmbedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div className="text-neutral-400 text-center p-8">
                  <p className="text-lg font-bold mb-2">No hay servidores disponibles para este título por el momento.</p>
                  <p className="text-sm">Intenta seleccionar otro título o vuelve más tarde.</p>
                </div>
              )}
            </div>
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
                  {isSerie ? <Tv size={12} /> : <Film size={12} />}
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
                  <span>Reproducir {isSerie ? `T${selectedSeason} Ep. ${selectedEp}` : ''}</span>
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

      {/* EPISODIOS Y TEMPORADAS REALES (SI ES SERIE) */}
      {isSerie && item?.seasons && item.seasons.length > 0 && !isPlaying && (
        <div className="container mx-auto px-6 mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Tv className="text-orange-500" size={24} />
              Episodios
            </h2>

            {/* SELECTOR HORIZONTAL DE TEMPORADAS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {item.seasons.map((s: any) => (
                <button
                  key={s.seasonNumber}
                  onClick={() => setSelectedSeason(s.seasonNumber)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedSeason === s.seasonNumber
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'
                  }`}
                >
                  {s.name || `Temporada ${s.seasonNumber}`}
                </button>
              ))}
            </div>
          </div>

          {/* GRID DE EPISODIOS DE LA TEMPORADA SELECCIONADA */}
          {(() => {
            const currentSeason = item.seasons.find((s: any) => s.seasonNumber === selectedSeason) || item.seasons[0];
            const episodeList = currentSeason?.episodes || [];

            if (episodeList.length === 0) {
              return (
                <div className="text-neutral-500 text-sm py-8 text-center bg-neutral-900/50 rounded-2xl border border-white/5">
                  No hay episodios disponibles para esta temporada.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {episodeList.map((ep: any) => (
                  <div
                    key={ep.episodeNumber}
                    onClick={() => {
                      setSelectedEp(ep.episodeNumber);
                      setSelectedSeason(ep.seasonNumber);
                      setIsPlaying(true);
                    }}
                    className={`group flex flex-col bg-neutral-900/90 rounded-2xl overflow-hidden border transition-all cursor-pointer hover:-translate-y-1 shadow-lg ${
                      selectedSeason === ep.seasonNumber && selectedEp === ep.episodeNumber
                        ? 'border-orange-500 bg-neutral-800'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Imagen still con placeholder neutro si no hay imagen */}
                    <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
                      {ep.still ? (
                        <img
                          src={ep.still}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                          <Film size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-orange-600/90 text-white flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-md">
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                      </div>
                      {ep.runtime > 0 && (
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-neutral-300">
                          {ep.runtime} min
                        </span>
                      )}
                    </div>

                    {/* Contenido / Metadatos */}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1 text-xs text-orange-400 font-bold">
                          <span>Episodio {ep.episodeNumber}</span>
                          {ep.airDate && <span className="text-neutral-500 text-[11px]">{ep.airDate}</span>}
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-1.5">
                          {ep.title}
                        </h4>
                        {ep.synopsis && (
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {ep.synopsis}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </main>
  );
}
