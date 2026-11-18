"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import { loginDemoUser } from "@/lib/apiClient";
import {
  SpaceShowcase,
  DemoLoginButton,
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
 * Halaman Autentikasi (AuthPage) di src/page/
 * Mengorkestrasi komponen-komponen terpisah dari src/components/auth/
 */
export default function AuthPage({
  onSuccess,
  initialMode = "login",
  onNavigateLanding,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDemoLoading(true);

    try {
      const response = await loginDemoUser();

      if (response.error || !response.data) {
        setErrorMessage(response.error || "Gagal mengakses sesi akun demo.");
        return;
      }

      setSuccessMessage("Autentikasi akun demo berhasil! Memuat data juri/penguji...");
      setActiveProfile(response.data.profile);

      if (onSuccess) {
        onSuccess(response.data.user, response.data.profile);
      }
    } catch (err) {
      setErrorMessage("Gagal menghubungkan sesi demo. Silakan coba beberapa saat lagi.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Decorative Radial Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Split Layout: Kiri SpaceShowcase, Kanan Form Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-xl overflow-hidden z-10 min-h-[640px]">
        {/* Section Kiri: Gambaran Visual Angkasa dengan Partikel Animasi Reveal & Standby */}
        <SpaceShowcase />

        {/* Section Kanan: Form Biasa */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-slate-900/40">
          <div className="w-full max-w-lg mx-auto space-y-6">
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
                <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto">
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

              {/* 1-Klik Akun Demo Component */}
              <DemoLoginButton
                onDemoLogin={handleDemoLogin}
                isLoading={isLoading || isDemoLoading}
              />
            </div>

            {/* Error & Success Alert Components */}
            <AuthAlert type="error" message={errorMessage} />
            <AuthAlert type="success" message={successMessage} />

            {/* Form Component: Login or Register */}
            {mode === "login" ? (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                isLoading={isLoading || isDemoLoading}
                setIsLoading={setIsLoading}
              />
            ) : (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                isLoading={isLoading || isDemoLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {/* Sesi Pengguna Aktif Feedback */}
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

            {/* Footer Form Note */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-500">
                Terhubung dengan Kontrak Skema Database Supabase &bull; Zero Crash Fallback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
