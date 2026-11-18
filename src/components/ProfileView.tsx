"use client";

import React, { useState } from "react";
import { UserProfile, Opportunity } from "@/types/schema";
import { updateUserProfile } from "@/lib/apiClient";
import CuratorPanel from "@/components/CuratorPanel";
import {
  ArrowLeft,
  User,
  Mail,
  Building2,
  GraduationCap,
  MapPin,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  SlidersHorizontal,
  Bookmark,
  ShieldCheck,
} from "lucide-react";

export interface ProfileViewProps {
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
  onOpportunityVerified?: (opportunity: Opportunity) => void;
  onOpportunityAdded?: (opportunity: Opportunity) => void;
}

const POPULAR_SUGGESTIONS = [
  "Cybersecurity",
  "Python",
  "Next.js",
  "React",
  "TypeScript",
  "Artificial Intelligence",
  "AI Engineering",
  "Hackathon",
  "UI/UX Design",
  "Machine Learning",
  "Cloud Architecture",
  "Karya Tulis Ilmiah (KTI)",
  "Business Strategy",
  "Public Speaking",
  "Data Analysis",
];

export default function ProfileView({
  userProfile,
  onBack,
  onUpdateProfile,
  onLogout,
  onOpportunityVerified,
  onOpportunityAdded,
}: ProfileViewProps) {
  const initialTags = Array.isArray(userProfile.profiling) ? userProfile.profiling : [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // State Akses Panel Kurator dari Halaman Profil
  const [isCuratorOpen, setIsCuratorOpen] = useState<boolean>(false);

  // State Modal Konfirmasi 2 Langkah Keluar / Logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const toggleTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setFeedback(null);
    if (selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedTags(selectedTags.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()));
    } else {
      setSelectedTags([...selectedTags, trimmed]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setFeedback({ type: "error", text: `Topik "${trimmed}" sudah ada di profil minat.` });
      return;
    }
    setSelectedTags([...selectedTags, trimmed]);
    setCustomTagInput("");
    setFeedback(null);
  };

  const handleSaveProfiling = async () => {
    if (selectedTags.length === 0) {
      setFeedback({
        type: "error",
        text: "Pilih minimal 1 topik minat agar AI dapat mempersonalisasi feed peluang.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await updateUserProfile(userProfile.id, { profiling: selectedTags });
      if (res.error || !res.data) {
        setFeedback({
          type: "error",
          text: res.error || "Gagal menyimpan perubahan minat. Silakan coba lagi.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "Profil minat & keahlian berhasil diperbarui! Rekomendasi AI telah disesuaikan.",
        });
        onUpdateProfile(res.data);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi gangguan koneksi saat memperbarui profil minat.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#004aad]/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white/80" />
            <span>Kembali ke Feed</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-white/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>PROFIL PENGGUNA</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/20 hover:border-rose-400/40 text-xs font-medium text-white/90 hover:text-rose-200 transition active:scale-[0.98] cursor-pointer backdrop-blur-md"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-slide-up">
        {/* User Card Hero (Glassmorphism Surface) */}
        <section className="surface-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Circular Avatar Lingkaran */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 text-[#004aad] font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                {userProfile.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#003175] shadow-sm" />
            </div>

            {/* Info Nama & Identitas */}
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {userProfile.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 font-semibold self-center sm:self-auto">
                  <ShieldCheck className="w-3 h-3 text-amber-300" />
                  <span>Akun Mahasiswa Aktif</span>
                </span>
              </div>

              <p className="text-xs font-mono text-white/70">
                @{userProfile.username || userProfile.email?.split("@")[0] || "mahasiswa"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">{userProfile.institution || "Perguruan Tinggi"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{userProfile.education_level || "Mahasiswa"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{userProfile.city || "Indonesia"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAGIAN MINAT, BAKAT & KEAHLIAN (DIPINDAH DARI NAVBAR) */}
        {/* ========================================================= */}
        <section className="surface-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personalisasi Rekomendasi AI</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Minat, Bakat &amp; Keahlian Personal
              </h2>
              <p className="text-xs text-white/80">
                Kelola topik keahlian Anda di sini. AI menggunakan tag ini untuk menghitung persentase kecocokan peluang.
              </p>
            </div>

            <span className="text-xs font-mono text-white/70 self-start sm:self-auto">
              Total: <strong className="text-white font-bold tabular-nums">{selectedTags.length}</strong> topik
            </span>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 backdrop-blur-md animate-fade-slide-up ${
                feedback.type === "success"
                  ? "bg-amber-400/20 border-amber-300/40 text-amber-200"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Tag Terpilih Saat Ini */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-white/80">
              Daftar Tag Minat Aktif:
            </label>
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/20 min-h-[56px] flex flex-wrap gap-2 items-center backdrop-blur-sm shadow-sm">
              {selectedTags.length === 0 ? (
                <span className="text-xs text-white/50 italic font-mono">
                  Belum ada topik dipilih. Silakan klik rekomendasi di bawah atau ketik topik baru.
                </span>
              ) : (
                selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-semibold tracking-tight shadow-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-amber-100 transition cursor-pointer p-0.5"
                      aria-label={`Hapus tag ${tag}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Tambah Tag Kustom */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-white/80">
              Tambah Topik / Keahlian Baru:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Contoh: Prompt Engineering, Flutter, Data Science..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Rekomendasi Topik Populer */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-mono text-white/80">
              Pilihan Cepat Bidang Populer:
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUGGESTIONS.map((tag) => {
                const isSelected = selectedTags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase()
                );
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-white text-[#004aad] font-bold border border-white shadow-md"
                        : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tombol Simpan Perubahan Minat */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
            <p className="text-xs text-white/70 text-center sm:text-left">
              Perubahan minat akan otomatis memperbarui skor kecocokan di feed utama Anda.
            </p>
            <button
              type="button"
              onClick={handleSaveProfiling}
              disabled={isSaving || selectedTags.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-xs transition active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-black/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#004aad]" />
                  <span>Menyimpan Minat...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#004aad]" />
                  <span>Simpan Perubahan Minat</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Akses Fitur Manajemen Tambahan (Panel Kurator) */}
        <section className="surface-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-white flex items-center justify-center sm:justify-start gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
              <span>Panel Tata Kelola Kurator &amp; Verifikator</span>
            </h3>
            <p className="text-xs text-white/80">
              Akses mode manajemen untuk mendaftarkan peluang baru manual atau memverifikasi antrean.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCuratorOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-semibold text-white transition active:scale-[0.98] cursor-pointer backdrop-blur-md shadow-sm shrink-0"
          >
            Buka Panel Kurator
          </button>
        </section>
      </main>

      {/* Modal Dialog Konfirmasi 2 Langkah Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#002b66]/90 border border-white/20 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5 animate-fade-slide-up">
            {/* Header Modal */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 shrink-0">
                <LogOut className="w-5 h-5 text-rose-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Konfirmasi Keluar Akun
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari sesi Angkasa? Anda perlu masuk kembali untuk mengakses rekomendasi personal.
                </p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition active:scale-[0.98] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  onLogout();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-xs font-bold text-white transition active:scale-[0.98] cursor-pointer shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kurator */}
      <CuratorPanel
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        onOpportunityVerified={onOpportunityVerified}
        onOpportunityAdded={onOpportunityAdded}
      />

      {/* Footer */}
      <footer className="text-center py-6 text-[11px] text-white/60 font-mono border-t border-white/20 mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
