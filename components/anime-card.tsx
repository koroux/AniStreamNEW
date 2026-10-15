"use client";

import Link from "next/link";
import { Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  id: string;
  title: string;
  image?: string;
  poster?: string;
  type?: string;
  rating?: number | string;
  isNew?: boolean;
  href?: string;
  [key: string]: any;
}

export function AnimeCard({
  id,
  title,
  image,
  poster,
  type,
  rating,
  isNew,
  href,
}: AnimeCardProps) {
  const displayImage = image || poster || '';
  const link = href || `/anime/${id}`;

  return (
    <Link href={link} className="group block relative">
      <div className="relative overflow-hidden rounded-2xl aspect-[2/3] bg-neutral-900 border border-white/5">
        {/* Poster Image */}
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Type Badge */}
        {type && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-orange-600 rounded-lg text-[10px] font-bold text-white shadow-lg">
            {type}
          </div>
        )}

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className={cn(
            "w-14 h-14 rounded-full bg-orange-600/90 flex items-center justify-center backdrop-blur-sm",
            "transform scale-50 group-hover:scale-100 transition-transform duration-300",
            "shadow-[0_0_30px_rgba(255,107,0,0.5)]"
          )}>
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight group-hover:text-orange-400 transition-colors">
            {title}
          </h3>
        </div>

        {/* Border Glow Effect */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all duration-300 pointer-events-none" />
      </div>
    </Link>
  );
}