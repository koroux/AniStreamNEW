'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Importamos los iconos necesarios
import { Search, Menu, X, Play, Bell, User, Filter, Trophy, Crown, LogOut, Loader2, Star, Film, Tv } from 'lucide-react';
// Importamos supabase
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  user?: any;
  isGuest?: boolean;
}

export const Navbar = ({ user, isGuest }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoviesMode, setIsMoviesMode] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkMode = () => {
      if (typeof window !== 'undefined') {
        setIsMoviesMode(window.location.pathname.startsWith('/movies'));
      }
    };
    checkMode();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Búsqueda en vivo con debounce (300ms) y AbortController (solo en modo películas/series)
  useEffect(() => {
    if (!isMoviesMode || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching live search:', err);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isMoviesMode]);

  // Cerrar dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearchOpen(false);
      const searchRoute = isMoviesMode ? `/movies/search?q=${encodeURIComponent(query)}` : `/search?q=${encodeURIComponent(query)}`;
      router.push(searchRoute);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSelectResult = (id: string) => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    router.push(`/movies/${id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userMode');
    localStorage.removeItem('userData');
    router.push('/');
  };

  const navClasses = `fixed top-0 w-full z-50 transition-all duration-500 border-b ${
    (isScrolled || isMobileMenuOpen) 
      ? "bg-black/60 backdrop-blur-xl border-white/10 shadow-lg"
      : "bg-black/30 backdrop-blur-md border-white/5"
  }`;

  const homeHref = isMoviesMode ? "/movies/home" : "/home";
  const browseHref = isMoviesMode ? "/movies/browse" : "/browse";

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
        
        {/* LOGO (Contextual: Anime o Series/Películas) */}
        <Link href={homeHref} className="flex items-center gap-2 md:gap-3 group flex-shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-orange-900/30">
            <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-current" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
              Ani<span className="text-orange-500">Stream</span>
            </span>
            <span className="text-[0.6rem] md:text-[0.65rem] font-bold text-neutral-400 tracking-wider uppercase leading-tight group-hover:text-orange-400 transition-colors block">
              {isMoviesMode ? 'Cine & TV' : 'JD'}
            </span>
          </div>
        </Link>

        {/* MENÚ ESCRITORIO Y SWITCH DE MODO */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center bg-neutral-900/80 p-1 rounded-xl border border-white/10">
            <Link 
              href="/home" 
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${!isMoviesMode ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              Anime
            </Link>
            <Link 
              href="/movies/home" 
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${isMoviesMode ? 'bg-orange-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              Series y Películas
            </Link>
          </div>

          <Link href={browseHref} className="text-neutral-300 hover:text-orange-500 transition-colors text-base font-medium flex items-center gap-1.5">
            <Filter size={16} /> Explorar
          </Link>
          {!isGuest && (
             <Link href="/favorites" className="text-neutral-300 hover:text-orange-500 transition-colors text-base font-medium flex items-center gap-1.5">Mi Lista</Link>
          )}
        </div>

        {/* BUSCADOR */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <form onSubmit={handleSearch} className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder={isMoviesMode ? "Buscar películas o series..." : "Buscar anime..."} 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (isMoviesMode && e.target.value.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              onFocus={() => {
                if (isMoviesMode && query.trim() && (searchResults.length > 0 || isSearching)) {
                  setIsSearchOpen(true);
                }
              }}
              className="w-full bg-neutral-900/70 border border-white/10 rounded-full py-2 pl-10 pr-9 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-neutral-900 transition-all placeholder:text-neutral-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-orange-500 animate-spin pointer-events-none" size={16} />
            )}
          </form>

          {/* DROPDOWN DE RESULTADOS EN VIVO (MODO MOVIES) */}
          {isMoviesMode && isSearchOpen && query.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                  <span>Buscando...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-400">
                  Sin resultados para &quot;{query}&quot;
                </div>
              ) : (
                <>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item.id)}
                        className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-10 h-14 object-cover rounded-md bg-neutral-800 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                            {item.type === 'Serie' ? <Tv size={18} /> : <Film size={18} />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                              {item.type}
                            </span>
                            {item.rating && item.rating !== '0.0' && (
                              <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                <Star size={12} className="fill-current" />
                                <span>{item.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full py-2.5 px-4 text-center text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-white/5 transition-colors block border-t border-white/5 cursor-pointer"
                  >
                    Ver todos los resultados para &quot;{query}&quot; →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-2 md:gap-3">
           {!isMobileMenuOpen && (
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg">
               <Search size={20} />
             </button>
           )}

           {/* LÓGICA INVITADO vs USUARIO */}
           {isGuest ? (
             <Link 
               href="/" 
               className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs md:text-sm px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg shadow-md hover:shadow-orange-600/20 transition-all active:scale-95"
             >
               <User size={15} />
               <span>Iniciar Sesión</span>
             </Link>
           ) : (
             <>
                <button className="text-neutral-300 hover:text-white transition-colors relative hidden sm:block">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                </button>
                
                <div className="group relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 p-[2px] cursor-pointer">
                    <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden font-bold text-white select-none">
                       {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : (user?.name ? user.name[0].toUpperCase() : <User size={16} />)}
                    </div>
                  </div>

                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm text-white font-bold truncate">{user?.user_metadata?.full_name || user?.name || "Usuario"}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || "Miembro"}</p>
                      </div>
                      <Link 
                        href="/profile"
                        className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                      >
                        <User size={15} className="text-orange-500" /> Mi Perfil
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors rounded-b-xl"
                      >
                        <LogOut size={14} /> Cerrar Sesión
                      </button>
                  </div>
                </div>
             </>
           )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors ml-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#0a0a0a] border-b border-white/10 shadow-2xl h-[calc(100vh-4rem)] bg-opacity-95 backdrop-blur-xl overflow-y-auto">
          <div className="p-4 space-y-6">
             {/* Selector de Modo Móvil */}
             <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-white/10">
               <Link 
                 href="/home" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={`py-3 rounded-xl text-center font-bold text-sm transition-all ${!isMoviesMode ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400'}`}
               >
                 Anime
               </Link>
               <Link 
                 href="/movies/home" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={`py-3 rounded-xl text-center font-bold text-sm transition-all ${isMoviesMode ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-400'}`}
               >
                 Series y Películas
               </Link>
             </div>

            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input 
                  type="text" 
                  placeholder={isMoviesMode ? "¿Qué película o serie quieres ver?" : "¿Qué anime quieres ver?"} 
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (isMoviesMode && e.target.value.trim()) {
                      setIsSearchOpen(true);
                    }
                  }}
                  autoFocus
                  className="w-full bg-neutral-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-white text-lg focus:outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-500"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin pointer-events-none" size={20} />
                )}
              </form>

              {/* DROPDOWN RESULTADOS EN MÓVIL */}
              {isMoviesMode && isSearchOpen && query.trim().length > 0 && (
                <div className="mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/5">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-neutral-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-orange-500" />
                      <span>Buscando...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-neutral-400">
                      Sin resultados para &quot;{query}&quot;
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[260px] overflow-y-auto divide-y divide-white/5">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectResult(item.id)}
                            className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-white/10 transition-colors"
                          >
                            {item.poster ? (
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="w-10 h-14 object-cover rounded-md bg-neutral-800 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                                {item.type === 'Serie' ? <Tv size={18} /> : <Film size={18} />}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                                  {item.type}
                                </span>
                                {item.rating && item.rating !== '0.0' && (
                                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                    <Star size={12} className="fill-current" />
                                    <span>{item.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="w-full py-2.5 px-4 text-center text-xs font-bold text-orange-400 hover:bg-white/5 transition-colors block border-t border-white/5"
                      >
                        Ver todos los resultados para &quot;{query}&quot; →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Link 
                href={homeHref} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 p-4 text-white hover:bg-white/10 rounded-2xl transition-all font-medium text-lg"
              >
                <div className="w-10 h-10 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <Play size={20} className="fill-current"/>
                </div>
                Inicio ({isMoviesMode ? 'Series y Películas' : 'Anime'})
              </Link>

              <Link 
                href={browseHref} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 p-4 text-white hover:bg-white/10 rounded-2xl transition-all font-medium text-lg"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center">
                  <Filter size={20}/>
                </div>
                Explorar Géneros
              </Link>

              {!isGuest && (
                 <>
                   <Link 
                     href="/favorites" 
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="flex items-center gap-4 p-4 text-white hover:bg-white/10 rounded-2xl transition-all font-medium text-lg"
                   >
                     <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                       <Trophy size={20}/>
                     </div>
                     Mi Lista
                   </Link>
                   <Link 
                     href="/profile" 
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="flex items-center gap-4 p-4 text-white hover:bg-white/10 rounded-2xl transition-all font-medium text-lg"
                   >
                     <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                       <User size={20}/>
                     </div>
                     Mi Perfil
                   </Link>
                 </>
              )}

              <div className="my-4 border-t border-white/10"></div>
              {isGuest ? (
                 <Link 
                   href="/" 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="flex items-center gap-4 p-4 text-white hover:bg-white/10 rounded-2xl transition-all font-medium text-lg"
                 >
                   <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                     <Crown size={20}/>
                   </div>
                   Registrarse / Entrar
                 </Link>
              ) : (
                 <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-4 p-4 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-2xl transition-all font-medium active:scale-95 text-lg w-full text-left"
                 >
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                     <LogOut size={20}/>
                   </div>
                   Cerrar Sesión
                 </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};