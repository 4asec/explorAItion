"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import {
  LoginForm,
  RegisterForm,
  AuthAlert,
} from "@/components/auth";
import { Check } from "lucide-react";

export interface AuthPageProps {
  onSuccess?: (user: any, profile: UserProfile, authMode?: "login" | "register") => void;
  initialMode?: "login" | "register";
  onNavigateLanding?: () => void;
}

/**
 * Halaman Autentikasi (AuthPage)
 * - Container section kiri ditiadakan, tampilan terpusat pada satu kartu Glassmorphism (.surface-panel).
 * - Step register berupa 3 garis berjejer yang ditempatkan tepat di bawah judul/subjudul registrasi.
 * - Setelah register selesai, user diarahkan ke profil untuk pengisian AI Career & Skill Insight.
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
        : "Pendaftaran akun berhasil! Mengarahkan ke profil..."
    );
    setActiveProfile(profile);

    if (onSuccess) {
      onSuccess(user, profile, mode);
    }
  };

  const handleAuthError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-white/20 selection:text-white overflow-y-auto lg:overflow-hidden">
      {/* Subtle Ambient Radial Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#001d4a]/50 rounded-full blur-[130px]" />
      </div>

      {/* Main Single Centered Container Card */}
      <div className="w-full max-w-md mx-auto z-10 relative my-auto py-2">
        <div className="w-full bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-6 sm:p-8 relative space-y-4">
          
          {/* Header Judul & Subjudul */}
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

          {/* 3 Garis Berjejer Menggambarkan Step User (Ditempatkan di bawah judul/subjudul) */}
          {mode === "register" && (
            <div className="space-y-1.5 py-1">
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep >= 1 ? "bg-white shadow-sm" : "bg-white/20"
                  }`}
                  title="Langkah 1: Akun"
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep >= 2 ? "bg-white shadow-sm" : "bg-white/20"
                  }`}
                  title="Langkah 2: Akademik"
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep >= 3 ? "bg-white shadow-sm" : "bg-white/20"
                  }`}
                  title="Langkah 3: Domisili"
                />
              </div>
            </div>
          )}

          {/* Tombol Single Sign-On (Hanya di Step 1 Register & Login) */}
          {(mode === "login" || currentStep === 1) && (
            <div className="space-y-3">
            </div>
          )}

          {/* Feedback Alerts */}
          <AuthAlert type="error" message={errorMessage} />
          <AuthAlert type="success" message={successMessage} />

          {/* Formulir Aktif: Login atau Register (Bertahap 3 Step) */}
          <div className="w-full">
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
  );
}
