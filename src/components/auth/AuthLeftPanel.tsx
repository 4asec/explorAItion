"use client";

import React from "react";
import { Check } from "lucide-react";

interface AuthLeftPanelProps {
  mode: "login" | "register";
  currentStep: number;
  onStepClick?: (step: number) => void;
}

/**
 * Section Kiri (Panel Visual Sisi Kiri)
 * - Menggunakan token Glassmorphism (.surface-panel) selaras halaman utama
 * - Background royal blue lebih dominan dengan tata letak konten yang ringkas
 * - Ukuran disetarakan dengan section formulir kanan agar pas pada layar laptop tanpa scroll
 */
export default function AuthLeftPanel({
  mode,
  currentStep,
  onStepClick,
}: AuthLeftPanelProps) {
  const steps = [
    {
      number: 1,
      title: "Daftar Akun",
      subtitle: "Nama lengkap, email, username & sandi",
    },
    {
      number: 2,
      title: "Identitas Akademik",
      subtitle: "Institusi, jenjang & tanggal lahir",
    },
    {
      number: 3,
      title: "Profil Domisili",
      subtitle: "Asal provinsi & kota/kabupaten",
    },
  ];

  const loginHighlights = [
    {
      number: 1,
      title: "Autentikasi Aman",
      subtitle: "Verifikasi profil mahasiswa & akses cepat",
    },
    {
      number: 2,
      title: "Rekomendasi Cerdas",
      subtitle: "Peluang lomba, beasiswa & seminar terkurasi",
    },
    {
      number: 3,
      title: "Roadmap Persiapan",
      subtitle: "Strategi kelolosan & kolaborasi tim",
    },
  ];

  const activeItems = mode === "register" ? steps : loginHighlights;

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[480px] bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] flex flex-col justify-between p-5 sm:p-6 lg:p-7 overflow-hidden">
      {/* Ambient Gradient Highlights di Belakang Konten */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#001d4a]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Bagian Atas: Brand Logo ANGKASA */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-white text-xs sm:text-sm font-medium tracking-wide">
          <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center bg-white/10">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span>ANGKASA</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70 border border-white/15">
          Explor[AI]tion
        </span>
      </div>

      {/* Bagian Tengah: Headline & Stepper Kapsul (Lebih Ringkas & Dominan Background) */}
      <div className="relative z-10 my-auto py-3 space-y-4">
        {/* Headline & Deskripsi */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            {mode === "register" ? "Mulai Bersama Kami" : "Selamat Datang Kembali"}
          </h2>
          <p className="text-xs text-white/70 font-normal leading-relaxed">
            {mode === "register"
              ? "Selesaikan langkah mudah ini untuk mendaftarkan akunmu."
              : "Akses rekomendasi personal dan persiapan kompetisimu."}
          </p>
        </div>

        {/* Stepper Kapsul Compact */}
        <div className="space-y-2 pt-1 text-left">
          {activeItems.map((item) => {
            const isActive = mode === "register" && currentStep === item.number;
            const isCompleted = mode === "register" && currentStep > item.number;

            return (
              <div
                key={item.number}
                onClick={() => {
                  if (mode === "register" && onStepClick && item.number < currentStep) {
                    onStepClick(item.number);
                  }
                }}
                className={`w-full p-2.5 sm:p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                  isActive
                    ? "bg-white text-[#004aad] shadow-md scale-[1.01]"
                    : isCompleted
                    ? "bg-white/[0.14] border border-white/20 text-white cursor-pointer hover:bg-white/[0.20]"
                    : "bg-white/[0.05] border border-white/10 text-white/60"
                }`}
              >
                {/* Lingkaran Nomor / Centang */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#004aad] text-white"
                      : isCompleted
                      ? "bg-amber-300 text-[#002b66]"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : item.number}
                </div>

                {/* Judul & Keterangan Langkah */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-[#004aad]" : isCompleted ? "text-white" : "text-white/80"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`text-[10px] font-normal truncate ${
                      isActive ? "text-[#004aad]/80" : "text-white/60"
                    }`}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian Bawah: Informasi Footer Ringkas */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 font-normal">
        <span>Single Source of Truth</span>
        <span>MVP &bull; 2026</span>
      </div>
    </div>
  );
}
