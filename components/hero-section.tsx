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
  const bgImage = anime?.banner || anime?.image || anime?.poster;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Efecto de transición sutil al cambiar de anime destacado
  useEffect(() => {
    setIsFading(true);
    const timer = setTimeout(() => setIsFading(false), 400);
    return () => clearTimeout(timer);
  }, [anime?.id]);

  // Lógica de Favoritos
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !anime?.id) return;
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', anime.id)
        .single();
      if (data) setIsFavorite(true);
      else setIsFavorite(false);
    };
    checkFavorite();
  }, [anime?.id, user]);

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
        .eq('anime_id', anime.id);
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          anime_id: anime.id,
          title: anime.title,
          poster: anime.poster || anime.image,
        });
      if (!error) setIsFavorite(true);
    }
    setLoadingFav(false);
  };

  if (!anime) return null;

  return (
    <div className="relative w-full h-[85vh] md:h-[80vh] flex items-center overflow-hidden bg-black">
      
      {/* 1. IMAGEN DE FONDO ESTILO NETFLIX (FULL WIDTH CON ZOOM SUTIL) */}
      <div className={`absolute inset-0 select-none overflow-hidden transition-opacity duration-700 ${isFading ? 'opacity-0 scale-105' : 'opacity-85 scale-100'}`}>
        <img 
          src={bgImage} 
          alt={anime.title}
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
        />
      </div>

      {/* 2. CAPAS DE DEGRADADO CINEMATOGRÁFICO (VIGNETTE & GRADIENTS) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-black/30 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-black/20 z-10"></div>

      {/* 3. CONTENIDO ESTILO NETFLIX */}
      <div className="relative container mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-end md:items-center justify-between mt-20 z-20">
        
        <div className={`max-w-2xl space-y-3 md:space-y-4 transition-all duration-500 ${isFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center gap-2.5">
            <span className="bg-orange-600 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-orange-950/50">
              🔥 Destacado en Tendencia
            </span>
            <span className="bg-white/15 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/25">
              {anime.type || 'TV'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl text-white">
            {anime.title}
          </h1>
          
          {/* GÉNEROS SEPARADOS POR PUNTOS (ESTILO NETFLIX DE LA IMAGEN DE EJEMPLO) */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300 font-semibold flex-wrap">
              {anime.genres.slice(0, 5).map((g: string, i: number) => (
                <span key={g} className="flex items-center">
                  {g} {i < Math.min(anime.genres.length, 5) - 1 && <span className="mx-2 text-orange-500">•</span>}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-xl drop-shadow-lg font-normal leading-relaxed pt-1">
            {anime.description || "Disfruta de esta increíble serie en HD sin interrupciones con AniStreamJD."}
          </p>
          
          {/* BOTONES DE ACCIÓN NETFLIX (MI LISTA - VER AHORA - INFO) */}
          <div className="flex items-center gap-4 pt-3 flex-wrap">
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

            <Link href={`/anime/${anime.id}`}>
              <button className="bg-white hover:bg-neutral-200 text-black px-8 py-3.5 rounded-xl font-extrabold flex items-center gap-2.5 transition transform hover:scale-105 shadow-2xl active:scale-95 text-sm md:text-base">
                <Play fill="currentColor" size={18} />
                <span>Ver Ahora</span>
              </button>
            </Link>

            <Link href={`/anime/${anime.id}`}>
              <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors gap-1 group active:scale-95" title="Más Información">
                <div className="w-10 h-10 rounded-full bg-neutral-900/80 border border-white/20 flex items-center justify-center group-hover:border-white transition-colors shadow-md">
                  <span className="font-bold text-lg text-white">i</span>
                </div>
                <span className="text-[11px] font-medium tracking-wide">Info</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 4. INDICADORES DE PAGINACIÓN / ROTACIÓN (DERECHA) */}
        {trendingList.length > 1 && (
          <div className="hidden lg:flex flex-col items-center justify-center gap-2 z-30 absolute right-8 bottom-12 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-2xl">
            {trendingList.slice(0, 5).map((item, idx) => (
              <button
                key={item.id}
                onClick={() => onSelectIndex && onSelectIndex(idx)}
                className={`transition-all rounded-full ${
                  currentIndex === idx 
                    ? 'w-6 h-2 bg-orange-500' 
                    : 'w-2 h-2 bg-white/40 hover:bg-white'
                }`}
                title={item.title}
              />
            ))}
          </div>
        )}

        {/* TARJETA DE BIENVENIDA (LADO DERECHO SUPERIOR) */}
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