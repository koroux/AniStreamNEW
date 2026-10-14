'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Loader2, Film, Tv, Star, Play } from 'lucide-react';

export default function MoviesBrowsePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'Película' | 'Serie'>('all');

  useEffect(() => {
    const fetchBrowse = async () => {
      try {
        const res = await fetch('/api/movies/home');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBrowse();
  }, []);

  const allItems = [...(data?.movies || []), ...(data?.series || []), ...(data?.trending || [])];
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
  const filtered = filterType === 'all' ? uniqueItems : uniqueItems.filter((i: any) => i.type === filterType);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <Navbar />

      <div className="container mx-auto px-6 pt-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Explorar Películas y Series</h1>
            <p className="text-neutral-400 text-sm">Catálogo completo en alta definición con audio latino y subtitulado.</p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-xl border border-white/10 self-start">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('Película')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${filterType === 'Película' ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
            >
              <Film size={14} /> Películas
            </button>
            <button 
              onClick={() => setFilterType('Serie')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${filterType === 'Serie' ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
            >
              <Tv size={14} /> Series
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filtered.map((item: any) => (
            <Link key={item.id} href={`/movies/${item.id}`} className="group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl">
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
                <img 
                  src={item.poster} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Play size={12} className="fill-current" /> Ver ahora
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between">
                <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">{item.title}</h3>
                <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
                  <span className="bg-white/10 px-2 py-0.5 rounded">{item.type}</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold"><Star size={12} className="fill-current" />{item.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
