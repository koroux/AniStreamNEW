'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Play, Loader2, Flag, Share2, Server, CheckCircle, Info, ChevronDown, X, Check, Crown } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { supabase } from '@/lib/supabase';
import { getOrFetch } from '@/lib/smart-fetch';

export default function AnimeDetail() {
  const params = useParams();
  const id = params?.id as string;

  // --- ESTADOS ---
  const [info, setInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  
  const [currentEp, setCurrentEp] = useState<any>(null);
  const [serverList, setServerList] = useState<any[]>([]); 
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);
  
  // --- FAVORITOS (NUEVO) ---
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // --- TEMPORADAS ---
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);

  // 1. CARGAR INFO ANIME
  useEffect(() => {
    if (!id) return;
    const loadAnimeData = async () => {
      const data = await getOrFetch(`anime/${id}`, async () => {
        const res = await fetch(`/api/info?id=${id}`);
        return await res.json();
      });
      if (data) {
        setInfo(data);
        if (data.episodes && data.episodes.length > 0) {
           setSelectedSeason(data.episodes[0].season || 1);
           
           // Fetch first episode video directly to avoid dependency warnings
           const episode = data.episodes[0];
           window.scrollTo({ top: 0, behavior: 'smooth' });
           setCurrentEp(episode);
           setLoadingVideo(true);
           setServerList([]);
           setCurrentVideoUrl('');

           try {
             const res = await fetch(`/api/video?id=${id}&ep=${episode.number}`);
             const resData = await res.json();
             if (resData.servers && resData.servers.length > 0) {
               setServerList(resData.servers);
               setCurrentVideoUrl(resData.servers[0].url);
             }
           } catch (error) {
             console.error(error);
           } finally {
             setLoadingVideo(false);
           }
        }
        setLoadingInfo(false);
      }
    };
    loadAnimeData();
  }, [id]);

  // 2. CARGAR USUARIO, HISTORIAL Y FAVORITOS
  useEffect(() => {
    const loadUserData = async () => {
      const mode = localStorage.getItem('userMode');
      let currentUser = null;
      if (mode === 'registered') {
        const userData = localStorage.getItem('userData');
        if (userData) {
          currentUser = JSON.parse(userData);
          setUser(currentUser);
        }
      } else {
        setIsGuest(true);
      }

      if (currentUser) {
        // A. Cargar Historial
        const { data: historyData } = await supabase
          .from('user_history')
          .select('episode_number')
          .eq('user_id', currentUser.id)
          .eq('anime_id', id);
        if (historyData) setWatchedEpisodes(historyData.map(row => row.episode_number));

        // B. Cargar Estado de Favorito (¿Ya lo tengo en mi lista?)
        const { data: favData } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('anime_id', id)
          .single();
        
        if (favData) setIsFavorite(true);
      }
    };
    loadUserData();
  }, [id]);

  // --- LÓGICA DEL BOTÓN FAVORITOS (NUEVO) ---
  const toggleFavorite = async () => {
    if (!user) {
      alert("Inicia sesión para guardar en tu lista.");
      return;
    }
    setLoadingFav(true);

    if (isFavorite) {
      // Borrar
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', id);
      
      if (!error) setIsFavorite(false);
    } else {
      // Agregar
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          anime_id: id,
          title: info?.title,
          poster: info?.poster,
        });

      if (!error) setIsFavorite(true);
    }
    setLoadingFav(false);
  };

  // --- CÁLCULO DE TEMPORADAS ---
  const seasons = useMemo(() => {
    if (!info?.episodes) return [1];
    const unique = new Set(info.episodes.map((e: any) => e.season || 1));
    return Array.from(unique).sort((a: any, b: any) => a - b);
  }, [info]);

  const filteredEpisodes = useMemo(() => {
    if (!info?.episodes) return [];
    return info.episodes.filter((e: any) => (e.season || 1) === selectedSeason);
  }, [info, selectedSeason]);

  // --- CARGAR EPISODIO ---
  const loadEpisode = async (episode: any) => {
    if (!episode) return;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentEp(episode);
    setLoadingVideo(true);
    setServerList([]);
    setCurrentVideoUrl('');

    if ((episode.season || 1) !== selectedSeason) {
      setSelectedSeason(episode.season || 1);
    }

    if (user && !watchedEpisodes.includes(episode.number)) {
      setWatchedEpisodes(prev => [...prev, episode.number]);
      supabase.from('user_history').insert({
        user_id: user.id,
        anime_id: id,
        episode_number: episode.number,
        anime_title: info?.title || id,
        watched_at: new Date().toISOString()
      }).then();
    }

    try {
      const res = await fetch(`/api/video?id=${id}&ep=${episode.number}`);
      const data = await res.json();
      if (data.servers && data.servers.length > 0) {
        setServerList(data.servers);
        setCurrentVideoUrl(data.servers[0].url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingVideo(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar user={user} isGuest={isGuest} />

      <main className="pt-16 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row w-full">
          
          {/* IZQUIERDA: REPRODUCTOR */}
          <div className="w-full lg:w-[75%] flex flex-col">
            <div className="relative w-full aspect-video bg-black shadow-[0_0_40px_rgba(234,88,12,0.1)] z-10">
              {loadingVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
                  <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                  <p className="text-gray-400 font-medium animate-pulse">Conectando servidores...</p>
                </div>
              ) : currentVideoUrl ? (
                <iframe 
                  src={currentVideoUrl} 
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center cursor-pointer group"
                  style={{ backgroundImage: `url('${info?.banner || info?.poster}')` }}
                >
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center group-hover:bg-black/40 transition-all">
                    <p className="text-xl font-bold text-white mb-4">Selecciona un episodio para empezar</p>
                    <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Play fill="white" className="ml-1" size={32} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Servidores */}
            {serverList.length > 0 && (
              <div className="bg-[#1a1a1a] p-3 flex items-center gap-3 overflow-x-auto border-b border-gray-800">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 flex-shrink-0">
                  <Server size={14}/> Fuentes:
                </span>
                {serverList.map((server, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentVideoUrl(server.url)}
                    className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors flex-shrink-0 ${
                      currentVideoUrl === server.url
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            )}

            {/* INFO */}
            <div className="p-6 md:p-8 bg-[#0a0a0a] border-b border-gray-900">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{info?.title}</h1>
              {currentEp && <p className="text-orange-500 font-bold text-sm mb-4">Viendo: S{currentEp.season || 1} E{currentEp.number}</p>}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-white border border-gray-700 uppercase">{info?.type || 'TV'}</span>
                <span className="hidden md:inline">•</span>
                <span>{info?.status}</span>
                <div className="flex gap-2 ml-2 flex-wrap">
                  {info?.genres?.slice(0, 3).map((g: string) => (
                    <span key={g} className="text-xs text-gray-500 border border-gray-800 px-2 py-0.5 rounded">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN (AQUÍ ESTÁ LA CORRECCIÓN) */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                 
                 <button 
                   onClick={toggleFavorite}
                   disabled={loadingFav}
                   className={`
                     px-5 py-2.5 rounded-md text-sm font-bold uppercase flex items-center gap-2 transition-all border
                     ${isFavorite 
                       ? "bg-green-600/20 text-green-500 border-green-500/50 hover:bg-green-600/30" 
                       : "text-gray-300 border-gray-700 hover:text-white hover:border-white"
                     }
                   `}
                 >
                    {loadingFav ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isFavorite ? (
                      <>
                        <Check size={18} /> En mi Lista
                      </>
                    ) : (
                      <>
                        <Flag size={18} /> Mi Lista
                      </>
                    )}
                 </button>

                 <button className="ml-auto text-gray-400 hover:text-orange-500 transition">
                    <Share2 size={22} />
                 </button>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 <div className="md:col-span-2">
                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 tracking-wider flex items-center gap-2">
                      <Info size={14}/> Sinopsis
                    </h3>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                      {info?.description}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* DERECHA: LISTA TEMPORADAS */}
          <div className="w-full lg:w-[25%] bg-[#121212] border-l border-gray-800 flex flex-col h-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 relative">
            <div className="p-4 border-b border-gray-800 bg-[#121212] z-20 flex justify-between items-center shadow-md relative">
              <button 
                onClick={() => setIsSeasonMenuOpen(!isSeasonMenuOpen)}
                className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide hover:text-orange-500 transition-colors"
              >
                Temporada {selectedSeason}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isSeasonMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <span className="text-xs text-gray-500 font-bold">
                 {filteredEpisodes.length} Videos
              </span>

              {isSeasonMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border-t border-b border-gray-700 shadow-2xl animate-in slide-in-from-top-2 z-50">
                  <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#222]">
                     <span className="text-xs font-bold text-gray-400 uppercase">Seleccionar Temporada</span>
                     <button onClick={() => setIsSeasonMenuOpen(false)}><X size={14} className="text-gray-400"/></button>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {seasons.map((season: any) => {
                      const count = info?.episodes?.filter((e: any) => (e.season || 1) === season).length;
                      return (
                        <button
                          key={season}
                          onClick={() => {
                            setSelectedSeason(season);
                            setIsSeasonMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold flex justify-between items-center hover:bg-[#333] transition-colors ${
                            selectedSeason === season ? 'text-orange-500 bg-[#2a1b15]' : 'text-gray-300'
                          }`}
                        >
                          <span>Temporada {season}</span>
                          <span className="text-xs text-gray-500 font-normal">{count} Episodios</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
              {filteredEpisodes.length > 0 ? (
                filteredEpisodes.map((ep: any) => {
                  const isWatched = watchedEpisodes.includes(ep.number);
                  const isActive = currentEp?.number === ep.number;

                  return (
                    <div 
                      key={ep.number}
                      onClick={() => loadEpisode(ep)}
                      className={`
                        group flex gap-3 p-2 rounded-md cursor-pointer transition-all relative overflow-hidden
                        ${isActive 
                          ? "bg-[#2a1b15] border-l-4 border-orange-600" 
                          : "hover:bg-[#1a1a1a] border-l-4 border-transparent"
                        }
                      `}
                    >
                      <div className="relative w-28 h-16 bg-gray-800 rounded-sm overflow-hidden flex-shrink-0">
                        {ep.image ? (
                           <img 
                             src={ep.image} 
                             alt={`Ep ${ep.number}`}
                             className={`w-full h-full object-cover ${isWatched && !isActive ? "opacity-50 grayscale" : ""}`} 
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xs bg-gray-900">
                              EP {ep.number}
                           </div>
                        )}
                        {isActive && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Play size={20} className="text-orange-500 fill-current animate-pulse" />
                           </div>
                        )}
                        {isWatched && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></div>}
                      </div>

                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold truncate ${isActive ? "text-orange-500" : "text-gray-300 group-hover:text-white"}`}>
                            Episodio {ep.number}
                          </span>
                          {isWatched && !isActive && (
                             <CheckCircle size={12} className="text-green-500" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate group-hover:text-gray-400">
                          {ep.title || `Episodio ${ep.number}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                 <div className="p-8 text-center text-gray-500 text-sm">
                   No hay episodios disponibles.
                 </div>
              )}
            </div>
          </div>

        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #121212; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}</style>
    </div>
  );
}