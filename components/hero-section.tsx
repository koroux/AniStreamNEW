'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  anime: any;
  user?: any;
  trendingList?: any[];
  currentIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export function HeroSection({ anime, user, trendingList = [], currentIndex = 0, onSelectIndex }: HeroSectionProps) {
  const [displayAnime, setDisplayAnime] = useState(anime);
  const [prevAnime, setPrevAnime] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (anime && anime.id !== displayAnime?.id) {
      setPrevAnime(displayAnime);
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayAnime(anime);
        setPrevAnime(null);
        setIsTransitioning(false);
      }, 600); // 600ms smooth crossfade
      return () => clearTimeout(timer);
    } else if (anime && !displayAnime) {
      setDisplayAnime(anime);
    }
  }, [anime, displayAnime]);

  const current = displayAnime || anime;
  const currentBg = current?.banner || current?.image || current?.poster;
  const prevBg = prevAnime?.banner || prevAnime?.image || prevAnime?.poster;

  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !current?.id) return;
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', current.id)
        .single();
      if (data) setIsFavorite(true);
      else setIsFavorite(false);
    };
    checkFavorite();
  }, [current?.id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      alert("Necesitas iniciar sesión para guardar animes.");
      return;
    }
    setLoadingFav(true);

    if (isFavorite) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', current.id);
      if (!error) setIsFavorite(false);
    } else {
      const posterToSave = current.poster || current.image || `https://picsum.photos/seed/${current.id}/300/450`;
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          anime_id: current.id,
          title: current.title,
          poster: posterToSave,
        });
      if (!error) setIsFavorite(true);
    }
    setLoadingFav(false);
  };

  if (!current) return null;

  return (
    <div className="relative w-full h-[85vh] md:h-[80vh] flex items-center overflow-hidden bg-black">
      
      {/* 1. DOBLE CAPA DE FONDO CON CROSS-FADE DE NETFLIX (SIN PARPADEOS) */}
      <div className="absolute inset-0 select-none overflow-hidden bg-black">
        {/* Fondo anterior desvaneciéndose */}
        {prevBg && (
          <img 
            src={prevBg} 
            alt="prev background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 transition-opacity duration-700 ease-out"
          />
        )}
        {/* Fondo actual con cross-fade y zoom sutil */}
        <img 
          src={currentBg} 
          alt={current.title}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out ${isTransitioning ? 'opacity-40 scale-102' : 'opacity-90 scale-100'} transition-transform duration-1000`}
        />
      </div>

      {/* 2. CAPAS DE DEGRADADO CINEMATOGRÁFICO */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-black/30 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-black/20 z-10"></div>

      {/* 3. CONTENIDO ESTILO NETFLIX (TRANSICIÓN DE OPACIDAD + TRANSLATE SUTIL) */}
      <div className="relative container mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-end md:items-center justify-between mt-20 z-20">
        
        <div className={`max-w-2xl space-y-3 md:space-y-4 transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="bg-orange-600 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-orange-950/50">
              🔥 Destacado en Tendencia
            </span>
            <span className="bg-white/15 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/25">
              {current.type || 'TV'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl text-white text-center md:text-left">
            {current.title}
          </h1>
          
          {/* GÉNEROS */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs md:text-sm text-gray-300 font-semibold flex-wrap">
              {current.genres.slice(0, 5).map((g: string, i: number) => (
                <span key={g} className="flex items-center">
                  {g} {i < Math.min(current.genres.length, 5) - 1 && <span className="mx-2 text-orange-500">•</span>}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-xl drop-shadow-lg font-normal leading-relaxed pt-1 text-center md:text-left mx-auto md:mx-0">
            {current.description || "Disfruta de esta increíble serie en HD sin interrupciones con AniStreamJD."}
          </p>
          
          {/* BOTONES DE ACCIÓN (CENTRADOS EN MÓVIL, IZQUIERDA EN PC) */}
          <div className="flex items-center justify-center md:justify-start gap-4 pt-3 flex-wrap w-full">
            <button 
              onClick={toggleFavorite}
              disabled={loadingFav}
              className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors gap-1 group active:scale-95"
              title="Mi Lista"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-900/80 border border-white/20 flex items-center justify-center group-hover:border-white transition-colors shadow-md">
                {loadingFav ? (
                  <Loader2 size={18} className="animate-spin text-orange-500" />
                ) : isFavorite ? (
                  <Check size={18} className="text-green-400" />
                ) : (
                  <Plus size={20} className="text-white" />
                )}
              </div>
              <span className="text-[11px] font-medium tracking-wide">Mi Lista</span>
            </button>

            <Link href={`/anime/${current.id}`}>
              <button className="bg-white hover:bg-neutral-200 text-black px-8 py-3.5 rounded-xl font-extrabold flex items-center gap-2.5 transition transform hover:scale-105 shadow-2xl active:scale-95 text-sm md:text-base">
                <Play fill="currentColor" size={18} />
                <span>Ver Ahora</span>
              </button>
            </Link>

            <Link href={`/anime/${current.id}`}>
              <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors gap-1 group active:scale-95" title="Más Información">
                <div className="w-10 h-10 rounded-full bg-neutral-900/80 border border-white/20 flex items-center justify-center group-hover:border-white transition-colors shadow-md">
                  <span className="font-bold text-lg text-white">i</span>
                </div>
                <span className="text-[11px] font-medium tracking-wide">Info</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 4. PREVISUALIZACIONES ESTILO NETFLIX (MINIATURAS AMPLIADAS CON TÍTULOS) */}
        {trendingList.length > 1 && (
          <div className="hidden lg:flex flex-col items-end justify-center gap-2.5 z-30 absolute right-8 bottom-10 bg-black/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-2xl max-w-sm">
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 mb-1 px-1">Previsualizaciones</span>
            {trendingList.slice(0, 5).map((item, idx) => (
              <button
                key={item.id}
                onClick={() => onSelectIndex && onSelectIndex(idx)}
                className={`group flex items-center gap-3.5 transition-all p-2.5 rounded-xl w-full text-left ${
                  currentIndex === idx 
                    ? 'bg-white/20 border border-orange-500 shadow-xl scale-102' 
                    : 'hover:bg-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/15 shadow-md">
                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <span className={`text-xs font-bold transition-colors line-clamp-2 ${currentIndex === idx ? 'text-white' : 'text-neutral-300 group-hover:text-white'}`}>
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* TARJETA DE BIENVENIDA */}
        {user && (
          <div className="hidden lg:flex flex-col items-end justify-center h-full pr-6 pointer-events-none select-none z-30 absolute right-0 top-0 bottom-0">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
               <div className="flex flex-col text-right">
                  <span className="text-[12px] text-orange-400 font-bold tracking-[0.2em] uppercase mb-0.5">
                    Bienvenido
                  </span>
                  <span className="text-2xl font-black text-white tracking-tight">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.name || "Nakama"}
                  </span>
               </div>
               <div className="w-[1px] h-8 bg-white/20"></div>
               <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg text-base">
                  {user.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : "N"}
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}