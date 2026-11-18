"use client";

import React from "react";
import { Sparkles, CheckCircle2, Users } from "lucide-react";
import SpaceCanvas from "./SpaceCanvas";

/**
 * Section Kiri: Gambaran Visual Angkasa (Space Particle Showcase)
 * Menampilkan animasi partikel kosmik, planetary glow orbit, branding ANGKASA, dan 3 nilai unggulan platform.
 */
export default function SpaceShowcase() {
  return (
    <div className="lg:col-span-5 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
      {/* Kanvas Animasi Partikel */}
      <SpaceCanvas />

      {/* Cosmic Planetary Glow Orbit Accent (Standby Animation) */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border border-emerald-500/20 bg-emerald-500/5 blur-sm pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full border border-teal-500/10 pointer-events-none" />

      {/* Bagian Atas: Branding & Headline */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-lg shadow-emerald-500/5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span>ANGKASA INTELLIGENCE</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 leading-snug">
            Jelajahi Angkasa Potensi Akademik &amp; Kariermu
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Platform kecerdasan peluang generasi emas: Lomba terkurasi, beasiswa kredibel, dan roadmap persiapan terstruktur berbasis AI.
          </p>
        </div>
      </div>

      {/* Bagian Tengah: Nilai Unggulan Platform (Feature Highlights) */}
      <div className="relative z-10 my-8 space-y-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">100% Peluang Terverifikasi</p>
            <p className="text-slate-400 mt-0.5">Bebas hoaks dan kedaluwarsa, seluruh data dikurasi berkala.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">Personalisasi AI Instan</p>
            <p className="text-slate-400 mt-0.5">Skor kecocokan &amp; rekomendasi taktis berbasis minat serta bakatmu.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">Team Finding Anti-Duplikasi</p>
            <p className="text-slate-400 mt-0.5">Membentuk tim lintas keahlian (Hacker, Hipster, Hustler) secara tertib.</p>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Footer Info */}
      <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Explor[AI]tion Hackathon 2026</span>
        <span className="text-emerald-400/90 font-mono">v1.0-mvp</span>
      </div>
    </div>
  );
}
