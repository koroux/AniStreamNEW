'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { AnimeCard } from '@/components/anime-card';
import { Loader2, Filter, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

// Lista de géneros oficiales de AnimeFLV (Slug vs Nombre Real)
const GENRES = [
  { id: 'accion', name: 'Acción', color: 'bg-red-500' },
  { id: 'aventura', name: 'Aventura', color: 'bg-orange-500' },
  { id: 'comedia', name: 'Comedia', color: 'bg-yellow-500' },
  { id: 'drama', name: 'Drama', color: 'bg-blue-500' },
  { id: 'fantasia', name: 'Fantasía', color: 'bg-purple-500' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', color: 'bg-cyan-500' },
  { id: 'shounen', name: 'Shonen', color: 'bg-amber-600' },
  { id: 'seinen', name: 'Seinen', color: 'bg-rose-700' },
  { id: 'sobrenatural', name: 'Sobrenatural', color: 'bg-teal-600' },
  { id: 'magia', name: 'Magia', color: 'bg-violet-600' },
  { id: 'psicologico', name: 'Psicológico', color: 'bg-emerald-700' },
  { id: 'mecha', name: 'Mecha', color: 'bg-zinc-600' },
  { id: 'misterio', name: 'Misterio', color: 'bg-slate-500' },
  { id: 'terror', name: 'Terror', color: 'bg-stone-800' },
  { id: 'romance', name: 'Romance', color: 'bg-pink-500' },
  { id: 'deportes', name: 'Deportes', color: 'bg-emerald-500' },
  { id: 'recuentos-de-la-vida', name: 'Slice of Life', color: 'bg-lime-600' },
  { id: 'ecchi', name: 'Ecchi', color: 'bg-fuchsia-600' },
  { id: 'musica', name: 'Música', color: 'bg-indigo-500' },
  { id: 'escolares', name: 'Escolares', color: 'bg-sky-600' },
];

function BrowseContent() {
  const [selectedGenre, setSelectedGenre] = useState('accion');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Al cambiar de género reseteamos a página 1
  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchGenre = async () => {
      setLoading(true);
      setResults([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const res = await fetch(`/api/browse?genre=${selectedGenre}&page=${currentPage}&order=default`);
        const data = await res.json();
        if (data.animes && Array.isArray(data.animes)) {
          setResults(data.animes);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          setResults(data);
          setTotalPages(1);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenre();
  }, [selectedGenre, currentPage]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 md:pt-28">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* BARRA LATERAL / SELECTOR HORIZONTAL EN MÓVIL DE GÉNEROS */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-neutral-900/60 rounded-2xl p-4 md:p-6 border border-white/5 lg:sticky lg:top-28">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter size={18} className="text-orange-500"/> Géneros
                </span>
                <span className="text-xs text-neutral-500 font-normal lg:hidden">Desliza &rarr;</span>
              </h2>

              {/* En móviles es un scroll horizontal táctil suave; en PC lista vertical */}
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreChange(genre.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all text-left flex items-center justify-between group flex-shrink-0 whitespace-nowrap lg:whitespace-normal",
                      selectedGenre === genre.id 
                        ? `${genre.color} text-white shadow-lg shadow-orange-950/20 scale-102` 
                        : "bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    )}
                  >
                    <span>{genre.name}</span>
                    {selectedGenre === genre.id && <Sparkles size={13} className="ml-2 animate-pulse hidden sm:inline"/>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* GRID DE RESULTADOS Y PAGINACIÓN */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  Explorando: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase">{GENRES.find(g => g.id === selectedGenre)?.name}</span>
                </h1>
                <p className="text-neutral-500 text-xs md:text-sm mt-0.5">
                  Catálogo completo indexado en esta categoría
                </p>
              </div>

              {totalPages > 1 && (
                <div className="text-xs font-semibold text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-white/5 self-start sm:self-auto">
                  Página <strong className="text-orange-500">{currentPage}</strong> de {totalPages}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-neutral-900/60 rounded-xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {results.map((anime) => (
                    <AnimeCard key={anime.id} {...anime} image={anime.poster} />
                  ))}
                </div>

                {/* CONTROLES DE PAGINACIÓN */}
                {totalPages > 1 && (
                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1 || loading}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border",
                        currentPage > 1
                          ? "bg-neutral-900 border-white/10 text-white hover:bg-orange-600 hover:border-orange-500 active:scale-95"
                          : "bg-neutral-900/40 border-white/5 text-neutral-600 cursor-not-allowed opacity-50"
                      )}
                    >
                      &larr; Anterior
                    </button>

                    {/* Botones numéricos inteligentes */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                        let pageNum = idx + 1;
                        if (currentPage > 3 && totalPages > 5) {
                          pageNum = currentPage - 2 + idx;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                        }
                        if (pageNum < 1) pageNum = idx + 1;

                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className={cn(
                              "w-9 h-9 rounded-xl text-xs md:text-sm font-bold transition-all",
                              isActive
                                ? "bg-orange-600 text-white shadow-lg shadow-orange-900/30 scale-105"
                                : "bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages || loading}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border",
                        currentPage < totalPages
                          ? "bg-orange-600 hover:bg-orange-500 border-orange-500 text-white shadow-md active:scale-95"
                          : "bg-neutral-900/40 border-white/5 text-neutral-600 cursor-not-allowed opacity-50"
                      )}
                    >
                      Siguiente &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
            
            {!loading && results.length === 0 && (
              <div className="text-center py-20 text-neutral-500">
                No se encontraron animes para este género (o AnimeFLV está lento).
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function Browse() {
  return (
    <Suspense fallback={<div className="bg-black h-screen" />}>
      <BrowseContent />
    </Suspense>
  );
}