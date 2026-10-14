'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/navbar';
import { AnimeCard } from '@/components/anime-card';
import { Loader2, Heart } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      // 1. Verificar Usuario
      const savedUser = localStorage.getItem('userData');
      if (!savedUser) {
        router.push('/'); // Si no hay usuario, fuera de aquí
        return;
      }
      
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // 2. Pedir favoritos a Supabase
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', parsedUser.id || (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error cargando favoritos:', error);
      } else if (data) {
        const sanitized = await Promise.all(data.map(async (fav) => {
          let p = fav.poster;
          if (!p || p.includes('logo') || p.includes('banner') || !p.startsWith('http')) {
            try {
              const searchRes = await fetch(`/api/search?q=${encodeURIComponent(fav.anime_id)}`);
              const searchData = await searchRes.json();
              if (Array.isArray(searchData) && searchData.length > 0 && searchData[0].poster && !searchData[0].poster.includes('logo')) {
                p = searchData[0].poster;
                await supabase.from('user_favorites').update({ poster: p }).eq('user_id', parsedUser.id).eq('anime_id', fav.anime_id);
              }
            } catch (e) {}
          }
          if (!p || p.includes('logo') || p.includes('banner')) {
            p = `https://picsum.photos/seed/${fav.anime_id}/300/450`;
          }
          return { ...fav, poster: p };
        }));
        setFavorites(sanitized);
      }
      
      setLoading(false);
    };

    loadFavorites();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      
      {/* Navbar detectando usuario logueado */}
      <Navbar user={user} isGuest={false} />

      <div className="container mx-auto px-6 pt-32">
        
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="text-red-500 fill-current" size={32} />
          <h1 className="text-3xl font-bold">Mi Lista</h1>
          <span className="bg-white/10 text-gray-400 text-sm font-bold px-3 py-1 rounded-full">
            {favorites.length}
          </span>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-600" size={40} />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((fav) => (
              // Mapeamos los datos de la tabla a las props del Card
              <AnimeCard 
                key={fav.id} 
                id={fav.anime_id} 
                title={fav.title} 
                image={fav.poster || fav.image_url} // Aceptamos ambos nombres por si acaso
              />
            ))}
          </div>
        ) : (
          // Estado Vacío (Si no ha guardado nada)
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Heart size={40} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu lista está vacía</h2>
            <p className="text-gray-400 max-w-md">
              Aún no has guardado ningún anime. Ve al inicio y dale al botón &quot;+ Mi Lista&quot; en tus series favoritas.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}