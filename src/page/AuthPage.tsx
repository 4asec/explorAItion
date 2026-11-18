"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import {
  AuthLeftPanel,
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
 * Halaman Autentikasi (AuthPage)
 * - Background Utama: bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white
 * - Tata Letak: Grid 2 kolom seimbang (50% - 50%) dengan ketinggian serasi
 * - Responsif Layar Laptop: Menggunakan padding terukur agar pas di viewport tanpa scroll vertikal
 */
export default function AuthPage({
  onSuccess,
  initialMode = "register",
  onNavigateLanding,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Status Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setCurrentStep(1);
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
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex items-center justify-center p-3 sm:p-5 lg:p-6 selection:bg-white/20 selection:text-white overflow-y-auto lg:overflow-hidden">
      {/* Subtle Ambient Radial Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#001d4a]/50 rounded-full blur-[130px]" />
      </div>

      {/* Main Grid Wrapper: 2 Kolom Seimbang & Symmetrical */}
      <div className="w-full max-w-4xl lg:max-w-5xl z-10 relative my-auto py-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
          
          {/* ============================================================= */}
          {/* SECTION KIRI: PANEL STEPPER BERSIH & DOMINAN BACKGROUND       */}
          {/* ============================================================= */}
          <div className="w-full h-full">
            <AuthLeftPanel
              mode={mode}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>

          {/* ============================================================= */}
          {/* SECTION KANAN: KARTU GLASSMORPHISM FORMULIR (.surface-panel) */}
          {/* ============================================================= */}
          <div className="w-full h-full bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 sm:p-6 lg:p-7 flex flex-col justify-between relative space-y-4">
            
            {/* Bagian Atas: Header Judul & Subjudul */}
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                {mode === "register" ? "Daftar Akun Baru" : "Masuk ke Akun"}
              </h1>
              <p className="text-xs text-white/70 font-normal">
                {mode === "register"
                  ? currentStep === 1
                    ? "Lengkapi data diri Anda untuk membuat akun baru."
                    : currentStep === 2
                    ? "Lengkapi identitas akademik dan institusi Anda."
                    : "Lengkapi lokasi asal domisili Anda."
                  : "Masukkan email dan kata sandi untuk mengakses akun."}
              </p>
            </div>

            {/* Tombol Single Sign-On (Hanya di Step 1 Register & Login) */}
            {(mode === "login" || currentStep === 1) && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAuthError(
                        "Autentikasi Google OAuth dalam tahap integrasi hackathon. Silakan gunakan pendaftaran formulir."
                      );
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  {/* Github Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleAuthError(
                        "Autentikasi GitHub OAuth dalam tahap integrasi hackathon. Silakan gunakan pendaftaran formulir."
                      );
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                {/* Divider Atau */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/15" />
                  </div>
                  <span className="relative px-2.5 bg-transparent text-[10px] uppercase tracking-wider text-white/50 font-medium">
                    Atau
                  </span>
                </div>
              </div>
            )}

            {/* Feedback Alerts */}
            <AuthAlert type="error" message={errorMessage} />
            <AuthAlert type="success" message={successMessage} />

            {/* Formulir Aktif: Login atau Register (Bertahap 3 Step) */}
            <div className="flex-1 flex flex-col justify-center">
              {mode === "login" ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              ) : (
                <RegisterForm
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}
            </div>

            {/* Feedback Sesi Pengguna Aktif (Token Badge Terverifikasi) */}
            {activeProfile && (
              <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/15 space-y-1 animate-fadeIn font-normal">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-300/20 text-amber-300 border border-amber-300/30 rounded-full px-3 py-0.5 text-xs font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Sesi Terverifikasi: {activeProfile.full_name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-normal">
                    {activeProfile.education_level}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 font-normal">
                  {activeProfile.institution} &bull; {activeProfile.city}, {activeProfile.province}
                </p>
              </div>
            )}

            {/* Pertanyaan Akun & Toggle Mode */}
            <div className="text-center pt-1 border-t border-white/10">
              {mode === "register" ? (
                <p className="text-xs text-white/70 font-normal">
                  Sudah memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-white hover:text-white/90 font-medium hover:underline transition cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              ) : (
                <p className="text-xs text-white/70 font-normal">
                  Belum memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-white hover:text-white/90 font-medium hover:underline transition cursor-pointer"
                  >
                    Daftar akun baru
                  </button>
                </p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
