"use client";

import { useState } from "react";
import { AuthPage } from "@/page";
import { UserProfile } from "@/types/schema";
import { logoutUser } from "@/lib/apiClient";
import {
  User,
  LogOut,
  Sparkles,
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAuthSuccess = (user: any, profile: UserProfile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setCurrentUser(null);
      setCurrentProfile(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Jika belum login, tampilkan AuthPage (Proteksi Autentikasi sesuai REQUIREMENTS.md P1 & Aturan 3.1)
  if (!currentProfile) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // Tampilan Dasbor Sesi Aktif setelah Login / Register Berhasil
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Top Navbar Bar / Sesi Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 tracking-wide">ANGKASA</span>
              <span className="text-[10px] block text-emerald-400 font-medium">Sesi Terautentikasi</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-rose-300 hover:text-rose-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? "Mengakhiri..." : "Keluar (Logout)"}</span>
          </button>
        </div>

        {/* Success Feedback Card */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-300">Autentikasi Berhasil!</p>
            <p className="text-slate-400 text-xs">
              Akun Anda telah terverifikasi dalam sistem. Data siap digunakan untuk personalisasi AI Feed &amp; Roadmap.
            </p>
          </div>
        </div>

        {/* User Profile Overview Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">{currentProfile.full_name}</h2>
                <p className="text-xs text-slate-400">@{currentProfile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Mahasiswa Terverifikasi
              </span>
            </div>
          </div>

          {/* Grid Informasi Profil Sesuai Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Alamat Email
              </span>
              <p className="font-medium text-slate-200">{currentProfile.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Institusi Pendidikan
              </span>
              <p className="font-medium text-slate-200">{currentProfile.institution}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Jenjang Pendidikan
              </span>
              <p className="font-medium text-slate-200">{currentProfile.education_level}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Lahir
              </span>
              <p className="font-medium text-slate-200">{currentProfile.birth_date}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Asal Wilayah
              </span>
              <p className="font-medium text-slate-200">
                {currentProfile.city}, {currentProfile.province}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>ID Pengguna: <code className="text-slate-300 font-mono text-[11px]">{currentProfile.id}</code></span>
            <span className="text-emerald-400 font-medium">Siap melanjutkan ke tahap Profiling (P2)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
