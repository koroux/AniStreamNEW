'use client';

import React, { useRef, useEffect } from 'react';

interface NativeVideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function NativeVideoPlayer({
  src,
  poster,
  onEnded,
  autoPlay = true,
}: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay prevented or failed:', err);
      });
    }
  }, [src]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        autoPlay={autoPlay}
        playsInline
        onEnded={onEnded}
        className="w-full h-full object-contain"
      >
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
}
