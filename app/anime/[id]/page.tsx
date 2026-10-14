'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Play, Loader2, Flag, Share2, Server, CheckCircle, Info, ChevronDown, X, Check, Crown, ChevronLeft, ChevronRight, Moon, Sun, Search as SearchIcon, ShieldAlert, Maximize, Download, Star } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { NativeVideoPlayer } from '@/components/native-video-player';
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
  const [downloadLinks, setDownloadLinks] = useState<any[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(true);
  
  // --- MODO CINE / TEATRAL ---
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // --- BUSCADOR / FILTRO RÁPIDO DE EPISODIOS ---
  const [epSearchQuery, setEpSearchQuery] = useState('');

  // --- FAVORITOS (NUEVO) ---
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // --- CALIFICACIÓN / RATING ---
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingStats, setRatingStats] = useState<{ avg: number; count: number }>({ avg: 4.8, count: 124 });

  // --- TEMPORADAS ---
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);

  // --- REFERENCIA AL REPRODUCTOR PARA PANTALLA COMPLETA ---
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    const el = playerContainerRef.current as any;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }

        // Si el dispositivo soporta Screen Orientation API, forzamos horizontal (landscape)
        if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
          const orientation = window.screen.orientation as any;
          if (orientation && orientation.lock) {
            orientation.lock('landscape').catch(() => {
              // Si el navegador no permite lock automático, el usuario rota manualmente
            });
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }

        // Liberar el bloqueo de rotación al salir
        if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
          const orientation = window.screen.orientation as any;
          if (orientation && orientation.unlock) {
            try {
              orientation.unlock();
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error en fullscreen / orientation:', err);
    }
  };

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
             if (resData.downloadLinks) setDownloadLinks(resData.downloadLinks);
             if (resData.servers && resData.servers.length > 0) {
               setServerList(resData.servers);
               const directServer = resData.servers.find((s: any) => s.isDirect && s.url.startsWith('http') && (s.url.includes('.m3u8') || s.url.endsWith('.mp4')));
               const voeServer = resData.servers.find((s: any) => s.name.toLowerCase().includes('voe'));
               setCurrentVideoUrl((directServer || voeServer || resData.servers[0]).url);
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

        // C. Cargar Calificación del Usuario
        const { data: rateData } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('user_id', currentUser.id)
          .eq('anime_id', id)
          .single();
        
        if (rateData?.rating) setUserRating(rateData.rating);
      }

      // Cargar promedio general de calificaciones para este anime
      try {
        const { data: allRatings } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('anime_id', id);

        if (allRatings && allRatings.length > 0) {
          const total = allRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
          const avg = Number((total / allRatings.length).toFixed(1));
          setRatingStats({ avg, count: allRatings.length });
        }
      } catch (err) {
        // fallback a rating por defecto
      }
    };
    loadUserData();
  }, [id]);

  // --- LÓGICA DE CALIFICACIÓN (1 a 5 ESTRELLAS) ---
  const handleRate = async (stars: number) => {
    if (!user) {
      alert("Inicia sesión para calificar este anime.");
      return;
    }
    setSavingRating(true);
    setUserRating(stars);

    try {
      await supabase.from('user_ratings').upsert({
        user_id: user.id,
        anime_id: id,
        anime_title: info?.title || id,
        rating: stars,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,anime_id' });

      // Actualizar stats locales
      setRatingStats(prev => ({
        avg: Number(((prev.avg * prev.count + stars) / (prev.count + 1)).toFixed(1)),
        count: prev.count + 1,
      }));
    } catch (e) {
      console.warn('Error saving rating:', e);
    } finally {
      setSavingRating(false);
    }
  };

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
    let list = info.episodes.filter((e: any) => (e.season || 1) === selectedSeason);
    if (epSearchQuery.trim()) {
      const q = epSearchQuery.trim().toLowerCase();
      list = list.filter((e: any) => 
        String(e.number).includes(q) || (e.title && e.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [info, selectedSeason, epSearchQuery]);

  // Navegación rápida entre episodios (todos los de la serie en orden)
  const allEpisodes = useMemo(() => {
    if (!info?.episodes) return [];
    return [...info.episodes].sort((a: any, b: any) => a.number - b.number);
  }, [info]);

  const currentEpIndex = useMemo(() => {
    if (!currentEp || allEpisodes.length === 0) return -1;
    return allEpisodes.findIndex((e: any) => e.number === currentEp.number);
  }, [currentEp, allEpisodes]);

  const prevEpisode = useMemo(() => {
    if (currentEpIndex > 0) return allEpisodes[currentEpIndex - 1];
    return null;
  }, [currentEpIndex, allEpisodes]);

  const nextEpisode = useMemo(() => {
    if (currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1) {
      return allEpisodes[currentEpIndex + 1];
    }
    return null;
  }, [currentEpIndex, allEpisodes]);

  // --- CARGAR EPISODIO CON AUTO-FAILOVER ---
  const loadEpisode = async (episode: any) => {
    if (!episode) return;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentEp(episode);
    setLoadingVideo(true);
    setServerList([]);
    setCurrentVideoUrl('');
    setShieldActive(true);

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
      if (data.downloadLinks) setDownloadLinks(data.downloadLinks);
      if (data.servers && data.servers.length > 0) {
        setServerList(data.servers);
        const directServer = data.servers.find((s: any) => s.isDirect && s.url.startsWith('http') && (s.url.includes('.m3u8') || s.url.endsWith('.mp4')));
        const voeServer = data.servers.find((s: any) => s.name.toLowerCase().includes('voe'));
        setCurrentVideoUrl((directServer || voeServer || data.servers[0]).url);
      } else {
        // Fallback si no hay servidores
        console.warn('No servers found for episode');
      }
    } catch (error) {
      console.error('Error loading video:', error);
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

      <main className="pt-16 md:pt-20 w-full max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row w-full">
          
          {/* IZQUIERDA: REPRODUCTOR */}
          <div className="w-full lg:w-[75%] flex flex-col">
            {/* Cabecera del reproductor en móvil */}
            {currentEp && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#121212] border-b border-white/5 text-xs">
                <span className="font-semibold text-neutral-300 truncate max-w-[70%]">
                  {info?.title || 'Anime'}
                </span>
                <span className="text-orange-500 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/20">
                  Episodio {currentEp.number}
                </span>
              </div>
            )}

            <div className="relative w-full my-1">
              {/* EFECTO AMBIENT GLOW / OLED THEATER */}
              {info?.poster && (
                <div 
                  className="absolute -inset-3 bg-cover bg-center rounded-3xl filter blur-3xl opacity-35 pointer-events-none transition-all duration-700 z-0"
                  style={{ backgroundImage: `url('${info.poster}')` }}
                />
              )}

              <div ref={playerContainerRef} className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden group/player rounded-xl border border-white/10 z-10">
              {loadingVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
                  <Loader2 className="animate-spin text-orange-500 mb-4" size={42} />
                  <p className="text-neutral-400 font-medium text-sm animate-pulse">Conectando con el servidor...</p>
                </div>
              ) : currentVideoUrl ? (
                currentVideoUrl.startsWith('http') && !currentVideoUrl.includes('novideo') && (currentVideoUrl.includes('.m3u8') || currentVideoUrl.endsWith('.mp4')) ? (
                  <NativeVideoPlayer src={currentVideoUrl} poster={info?.poster} />
                ) : (
                  <div className="relative w-full h-full">
                    <iframe 
                      src={currentVideoUrl} 
                      className="w-full h-full relative z-20 border-0"
                      allowFullScreen
                      // @ts-ignore
                      webkitallowfullscreen="true"
                      mozallowfullscreen="true"
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center cursor-pointer group"
                  style={{ backgroundImage: `url('${info?.banner || info?.poster}')` }}
                >
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center group-hover:bg-black/40 transition-all p-4 text-center">
                    <p className="text-lg md:text-xl font-bold text-white mb-3">Selecciona un episodio para empezar</p>
                    <div className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Play fill="white" className="ml-1" size={26} />
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Servidores */}
            {serverList.length > 0 && (
              <div className="bg-[#121212] px-3 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-white/5 scrollbar-none">
                <span className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1.5 flex-shrink-0">
                  <Server size={13}/> Servidor:
                </span>
                {serverList.map((server, idx) => {
                  const isServerDirect = server.isDirect && server.url.startsWith('http') && !server.url.includes('novideo') && (server.url.includes('.m3u8') || server.url.endsWith('.mp4'));
                  const isHD = server.name.toLowerCase().includes('voe') || server.name.toLowerCase().includes('streamsb') || server.name.toLowerCase().includes('vidguard');
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentVideoUrl(server.url)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                        currentVideoUrl === server.url
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                      }`}
                    >
                      <span>{server.name}</span>
                      {isHD && (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30 font-black">
                          HD
                        </span>
                      )}
                      {isServerDirect && (
                        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 font-semibold lowercase">
                          sin anuncios
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* BARRA DE NAVEGACIÓN DE EPISODIOS Y MODO CINE */}
            {currentEp && (
              <div className="bg-[#161616] px-4 py-2.5 flex items-center justify-between border-b border-white/5 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => prevEpisode && loadEpisode(prevEpisode)}
                    disabled={!prevEpisode || loadingVideo}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      prevEpisode
                        ? "bg-neutral-800 hover:bg-orange-600 text-white active:scale-95"
                        : "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                    }`}
                    title={prevEpisode ? `Episodio ${prevEpisode.number}` : "No hay episodio anterior"}
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <span className="text-xs text-neutral-400 font-medium px-2 py-1 bg-black/40 rounded border border-white/5">
                    Episodio <strong className="text-white font-bold">{currentEp.number}</strong>
                    {allEpisodes.length > 0 && <span className="text-neutral-500 font-normal"> / {allEpisodes.length}</span>}
                  </span>

                  <button
                    onClick={() => nextEpisode && loadEpisode(nextEpisode)}
                    disabled={!nextEpisode || loadingVideo}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      nextEpisode
                        ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-900/20 active:scale-95"
                        : "bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50"
                    }`}
                    title={nextEpisode ? `Episodio ${nextEpisode.number}` : "Último episodio disponible"}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* BOTÓN PANTALLA COMPLETA & MODO CINE */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-all active:scale-95 border border-white/5"
                    title="Ver en pantalla completa"
                  >
                    <Maximize size={14} className="text-orange-500" />
                    <span>Pantalla Completa</span>
                  </button>

                  <button
                    onClick={() => setIsCinemaMode(!isCinemaMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isCinemaMode
                        ? "bg-orange-600/20 text-orange-400 border-orange-500/40"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-white/5 hover:text-white"
                    }`}
                    title="Activa el modo cine para enfocar la pantalla en el reproductor"
                  >
                    {isCinemaMode ? <Sun size={14} className="text-orange-400" /> : <Moon size={14} />}
                    <span className="hidden sm:inline">{isCinemaMode ? "Desactivar Cine" : "Modo Cine"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* AVISO PERMANENTE SUTIL: RECOMENDACIÓN DE BRAVE (ADAPTADO A MÓVIL) */}
            <div className="bg-[#0f0f0f] border-b border-white/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-neutral-300">
                <ShieldAlert size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="leading-snug text-neutral-300 text-[11px] sm:text-xs">
                  <strong className="text-orange-400 font-bold">Consejo de seguridad:</strong> Se recomienda usar el navegador{' '}
                  <strong className="text-white font-bold">Brave</strong> para bloquear anuncios emergentes o imágenes invasivas de los servidores.
                </p>
              </div>

              <a
                href="https://play.google.com/store/apps/details?id=com.brave.browser"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start sm:self-auto text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider text-[11px] pl-6 sm:pl-0 hover:underline"
              >
                <span>Descargar Brave</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>

            {/* INFO */}
            <div className={`p-6 md:p-8 bg-[#0a0a0a] border-b border-gray-900 transition-opacity duration-300 ${
              isCinemaMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-black text-white">{info?.title}</h1>

                {/* SISTEMA DE CALIFICACIÓN / RATING INTERACTIVO */}
                <div className="flex items-center gap-2 bg-neutral-900/90 border border-white/10 px-3 py-1.5 rounded-2xl self-start sm:self-auto shadow-md">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || userRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          disabled={savingRating}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRate(star)}
                          className="p-0.5 transition-transform hover:scale-125 active:scale-95 text-neutral-600 focus:outline-none"
                          title={`Calificar con ${star} estrellas`}
                        >
                          <Star
                            size={18}
                            className={isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-l border-white/10 pl-2 flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-white">{ratingStats.avg}</span>
                    <span className="text-[10px] text-neutral-500">({ratingStats.count})</span>
                  </div>

                  {userRating > 0 && (
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.2 rounded font-semibold ml-1">
                      Tu voto: {userRating}★
                    </span>
                  )}
                </div>
              </div>

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

                 {/* BOTÓN DESCARGA (SOLO USUARIOS CON CUENTA) */}
                 {user ? (
                   <button
                     onClick={() => setIsDownloadModalOpen(true)}
                     className="px-4 py-2.5 rounded-md text-sm font-bold uppercase flex items-center gap-2 transition-all bg-neutral-900 border border-neutral-700 hover:border-orange-500 hover:text-orange-400 text-neutral-300 active:scale-95 shadow-sm"
                     title="Opciones de descarga directa para este episodio"
                   >
                     <Download size={16} className="text-orange-500" />
                     <span>Descargar</span>
                   </button>
                 ) : (
                   <Link
                     href="/"
                     className="px-4 py-2.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all bg-neutral-900/50 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white"
                     title="Inicia sesión para descargar episodios"
                   >
                     <Download size={15} className="text-neutral-500" />
                     <span className="hidden sm:inline">Descargar (Inicia Sesión)</span>
                     <span className="sm:hidden">Descargar</span>
                   </Link>
                 )}

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
          <div className={`w-full lg:w-[25%] bg-[#121212] border-l border-gray-800 flex flex-col h-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 relative transition-opacity duration-300 ${
            isCinemaMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'
          }`}>
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

            {/* Buscador de episodio en la lista */}
            <div className="p-2.5 bg-[#181818] border-b border-white/5">
              <div className="relative">
                <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar o ir a ep. (ej. 12)..."
                  value={epSearchQuery}
                  onChange={(e) => setEpSearchQuery(e.target.value)}
                  className="w-full bg-[#101010] border border-white/10 rounded-md py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                />
                {epSearchQuery && (
                  <button
                    onClick={() => setEpSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
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

      {/* MODAL DE DESCARGA DIRECTA (SOLO USUARIOS REGISTRADOS) */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Descargar Episodio</h3>
                  <p className="text-xs text-neutral-400">
                    {info?.title} • <span className="text-orange-500 font-semibold">Ep. {currentEp?.number}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Selecciona una de las fuentes de descarga disponibles para guardar el archivo en tu dispositivo:
            </p>

            <div className="space-y-2.5 mb-5">
              {/* Opción 1: Enlaces oficiales de descarga (ej. Mega) */}
              {downloadLinks.length > 0 && downloadLinks.map((dl, idx) => (
                <a
                  key={idx}
                  href={dl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/30 rounded-2xl transition-all group active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Descarga {dl.server}
                      </span>
                      <p className="text-[11px] text-neutral-400">Servidor directo en la nube (MP4/Full HD)</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    Descargar
                  </span>
                </a>
              ))}

              {/* Opción 2: Descarga desde Brave / Navegador */}
              <div className="p-3.5 bg-neutral-900/60 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1">
                  <ShieldAlert size={14} />
                  <span>En tu teléfono (con Brave):</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Al reproducir el video en pantalla completa, mantén presionado el reproductor o toca el menú de Brave y selecciona <strong className="text-white">&ldquo;Descargar video&rdquo;</strong> para guardarlo directamente en tu galería.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #121212; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}</style>
    </div>
  );
}