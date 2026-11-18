"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import {
  SpaceShowcase,
  LoginForm,
  RegisterForm,
  AuthAlert,
} from "@/components/auth";
import { Check } from "lucide-react";

export interface AuthPageProps {
  onSuccess?: (user: any, profile: UserProfile) => void;
  initialMode?: "login" | "register";
  onNavigateLanding?: () => void;
}

/**
 * Halaman Autentikasi Fullscreen (AuthPage) di src/page/
 * Langsung fullscreen dua section (kiri visual angkasa & partikel, kanan form) tanpa outer background padding.
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
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Section Kiri: Gambaran Visual Angkasa dengan Partikel Animasi Reveal & Standby (Fullscreen Left) */}
      <div className="w-full lg:w-5/12 lg:min-h-screen shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col">
        <SpaceShowcase />
      </div>

      {/* Section Kanan: Form (Fullscreen Right with Safe Scroll & Spacing) */}
      <div className="flex-1 min-h-screen p-6 sm:p-10 lg:p-12 flex flex-col justify-between items-center bg-slate-950 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto space-y-6 py-4">
          {/* Header Form & Tab Switcher */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                  {mode === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === "login"
                    ? "Akses rekomendasi personal dan persiapan kompetisimu."
                    : "Lengkapi identitas untuk membangun profil pintar AI."}
                </p>
              </div>

              {/* Tab Pindah Mode */}
              <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === "login"
                      ? "bg-slate-800 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === "register"
                      ? "bg-slate-800 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Daftar
                </button>
              </div>
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

          {/* Sesi Pengguna Aktif Feedback */}
          {activeProfile && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 animate-fadeIn">
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

          {/* Footer Form Note */}
          <div className="text-center pt-4">
            <p className="text-[11px] text-slate-500">
              Terhubung dengan Kontrak Skema Database Supabase &bull; Zero Crash Fallback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
