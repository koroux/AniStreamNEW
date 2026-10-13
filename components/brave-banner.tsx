'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, X, ExternalLink } from 'lucide-react';

export function BraveBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificamos si en la sesión actual ya se interactuó con el banner
    const dismissedInSession = sessionStorage.getItem('brave_banner_dismissed');
    if (!dismissedInSession) {
      // Verificamos si el navegador ya es Brave
      const isBraveBrowser = Boolean(
        (navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function'
      );

      // Si ya está en Brave, no tiene sentido molestarlo
      if (!isBraveBrowser) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('brave_banner_dismissed', 'true');
    setIsVisible(false);
  };

  const handleDownload = () => {
    // Al hacer clic, también lo marcamos como visto para no insistir en esta sesión
    sessionStorage.setItem('brave_banner_dismissed', 'true');
    setIsVisible(false);

    // Detección sutil de dispositivo para redirigir a Play Store o web oficial
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.brave.browser';
    } else if (isIOS) {
      window.location.href = 'https://apps.apple.com/app/brave-private-web-browser/id1052879175';
    } else {
      window.location.href = 'https://brave.com/es/download/';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-orange-950/80 via-neutral-900/95 to-neutral-950 border-b border-orange-500/20 backdrop-blur-md px-4 py-3 relative z-40 transition-all duration-300">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm">
        
        {/* Lado izquierdo: Icono y Mensaje explicativo sutil */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 text-orange-400">
            <ShieldCheck size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>¿Quieres ver anime 100% sin publicidad?</span>
              <span className="hidden md:inline text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded border border-orange-500/30 uppercase tracking-wider font-semibold">
                Recomendado
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] md:text-xs">
              Usa el navegador <span className="text-orange-400 font-semibold">Brave</span> para bloquear popups y reproducir episodios en pantalla completa.
            </p>
          </div>
        </div>

        {/* Lado derecho: Botones de Acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-1 sm:pt-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-md transition-all active:scale-95 text-xs"
          >
            <Download size={14} />
            <span>Descargar Brave</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-xs font-medium"
          >
            Ignorar
          </button>
        </div>

      </div>
    </div>
  );
}
