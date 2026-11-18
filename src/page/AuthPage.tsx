"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import {
  SpaceCanvas,
  LoginForm,
  RegisterForm,
  AuthAlert,
} from "@/components/auth";
import { Sparkles, Check } from "lucide-react";

export interface AuthPageProps {
  onSuccess?: (user: any, profile: UserProfile) => void;
  initialMode?: "login" | "register";
  onNavigateLanding?: () => void;
}

/**
 * Halaman Autentikasi (AuthPage)
 * Menampilkan animasi partikel luar angkasa murni sebagai background fullscreen,
 * dengan form Login & Register di dalam container card elegan di bagian depan.
 */
export default function AuthPage({
  onSuccess,
  initialMode = "login",
  onNavigateLanding,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Status Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAuthSuccess = (user: any, profile: UserProfile) => {
    setErrorMessage(null);
    setSuccessMessage(
      mode === "login"
        ? "Berhasil masuk! Mengarahkan ke sistem..."
        : "Pendaftaran akun berhasil! Selamat datang di Angkasa."
    );
    setActiveProfile(profile);

    if (onSuccess) {
      onSuccess(user, profile);
    }
  };

  const handleAuthError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* ================================================================= */}
      {/* FULLSCREEN BACKGROUND: HANYA PARTIKEL LUAR ANGKASA (REVEAL & STANDBY) */}
      {/* ================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SpaceCanvas />
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[420px] h-[420px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* ================================================================= */}
      {/* CONTAINER LOGIN & REGISTER DI DEPAN BACKGROUND PARTIKEL */}
      {/* ================================================================= */}
      <div className="w-full max-w-lg z-10 relative my-6">
        <div className="bg-slate-900/85 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Header Card: Branding & Tab Switcher */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                {mode === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {mode === "login"
                  ? "Akses rekomendasi personal dan persiapan kompetisimu."
                  : "Lengkapi identitas untuk membangun profil pintar AI."}
              </p>
            </div>

          </div>

          {/* Error & Success Alert Components */}
          <AuthAlert type="error" message={errorMessage} />
          <AuthAlert type="success" message={successMessage} />

          {/* Form Component: Login or Register */}
          {mode === "login" ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Sesi Pengguna Aktif Feedback (Jika Berhasil) */}
          {activeProfile && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Sesi Terverifikasi: {activeProfile.full_name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {activeProfile.education_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeProfile.institution} &bull; {activeProfile.city}, {activeProfile.province}
              </p>
            </div>
          )}

          {/* Pertanyaan Akun & Pengalihan Mode */}
          <div className="text-center pt-3 border-t border-slate-800/80">
            {mode === "login" ? (
              <p className="text-xs text-slate-400">
                Belum memiliki akun Angkasa?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-300 transition cursor-pointer"
                >
                  Daftar akun sekarang
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Sudah memiliki akun terdaftar?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-300 transition cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
