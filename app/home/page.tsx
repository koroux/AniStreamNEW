'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { BraveBanner } from '@/components/brave-banner';
import { HeroSection } from '@/components/hero-section';
import { AnimeCard } from '@/components/anime-card';
import { Loader2, Flame, Sparkles, Trophy } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  // --- MODIFICACIÓN 1: Estado para el usuario ---
  const [user, setUser] = useState<any>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<{trending: any[], newReleases: any[], classics: any[]} | null>(null);
  const [featuredAnime, setFeaturedAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- MODIFICACIÓN 2: Leer el usuario guardado (que viene de Supabase/Login) ---
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