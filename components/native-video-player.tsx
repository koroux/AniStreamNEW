'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Video.js player if not already created
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-city', 'w-full', 'h-full');
      
      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: autoPlay,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
        poster,
        html5: {
          vhs: {
            overrideNative: true,
          },
        },
      }, () => {
        player.on('ended', () => {
          if (onEnded) onEnded();
        });
      }));
    } else {
      // Update source if src changes
      const player = playerRef.current;
      player.src({ src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' });
      if (poster) player.poster(poster);
      if (autoPlay) player.play();
    }
  }, [src, poster, autoPlay, onEnded]);

  // Dispose player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full bg-black flex items-center justify-center">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
}
