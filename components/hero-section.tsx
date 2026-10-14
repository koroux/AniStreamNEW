'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  anime: any;
  user?: any;
  trendingList?: any[];
  onSelectAnime?: (anime: any) => void;
}

export function HeroSection({ anime, user, trendingList = [], onSelectAnime }: HeroSectionProps) {
  const bgImage = anime?.banner || anime?.image || anime?.poster;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

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
    <div className="relative w-full h-[85vh] md:h-[75vh] flex items-center overflow-hidden bg-neutral-950">
      
      {/* 1. IMAGEN DE FONDO CON EFECTO BLUR AMBIENTE (EVITA NEGRO/ESTIRAMIENTO) */}
      <div className="absolute inset-0 select-none overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950 z-10" />
        <img 
          src={bgImage} 
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-30 scale-125 pointer-events-none"
        />
        <img 
          src={bgImage} 
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-contain md:object-cover opacity-85 scale-100 z-0 transition-all duration-700"
        />
      </div>

      {/* 2. CAPAS DE DEGRADADO CINEMATOGRÁFICO */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-black/30 z-10"></div>

      {/* 3. CONTENIDO */}
      <div className="relative container mx-auto px-6 w-full flex flex-col md:flex-row items-end md:items-center justify-between mt-16 z-20">
        
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-lg shadow-orange-900/40">
              Destacado en Tendencia
            </span>
            <span className="bg-white/10 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider backdrop-blur-md border border-white/15">
              {anime.type || 'TV'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-2xl text-white">
            {anime.title}
          </h1>
          
          <p className="text-gray-200 text-sm md:text-base line-clamp-3 max-w-xl drop-shadow-lg font-medium leading-relaxed">
            {anime.description || "Disfruta de esta increíble serie en HD sin interrupciones con AniStreamJD."}
          </p>
          
          <div className="flex items-center gap-4 pt-2 flex-wrap">
            <Link href={`/anime/${anime.id}`}>
              <button className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2.5 transition transform hover:scale-105 shadow-xl shadow-orange-950/40 active:scale-95">
                <Play fill="currentColor" size={18} />
                <span>Ver Ahora</span>
              </button>
            </Link>
            
            <button 
              onClick={toggleFavorite}
              disabled={loadingFav}
              className={`
                px-6 py-3.5 rounded-xl font-semibold border backdrop-blur-md flex items-center gap-2 transition-all shadow-lg
                ${isFavorite 
                  ? "bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30" 
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }
              `}
            >
              {loadingFav ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isFavorite ? (
                <>
                  <Check size={18} /> En mi lista
                </>
              ) : (
                <>
                  <Plus size={18} /> Mi Lista
                </>
              )}
            </button>
          </div>
        </div>

        {/* TARJETA DE BIENVENIDA (LADO DERECHO) O CONTROLES DE ROTACIÓN */}
        <div className="hidden lg:flex flex-col items-end justify-center h-full pr-6 pointer-events-none select-none z-30 absolute right-0 top-0 bottom-0">
          {user && (
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
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
          )}
        </div>

      </div>
    </div>
  );
}