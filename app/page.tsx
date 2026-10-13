'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Play, Rocket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados del Formulario
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. FUNCIÓN PARA ENTRAR COMO INVITADO
  const handleGuestAccess = () => {
    // Guardamos la "credencial" de invitado
    localStorage.setItem('userMode', 'guest');
    localStorage.removeItem('userData'); // Limpiamos datos viejos por si acaso
    sessionStorage.removeItem('brave_banner_dismissed'); // Mostramos el banner una vez en este nuevo inicio
    router.push('/home');
  };

  // 2. FUNCIÓN PARA LOGIN / REGISTRO
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegistering) {
        // --- LÓGICA DE REGISTRO ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // Guardamos el nombre para el saludo "Bienvenido Jared"
            },
          },
        });

        if (error) throw error;

        // IMPORTANTE: Si Supabase pide confirmar email, data.user puede ser null o requerir espera.
        // Si tu proyecto tiene desactivada la confirmación de email, esto entra directo.
        if (data.user) {
          saveUserAndRedirect(data.user);
        } else {
          setErrorMsg('Revisa tu correo para confirmar la cuenta.');
        }

      } else {
        // --- LÓGICA DE INICIO DE SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          saveUserAndRedirect(data.user);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // 3. EL ESLABÓN PERDIDO: GUARDAR DATOS EN EL NAVEGADOR
  const saveUserAndRedirect = (user: any) => {
    // A. Marcamos que es un usuario registrado
    localStorage.setItem('userMode', 'registered');
    
    // B. Guardamos el objeto usuario (para que la Navbar lea el nombre y Avatar)
    localStorage.setItem('userData', JSON.stringify(user));

    // C. Reiniciamos el banner para mostrarlo una vez en este inicio
    sessionStorage.removeItem('brave_banner_dismissed');

    // D. Nos vamos al Home
    router.push('/home');
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-black font-sans">
      
      {/* FONDO ANIMADO (Imagen de One Piece o la que gustes) */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center animate-pulse-slow"
        style={{ backgroundImage: "url('https://wallpapercave.com/wp/wp9386912.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 via-20% to-transparent z-0" />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md p-8 flex flex-col justify-center min-h-screen lg:ml-20">
        
        {/* LOGO */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white">
            <Play fill="white" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
              Ani<span className="text-orange-500">Stream</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">By Jared Ortiz</p>
          </div>
        </div>

        {/* CAJA DE LOGIN */}
        <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {isRegistering ? 'Únete a la mejor comunidad de anime.' : 'Ingresa para continuar viendo tus series.'}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* CAMPO NOMBRE (Solo en registro) */}
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Monkey D. Luffy"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nakama@anistream.com"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition-colors pr-10"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'REGISTRARSE' : 'INICIAR SESIÓN')}
            </button>
          </form>

          {/* TOGGLE REGISTRO / LOGIN */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {isRegistering ? '¿Ya tienes cuenta? ' : '¿Aún no eres miembro? '}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-orange-500 font-bold hover:underline"
            >
              {isRegistering ? 'Inicia Sesión' : 'Regístrate gratis'}
            </button>
          </div>

          <div className="my-6 border-t border-white/10 relative">
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-[#0d0d0d] px-2 text-xs text-gray-500 font-bold">O CONTINÚA COMO</span>
          </div>

          {/* BOTÓN INVITADO */}
          <button 
            onClick={handleGuestAccess}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            <Rocket size={18} className="text-yellow-500 group-hover:scale-110 transition-transform"/> Entrar como Invitado
          </button>

        </div>
      </div>
    </div>
  );
}