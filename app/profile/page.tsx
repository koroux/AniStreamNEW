'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Check, Trophy, Clock, Camera, Save, Loader2, ArrowLeft, Trash2, Play as PlayIcon, Heart, Settings } from 'lucide-react';
import Link from 'next/link';

const AVATAR_OPTIONS = [
  { id: 'luffy', label: 'Luffy', icon: '👒', color: 'from-red-600 to-amber-500' },
  { id: 'zoro', label: 'Zoro', icon: '⚔️', color: 'from-emerald-600 to-green-500' },
  { id: 'naruto', label: 'Naruto', icon: '🍥', color: 'from-orange-600 to-amber-400' },
  { id: 'goku', label: 'Goku', icon: '⚡', color: 'from-blue-600 to-orange-500' },
  { id: 'tanjiro', label: 'Tanjiro', icon: '🌊', color: 'from-cyan-600 to-emerald-500' },
  { id: 'gojo', label: 'Gojo', icon: '👁️', color: 'from-indigo-600 to-sky-400' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Pestaña activa ('history' | 'favorites' | 'settings')
  const [activeTab, setActiveTab] = useState<'history' | 'favorites' | 'settings'>('history');

  // Estados del perfil
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('accion');
  const [selectedAvatar, setSelectedAvatar] = useState('luffy');

  // Datos
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Estadísticas del usuario
  const [stats, setStats] = useState({
    watchedCount: 0,
    favoritesCount: 0,
    ratingsCount: 0,
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const mode = localStorage.getItem('userMode');
      const savedUserData = localStorage.getItem('userData');

      if (mode !== 'registered' || !savedUserData) {
        router.push('/');
        return;
      }

      const currentUser = JSON.parse(savedUserData);
      setUser(currentUser);

      const meta = currentUser.user_metadata || {};
      setName(meta.full_name || currentUser.name || '');
      setBio(meta.bio || '¡Fanático del anime en AniStreamJD!');
      setFavoriteGenre(meta.favorite_genre || 'accion');
      setSelectedAvatar(meta.avatar_style || 'luffy');

      try {
        if (currentUser.id) {
          const [favRes, histRes, rateRes, historyDataRes, favsDataRes] = await Promise.all([
            supabase.from('user_favorites').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_history').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_ratings').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_history').select('anime_id, episode_number, anime_title, watched_at').eq('user_id', currentUser.id).order('watched_at', { ascending: false }).limit(15),
            supabase.from('user_favorites').select('anime_id, title, poster, created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
          ]);

          setStats({
            favoritesCount: favRes.count || 0,
            watchedCount: histRes.count || 0,
            ratingsCount: rateRes.count || 0,
          });

          if (historyDataRes.data && historyDataRes.data.length > 0) {
            const uniqueAnimes = new Map();
            historyDataRes.data.forEach(item => {
              if (!uniqueAnimes.has(item.anime_id)) {
                uniqueAnimes.set(item.anime_id, item);
              }
            });
            setContinueWatching(Array.from(uniqueAnimes.values()));
          }

          if (favsDataRes.data) {
            const sanitizedFavs = favsDataRes.data.map(fav => {
              let p = fav.poster;
              if (!p || p.includes('logo') || p.includes('banner')) {
                p = `https://tioanime.com/uploads/thumbs/${fav.anime_id}.jpg`;
              }
              return { ...fav, poster: p };
            });
            setFavorites(sanitizedFavs);
          }
        }
      } catch (e) {
        console.warn('Error loading profile data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleClearHistory = async () => {
    if (!user) return;
    if (!confirm("¿Estás seguro de que deseas borrar todo tu historial de reproducción?")) return;

    try {
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id);

      setContinueWatching([]);
      setStats(prev => ({ ...prev, watchedCount: 0 }));
    } catch (e) {
      console.warn('Error clearing history:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const updatedMetadata = {
        ...user.user_metadata,
        full_name: name.trim(),
        bio: bio.trim(),
        favorite_genre: favoriteGenre,
        avatar_style: selectedAvatar,
      };

      await supabase.auth.updateUser({ data: updatedMetadata });

      const updatedUser = { ...user, user_metadata: updatedMetadata };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccessMsg('¡Perfil actualizado con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  const activeAvatarObj = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      <Navbar user={user} isGuest={false} />

      <main className="pt-24 md:pt-28 px-4 max-w-4xl mx-auto">
        
        {/* CABECERA ESTILO NETFLIX PROFILE */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/home"
            className="flex items-center gap-2 text-xs md:text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Volver</span>
          </Link>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">Mi Perfil</h1>
          <div className="w-12"></div> {/* Spacer */}
        </div>

        {/* AVATAR Y NOMBRE CENTRADO */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr ${activeAvatarObj.color} p-1 shadow-2xl relative mb-3 group`}>
            <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-4xl md:text-5xl select-none">
              {activeAvatarObj.icon}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-1.5">
            {name || user?.email?.split('@')[0] || 'Nakama'}
            <span className="text-xs text-orange-500 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-500/30">PRO</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm text-center italic">
            &ldquo;{bio || 'Sin descripción aún.'}&rdquo;
          </p>
        </div>

        {/* ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
          <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-2xl text-center">
            <Trophy size={18} className="mx-auto text-purple-400 mb-1" />
            <div className="text-lg md:text-xl font-bold text-white">{stats.favoritesCount}</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Favoritos</div>
          </div>
          <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-2xl text-center">
            <Clock size={18} className="mx-auto text-orange-400 mb-1" />
            <div className="text-lg md:text-xl font-bold text-white">{stats.watchedCount}</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Vistos</div>
          </div>
          <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-2xl text-center">
            <Shield size={18} className="mx-auto text-emerald-400 mb-1" />
            <div className="text-lg md:text-xl font-bold text-white">{stats.ratingsCount}</div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Ratings</div>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN ESTILO NETFLIX (DOWNLOADS / PLAYLIST / NOTIFICATION) */}
        <div className="flex items-center justify-center border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-6 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Clock size={16} />
            <span>Continuar Viendo ({continueWatching.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 px-6 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Heart size={16} />
            <span>Mi Lista ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-6 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Settings size={16} />
            <span>Configuración</span>
          </button>
        </div>

        {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Historial de Reproducción</h3>
              {continueWatching.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  <Trash2 size={13} />
                  <span>Borrar Historial</span>
                </button>
              )}
            </div>

            {continueWatching.length > 0 ? (
              <div className="grid gap-3">
                {continueWatching.map((item) => (
                  <Link
                    key={item.anime_id}
                    href={`/anime/${item.anime_id}`}
                    className="group flex items-center justify-between p-4 bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-orange-500/40 rounded-2xl transition-all shadow-lg active:scale-98"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-12 h-16 rounded-xl bg-neutral-800 flex-shrink-0 overflow-hidden shadow-md flex items-center justify-center">
                        <PlayIcon size={20} className="text-orange-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {item.anime_title || item.anime_id}
                        </span>
                        <span className="text-xs text-orange-500 font-semibold mt-1">
                          Episodio {item.episode_number}
                        </span>
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <PlayIcon size={16} className="ml-0.5 fill-current" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-500 text-sm bg-neutral-900/40 rounded-3xl border border-white/5">
                No hay episodios recientes en tu historial.
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Mi Lista de Favoritos</h3>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favorites.map((fav) => (
                  <Link
                    key={fav.anime_id}
                    href={`/anime/${fav.anime_id}`}
                    className="group flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/40 transition-all shadow-lg"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-neutral-950 relative">
                      <img src={fav.poster} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">{fav.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-500 text-sm bg-neutral-900/40 rounded-3xl border border-white/5">
                Aún no has agregado animes a tu lista.
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSave} className="bg-neutral-900/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Camera size={18} className="text-orange-500" />
              <span>Personalizar Perfil</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Elige tu Avatar Anime
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      selectedAvatar === avatar.id
                        ? 'border-orange-500 bg-orange-950/30 scale-105 shadow-md'
                        : 'border-white/5 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl md:text-3xl mb-1">{avatar.icon}</span>
                    <span className="text-[11px] font-semibold">{avatar.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Nombre o Nickname
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu apodo anime..."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                maxLength={40}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Biografía / Estado
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntale a la comunidad tus gustos..."
                rows={3}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                maxLength={160}
              />
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs md:text-sm flex items-center gap-2">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-98"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Guardar Cambios</span>
            </button>
          </form>
        )}

      </main>
    </div>
  );
}
