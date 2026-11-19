"use client";

import React from "react";
import BackgroundOrnaments from "@/components/BackgroundOrnaments";
import {
  Orbit,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  BookOpen,
  Terminal,
  FileCheck,
} from "lucide-react";

export interface LandingViewProps {
  onStartAuth: () => void;
  onDemoLogin?: () => void;
}

export default function LandingView({ onStartAuth, onDemoLogin }: LandingViewProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Ornamen Background Y2K Tech-Cyber */}
      <BackgroundOrnaments />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#004aad]/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center text-amber-300 shadow-sm backdrop-blur-md">
              <Orbit className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                ANGKASA
              </span>
            </div>
          </div>

          {/* Nav Links & CTA */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden md:flex items-center gap-5 text-xs font-mono text-white/80">
              <a
                href="#keunggulan"
                className="hover:text-white transition-colors"
              >
                Keunggulan
              </a>
              <a
                href="#alur-kurasi"
                className="hover:text-white transition-colors"
              >
                Alur Kurasi
              </a>
            </nav>

            <button
              type="button"
              onClick={onStartAuth}
              className="px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-xs font-semibold text-[#004aad] transition active:scale-[0.98] cursor-pointer shadow-md"
            >
              Masuk
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-14 sm:pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Lencana Terverifikasi */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-amber-300 text-xs font-mono mb-6 animate-fade-slide-up shadow-sm backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Kurasi Peluang Pelajar &amp; Mahasiswa Terverifikasi</span>
        </div>

        {/* Headline Utama dengan Tipografi Editorial Modern (Sans + Serif Italic + Floating Badges) */}
        <div className="relative max-w-4xl my-2">
          {/* Floating Accent Badge Kiri Atas */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/25 text-amber-300 text-xs font-mono shadow-xl backdrop-blur-md absolute -top-6 -left-4 lg:-left-12 rotate-[-5deg] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Match Engine</span>
          </div>

          {/* Floating Accent Badge Kanan Bawah */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/25 text-white/95 text-xs font-mono shadow-xl backdrop-blur-md absolute -bottom-5 -right-4 lg:-right-10 rotate-[4deg]">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Terverifikasi 100%</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-white leading-tight sm:leading-[1.15]">
            Temukan Peluang Lomba &amp; Beasiswa{" "}
            <span className="block sm:inline font-serif-editorial italic font-normal text-amber-300 tracking-normal text-4xl sm:text-6xl lg:text-7xl">
              Tanpa Information Overload
            </span>
          </h1>
        </div>

        {/* Sub-headline */}
        <p className="mt-5 text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
          Platform agregator terkurasi dengan personalisasi skor kecocokan AI,
          penyusun roadmap persiapan otomatis, dan kolaborasi tim anti-duplikasi.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onStartAuth}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-sm transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-black/20"
          >
            <span>Mulai Eksplorasi</span>
            <ArrowRight className="w-4 h-4 text-[#004aad]" />
          </button>

          <button
            type="button"
            onClick={onDemoLogin || onStartAuth}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 text-white font-medium text-sm transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md shadow-md"
          >
            <span>Masuk Akun Demo</span>
          </button>
        </div>

        {/* Hero UI Preview Mockup (Tampilan Nyata Produk Angkasa) */}
        <div className="mt-14 w-full max-w-4xl rounded-2xl surface-panel p-4 sm:p-6 text-left relative overflow-hidden group">
          {/* Subtle Window Chrome */}
          <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px] font-mono text-white/80 tracking-wider uppercase">
              ANGKASA WORKSPACE &bull; PRATINJAU INTERAKTIF
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-300" />
          </div>

          {/* Grid Mockup: Kartu Peluang + Pratinjau Roadmap Persiapan */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Kartu Peluang Nyata */}
            <div className="md:col-span-7 rounded-xl bg-white/[0.08] border border-white/15 p-4 sm:p-5 flex flex-col justify-between space-y-4 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-white/15 border border-white/25 text-amber-300 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    <span>Terverifikasi Kurator</span>
                  </span>
                  <span className="font-mono text-xs text-amber-300 font-semibold tabular-nums px-2 py-0.5 rounded bg-white/15 border border-white/20">
                    95% Cocok
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-white/70 block">
                    Puspresnas Kemendikbudristek
                  </span>
                  <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                    GEMASTIK XIX 2026 — Pengembangan Perangkat Lunak
                  </h3>
                </div>

                <p className="text-xs text-white/80 leading-relaxed pt-2 border-t border-white/10">
                  <span className="text-amber-300 mr-1.5 font-bold">&bull;</span>
                  Keahlian React, TypeScript, dan System Design Anda sangat selaras untuk lolos ke babak final nasional.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/70">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-white/70" />
                  <span>15 Desember 2026</span>
                </span>
                <span className="text-amber-300 font-medium">Pendaftaran Buka</span>
              </div>
            </div>

            {/* Pratinjau Roadmap AI Mini */}
            <div className="md:col-span-5 rounded-xl bg-white/[0.08] border border-white/15 p-4 sm:p-5 flex flex-col justify-between space-y-3 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-white/80 tracking-wider">
                    AI Preparation Roadmap
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/10 border border-white/15 space-y-0.5">
                    <span className="text-[10px] font-mono text-amber-300 block font-medium">
                      Fase 1 (Minggu 1-2)
                    </span>
                    <p className="text-white font-medium text-[11px]">
                      Penyusunan Proposal &amp; Validasi Masalah
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/10 border border-white/15 space-y-0.5">
                    <span className="text-[10px] font-mono text-amber-300 block font-medium">
                      Fase 2 (Minggu 3-4)
                    </span>
                    <p className="text-white font-medium text-[11px]">
                      Pengembangan Prototipe MVP &amp; Video Demo
                    </p>
                  </div>
                </div>
              </div>

              {/* Roles Tag */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-white/70">
                <span>Kolaborasi:</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-white font-medium">
                  Pengembang
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-sky-300 font-medium">
                  Desainer
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-amber-300 font-medium">
                  Riset &amp; Bisnis
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Category Strip / Ticker */}
      <section className="border-y border-white/20 bg-white/[0.07] backdrop-blur-md py-3.5 my-4 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 whitespace-nowrap text-xs font-mono text-white/90">
          <span className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Lomba Nasional</span>
          </span>
          <span className="text-white/40">&bull;</span>
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Beasiswa Unggulan</span>
          </span>
          <span className="text-white/40">&bull;</span>
          <span className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Seminar &amp; Konferensi</span>
          </span>
          <span className="text-white/40">&bull;</span>
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Preparation Roadmap</span>
          </span>
          <span className="text-white/40">&bull;</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Verifikasi Kurator Anti-Hoaks</span>
          </span>
        </div>
      </section>

      {/* Section Keunggulan Utama (3 Kartu .surface-panel) */}
      <section id="keunggulan" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-medium">
            NILAI UTAMA ANGKASA
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white">
            Dirancang Mengatasi Hambatan Nyata Mahasiswa
          </h2>
          <p className="text-xs sm:text-sm text-white/80">
            Bukan sekadar papan pengumuman biasa, Angkasa menghubungkan kurasi kredibel, kecerdasan buatan, dan kerja sama tim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kartu 1: Kurasi & Verifikasi Manual */}
          <div className="surface-panel p-6 rounded-2xl space-y-4 hover:border-white/35 transition">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-amber-300 tracking-wider font-medium">
                100% Anti-Hoaks
              </span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Kurasi &amp; Verifikasi Manual
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Seluruh informasi diinput kurator dan diaudit verifikator sebelum tayang (<code className="text-amber-300 font-mono">is_verified: true</code>). Bebas penipuan lomba palsu dan link pendaftaran kedaluwarsa.
              </p>
            </div>
          </div>

          {/* Kartu 2: Personalisasi Skor AI */}
          <div className="surface-panel p-6 rounded-2xl space-y-4 hover:border-white/35 transition">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-amber-300 tracking-wider font-medium">
                Kecocokan 1-to-1
              </span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Personalisasi Skor AI
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Pemeringkatan peluang otomatis berdasarkan profil minat, bakat, dan keahlianmu. Dilengkapi tepat 1 kalimat alasan kecocokan tajam bergaya mentor karier.
              </p>
            </div>
          </div>

          {/* Kartu 3: Roadmap & Team Finding */}
          <div className="surface-panel p-6 rounded-2xl space-y-4 hover:border-white/35 transition">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-amber-300 tracking-wider font-medium">
                Kolaborasi Terstruktur
              </span>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Roadmap &amp; Team Finding
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Panduan timeline persiapan bertahap berbasis AI serta pencarian rekan tim kolaborasi lintas bidang keahlian dengan proteksi anti-duplikasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Alur Kurasi Singkat */}
      <section id="alur-kurasi" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/20">
        <div className="surface-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-medium">
                TATA KELOLA KONTEN
              </span>
              <h3 className="text-lg font-semibold text-white tracking-tight mt-0.5">
                Alur Dua Aktor: Kurator Pengupload &amp; Pemverifikasi
              </h3>
            </div>
            <button
              type="button"
              onClick={onStartAuth}
              className="px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-[#004aad] text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-md"
            >
              Coba Sekarang
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 space-y-1.5 backdrop-blur-sm">
              <span className="text-amber-300 font-bold">Langkah 01</span>
              <h4 className="text-white font-medium">Input &amp; Upload Poster</h4>
              <p className="text-white/80 font-sans text-[11px] leading-relaxed">
                Kurator Pengupload mendaftarkan peluang baru beserta poster asli ke bucket penyimpanan terisolasi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 space-y-1.5 backdrop-blur-sm">
              <span className="text-amber-300 font-bold">Langkah 02</span>
              <h4 className="text-white font-medium">Audit &amp; Verifikasi</h4>
              <p className="text-white/80 font-sans text-[11px] leading-relaxed">
                Kurator Pemverifikasi meninjau keabsahan berkas dan mengesahkan status dari unverified menjadi verified.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 space-y-1.5 backdrop-blur-sm">
              <span className="text-sky-300 font-bold">Langkah 03</span>
              <h4 className="text-white font-medium">Tayang di Feed Pelajar</h4>
              <p className="text-white/80 font-sans text-[11px] leading-relaxed">
                Peluang resmi tayang ke feed mahasiswa dan dihitung skor kesesuaiannya dengan profil personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/20 py-8 text-center text-xs font-mono text-white/70">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>ANGKASA &bull; EXPLOR[AI]TION HACKATHON MALANG 2026</span>
          <span className="text-[11px] text-white/60">
            Politeknik Negeri Malang &bull; Tim Angkasa
          </span>
        </div>
      </footer>
    </div>
  );
}
