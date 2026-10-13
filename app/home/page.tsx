'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { BraveBanner } from '@/components/brave-banner';
import { HeroSection } from '@/components/hero-section';
import { AnimeCard } from '@/components/anime-card';
import { Loader2, Flame, Sparkles, Trophy, Clock, Play as PlayIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  // --- MODIFICACIÓN 1: Estado para el usuario ---
  const [user, setUser] = useState<any>(null);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<{trending: any[], newReleases: any[], classics: any[]} | null>(null);
  const [featuredAnime, setFeaturedAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- MODIFICACIÓN 2: Leer el usuario guardado y su historial ---
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Cargar los últimos episodios vistos por el usuario
      if (parsedUser?.id) {
        supabase
          .from('user_history')
          .select('anime_id, episode_number, anime_title, watched_at')
          .eq('user_id', parsedUser.id)
          .order('watched_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data && data.length > 0) {
              // Filtrar duplicados para mostrar solo el episodio más reciente por anime
              const uniqueAnimes = new Map();
              data.forEach(item => {
                if (!uniqueAnimes.has(item.anime_id)) {
                  uniqueAnimes.set(item.anime_id, item);
                }
              });
              setContinueWatching(Array.from(uniqueAnimes.values()));
            }
          });
      }
    }
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      try {
        if (query) {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (Array.isArray(data)) setSearchResults(data);
        } else {
          const res = await fetch('/api/home');
          const data = await res.json();
          
          if (data.trending) {
            setHomeData(data);
            const randomFeatured = data.trending[Math.floor(Math.random() * data.trending.length)];
            const infoRes = await fetch(`/api/info?id=${randomFeatured.id}`);
            const infoData = await infoRes.json();
            setFeaturedAnime({ ...infoData, image: infoData.poster });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [query]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <BraveBanner />
      </div>

      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-600" size={50} />
        </div>
      ) : (
        <>
          {query ? (
            <div className="container mx-auto px-6 pt-32">
             <h2 className="text-2xl font-bold mb-6">Resultados para <span className="text-orange-500">&quot;{query}&quot;</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {searchResults.map((anime) => (
                  <AnimeCard key={anime.id} {...anime} image={anime.poster} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* --- MODIFICACIÓN 3: Pasamos el usuario al Hero --- */}
              {featuredAnime && <HeroSection anime={featuredAnime} user={user} />}
              
              <div className="container mx-auto px-6 space-y-12 mt-10 relative z-20">
                
                {/* CONTINUAR VIENDO (SOLO USUARIOS REGISTRADOS CON HISTORIAL) */}
                {user && continueWatching.length > 0 && (
                  <section className="scroll-mt-28 bg-gradient-to-r from-orange-950/20 via-neutral-900/40 to-transparent p-4 md:p-6 rounded-2xl border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="text-orange-500" size={22} />
                      <h2 className="text-xl md:text-2xl font-bold text-white">Continuar Viendo</h2>
                      <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                        {continueWatching.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {continueWatching.map((item) => (
                        <Link
                          key={item.anime_id}
                          href={`/anime/${item.anime_id}`}
                          className="group flex items-center justify-between p-3.5 bg-[#121212] hover:bg-neutral-800 border border-white/5 hover:border-orange-500/40 rounded-xl transition-all shadow-md active:scale-98"
                        >
                          <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                              {item.anime_title || item.anime_id}
                            </span>
                            <span className="text-xs text-orange-500 font-semibold mt-0.5">
                              Episodio {item.episode_number}
                            </span>
                          </div>

                          <div className="w-9 h-9 rounded-full bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                            <PlayIcon size={14} className="ml-0.5 fill-current" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                <section id="trending" className="scroll-mt-28">
                  <div className="flex items-center gap-2 mb-6">
                    <Flame className="text-orange-500" />
                    <h2 className="text-2xl font-bold">Tendencias <span className="text-neutral-500 text-sm font-normal ml-2">En emisión</span></h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {homeData?.trending.slice(0, 5).map((anime) => (
                      <AnimeCard key={anime.id} {...anime} image={anime.poster} />
                    ))}
                  </div>
                </section>

                <section id="new" className="scroll-mt-28">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-yellow-400" />
                    <h2 className="text-2xl font-bold">Recién Agregados</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {homeData?.newReleases.slice(0, 5).map((anime) => (
                      <AnimeCard key={anime.id} {...anime} image={anime.poster} isNew={true} />
                    ))}
                  </div>
                </section>

                 <section id="classics" className="scroll-mt-28">
                  <div className="flex items-center gap-2 mb-6">
                    <Trophy className="text-purple-500" />
                    <h2 className="text-2xl font-bold">Mejores Valorados</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {homeData?.classics.slice(0, 5).map((anime) => (
                      <AnimeCard key={anime.id} {...anime} image={anime.poster} />
                    ))}
                  </div>
                </section>

              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-black h-screen" />}>
      <HomeContent />
    </Suspense>
  );
}