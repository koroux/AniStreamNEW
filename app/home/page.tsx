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

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<{trending: any[], newReleases: any[], classics: any[]} | null>(null);
  const [featuredAnime, setFeaturedAnime] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- MODIFICACIÓN 2: Leer el usuario guardado ---
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
          
          if (data.trending && data.trending.length > 0) {
            setHomeData(data);
            const idx = Math.floor(Math.random() * data.trending.length);
            setCurrentIndex(idx);
            const randomFeatured = data.trending[idx];
            const infoRes = await fetch(`/api/info?id=${randomFeatured.id}`);
            const infoData = await infoRes.json();
            setFeaturedAnime({ ...infoData, poster: randomFeatured.poster, image: randomFeatured.poster });
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

  // Rotación automática del anime destacado cada 9 segundos y precarga a los 7 segundos
  useEffect(() => {
    if (!homeData?.trending || homeData.trending.length <= 1) return;
    
    // Precarga (prefetching) del siguiente anime a los 7 segundos (2s antes de rotar)
    const prefetchTimer = setTimeout(() => {
      const nextIdx = (currentIndex + 1) % homeData.trending.length;
      const nextSelected = homeData.trending[nextIdx];
      if (nextSelected) {
        fetch(`/api/info?id=${nextSelected.id}`).then(r => r.json()).catch(() => {});
        const img = new Image();
        img.src = nextSelected.poster || `https://tioanime.com/uploads/thumbs/${nextSelected.id}.jpg`;
      }
    }, 7000);

    const interval = setInterval(async () => {
      setCurrentIndex(prev => {
        const nextIdx = (prev + 1) % homeData.trending.length;
        const selected = homeData.trending[nextIdx];
        fetch(`/api/info?id=${selected.id}`)
          .then(r => r.json())
          .then(infoData => {
            if (infoData && infoData.id) {
              setFeaturedAnime({ ...infoData, poster: selected.poster, image: selected.poster });
            }
          })
          .catch(() => {});
        return nextIdx;
      });
    }, 9000);

    return () => {
      clearTimeout(prefetchTimer);
      clearInterval(interval);
    };
  }, [homeData, currentIndex]);

  const handleSelectIndex = async (idx: number) => {
    if (!homeData?.trending) return;
    setCurrentIndex(idx);
    const selected = homeData.trending[idx];
    try {
      const infoRes = await fetch(`/api/info?id=${selected.id}`);
      const infoData = await infoRes.json();
      if (infoData && infoData.id) {
        setFeaturedAnime({ ...infoData, poster: selected.poster, image: selected.poster });
      }
    } catch (e) {}
  };

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
              {featuredAnime && (
                <HeroSection 
                  anime={featuredAnime} 
                  user={user} 
                  trendingList={homeData?.trending || []} 
                  currentIndex={currentIndex} 
                  onSelectIndex={handleSelectIndex} 
                />
              )}

              {/* PREVIEWS (ESTILO NETFLIX) */}
              {homeData?.trending && homeData.trending.length > 0 && (
                <div className="container mx-auto px-6 mt-6 mb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 mb-3">Previsualizaciones</h3>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {homeData.trending.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectIndex(idx)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none"
                      >
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all transform group-hover:scale-105 ${
                          currentIndex === idx ? 'bg-gradient-to-tr from-orange-500 to-red-600 ring-2 ring-orange-500/50 shadow-lg shadow-orange-950/50' : 'bg-neutral-800'
                        }`}>
                          <div className="w-full h-full rounded-full overflow-hidden bg-black">
                            <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-300 group-hover:text-white max-w-[80px] truncate text-center">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="container mx-auto px-6 space-y-12 mt-6 relative z-20">
                
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