'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Check, Trophy, Clock, Camera, Save, Loader2, ArrowLeft, Trash2, Play as PlayIcon } from 'lucide-react';
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

  // Estados del perfil
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('accion');
  const [selectedAvatar, setSelectedAvatar] = useState('luffy');

  // Continuar viendo / Historial
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

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

      // Cargar metadatos existentes o valores por defecto
      const meta = currentUser.user_metadata || {};
      setName(meta.full_name || currentUser.name || '');
      setBio(meta.bio || '¡Fanático del anime en AniStreamJD!');
      setFavoriteGenre(meta.favorite_genre || 'accion');
      setSelectedAvatar(meta.avatar_style || 'luffy');

      // Cargar estadísticas e historial desde Supabase
      try {
        if (currentUser.id) {
          const [favRes, histRes, rateRes, historyDataRes] = await Promise.all([
            supabase.from('user_favorites').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_history').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_ratings').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
            supabase.from('user_history').select('anime_id, episode_number, anime_title, watched_at').eq('user_id', currentUser.id).order('watched_at', { ascending: false }).limit(10),
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
        }
      } catch (e) {
        console.warn('Error loading stats/history:', e);
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

      // 1. Actualizar en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (error) {
        console.warn('Could not sync with Supabase auth:', error.message);
      }

      // 2. Guardar en localStorage para actualización inmediata
      const updatedUser = {
        ...user,
        user_metadata: updatedMetadata,
      };
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
        {/* Cabecera / Volver */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/home"
            className="flex items-center gap-2 text-xs md:text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver al Inicio</span>
          </Link>
          <span className="text-xs uppercase font-bold tracking-widest text-orange-500 bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-500/30">
            Perfil de Usuario
          </span>
        </div>

        {/* TARJETA PRINCIPAL DEL PERFIL */}
        <div className="bg-gradient-to-b from-neutral-900 to-[#121212] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Banner de Usuario Superior */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-white/5">
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr ${activeAvatarObj.color} p-1 shadow-xl flex-shrink-0 relative group`}>
              <div className="w-full h-full rounded-[22px] bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-4xl md:text-5xl select-none">
                {activeAvatarObj.icon}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-white truncate">
                {name || user?.email?.split('@')[0] || 'Miembro AniStream'}
              </h1>
              <p className="text-sm text-neutral-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail size={14} className="text-orange-500" />
                <span className="truncate">{user?.email}</span>
              </p>
              <p className="text-xs text-neutral-400 mt-3 max-w-md italic">
                &ldquo;{bio || 'Sin descripción aún.'}&rdquo;
              </p>
            </div>
          </div>

          {/* Estadísticas de usuario */}
          <div className="grid grid-cols-3 gap-3 py-6 border-b border-white/5">
            <div className="bg-neutral-800/40 border border-white/5 p-3 rounded-2xl text-center">
              <Trophy size={18} className="mx-auto text-purple-400 mb-1" />
              <div className="text-lg md:text-2xl font-bold text-white">{stats.favoritesCount}</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Favoritos</div>
            </div>

            <div className="bg-neutral-800/40 border border-white/5 p-3 rounded-2xl text-center">
              <Clock size={18} className="mx-auto text-orange-400 mb-1" />
              <div className="text-lg md:text-2xl font-bold text-white">{stats.watchedCount}</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Capítulos Vistos</div>
            </div>

            <div className="bg-neutral-800/40 border border-white/5 p-3 rounded-2xl text-center">
              <Shield size={18} className="mx-auto text-emerald-400 mb-1" />
              <div className="text-lg md:text-2xl font-bold text-white">{stats.ratingsCount}</div>
              <div className="text-[10px] md:text-xs text-neutral-400">Calificaciones</div>
            </div>
          </div>

          {/* SECCIÓN CONTINUAR VIENDO & HISTORIAL */}
          <div className="mt-8 pt-6 border-b border-white/5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                <span>Continuar Viendo & Historial</span>
              </h2>

              {continueWatching.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                  title="Borrar historial de reproducción"
                >
                  <Trash2 size={14} />
                  <span>Borrar Historial</span>
                </button>
              )}
            </div>

            {continueWatching.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {continueWatching.map((item) => (
                  <Link
                    key={item.anime_id}
                    href={`/anime/${item.anime_id}`}
                    className="group flex items-center justify-between p-3.5 bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-orange-500/40 rounded-2xl transition-all shadow-md active:scale-98"
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
            ) : (
              <p className="text-xs text-neutral-500 italic bg-neutral-950/40 p-4 rounded-2xl border border-white/5 text-center">
                No tienes animes recientes en tu historial de reproducción.
              </p>
            )}
          </div>

          {/* FORMULARIO DE PERSONALIZACIÓN */}
          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Camera size={18} className="text-orange-500" />
              <span>Personalizar Perfil</span>
            </h2>

            {/* Selector de Avatar */}
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

            {/* Nombre público */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Nombre o Nickname
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu apodo anime..."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors"
                maxLength={40}
              />
            </div>

            {/* Biografía */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Biografía / Estado
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntale a la comunidad tus gustos o animes favoritos..."
                rows={3}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                maxLength={160}
              />
              <span className="text-[10px] text-neutral-500 block text-right mt-1">
                {bio.length}/160 caracteres
              </span>
            </div>

            {/* Género Favorito */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Género Favorito
              </label>
              <select
                value={favoriteGenre}
                onChange={(e) => setFavoriteGenre(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="accion">Acción</option>
                <option value="shounen">Shonen</option>
                <option value="seinen">Seinen</option>
                <option value="sobrenatural">Sobrenatural</option>
                <option value="fantasia">Fantasía</option>
                <option value="comedia">Comedia</option>
                <option value="romance">Romance</option>
                <option value="terror">Terror / Psicológico</option>
              </select>
            </div>

            {/* Feedback de éxito */}
            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs md:text-sm flex items-center gap-2">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-900/30 transition-all active:scale-98"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Perfil</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
