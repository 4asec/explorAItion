"use client";

import React from "react";
import { Sparkles, CheckCircle2, Users } from "lucide-react";
import SpaceCanvas from "./SpaceCanvas";

/**
 * Section Kiri: Gambaran Visual Angkasa (Fullscreen Left Showcase)
 * Menampilkan animasi partikel kosmik, planetary glow orbit, branding ANGKASA, dan 3 nilai unggulan platform secara fullscreen.
 */
export default function SpaceShowcase() {
  return (
    <div className="lg:col-span-5 relative min-h-[420px] lg:min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
      {/* Kanvas Animasi Partikel */}
      <SpaceCanvas />

      {/* Cosmic Planetary Glow Orbit Accent (Standby Animation) */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-emerald-500/20 bg-emerald-500/5 blur-sm pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full border border-teal-500/10 pointer-events-none" />

      {/* Bagian Atas: Branding & Headline */}
      <div className="relative z-10 space-y-4">
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-100 leading-snug">
            Jelajahi Angkasa Potensi Akademik &amp; Kariermu
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
            Platform kecerdasan peluang generasi emas: Lomba terkurasi, beasiswa kredibel, dan roadmap persiapan terstruktur berbasis AI.
          </p>
        </div>
      </div>

    </div>
  );
}
