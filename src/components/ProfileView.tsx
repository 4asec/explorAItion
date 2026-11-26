"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Opportunity, ProfileInsightResult } from "@/types/schema";
import { updateUserProfile, fetchProfileInsight, uploadUserAvatar } from "@/lib/apiClient";
import BackgroundOrnaments from "@/components/BackgroundOrnaments";
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
  Bookmark,
  ShieldCheck,
  Compass,
  Tag,
  RotateCcw,
  ChevronRight,
  Trash2,
  Camera,
  Edit3,
  Save,
  Calendar,
} from "lucide-react";

export interface ProfileViewProps {
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
  onOpportunityVerified?: (opportunity: Opportunity) => void;
  onOpportunityAdded?: (opportunity: Opportunity) => void;
  initialFocusInsight?: boolean;
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
  initialFocusInsight = false,
}: ProfileViewProps) {
  const initialTags = Array.isArray(userProfile.profiling) ? userProfile.profiling : [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // State Edit Profil Lengkap
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>(userProfile.full_name || "");
  const [editUsername, setEditUsername] = useState<string>(userProfile.username || "");
  const [editInstitution, setEditInstitution] = useState<string>(userProfile.institution || "");
  const [editEducationLevel, setEditEducationLevel] = useState<string>(userProfile.education_level || "Mahasiswa D3/D4/S1");
  const [editProvince, setEditProvince] = useState<string>(userProfile.province || "");
  const [editCity, setEditCity] = useState<string>(userProfile.city || "");
  const [editBirthDate, setEditBirthDate] = useState<string>(userProfile.birth_date || "");

  // State Custom Avatar Upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi form saat data userProfile berubah
  useEffect(() => {
    setEditFullName(userProfile.full_name || "");
    setEditUsername(userProfile.username || "");
    setEditInstitution(userProfile.institution || "");
    setEditEducationLevel(userProfile.education_level || "Mahasiswa D3/D4/S1");
    setEditProvince(userProfile.province || "");
    setEditCity(userProfile.city || "");
    setEditBirthDate(userProfile.birth_date || "");
  }, [userProfile]);

  // Handler Upload Foto Profil (Maksimal 2 MB, MIME: jpeg/png/webp)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa memilih file yang sama saat retry
    e.target.value = "";

    const allowedMime = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMime.includes(file.type)) {
      setFeedback({
        type: "error",
        text: "Format file tidak didukung. Harap pilih gambar berformat JPG, PNG, atau WebP.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({
        type: "error",
        text: "Ukuran gambar melebihi batas maksimal 2 MB. Silakan kompres gambar terlebih dahulu.",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setFeedback(null);

    try {
      const res = await uploadUserAvatar(userProfile.id, file);
      if (res.error || !res.data) {
        setFeedback({
          type: "error",
          text: res.error || "Gagal mengunggah foto profil.",
        });
      } else {
        const updated: UserProfile = {
          ...userProfile,
          avatar_url: res.data,
        };
        onUpdateProfile(updated);
        setFeedback({
          type: "success",
          text: "Foto profil berhasil diperbarui secara real-time!",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat mengunggah foto profil.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handler Simpan Data Profil Akademik & Identitas Lengkap
  const handleSaveFullProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Nama lengkap wajib diisi minimal 2 karakter.",
      });
      return;
    }

    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setFeedback({
        type: "error",
        text: "Username wajib diisi minimal 3 karakter alfanumerik.",
      });
      return;
    }

    setIsSavingProfile(true);
    setFeedback(null);

    try {
      const cleanUsername = editUsername.trim().replace(/^@/, "").toLowerCase();
      const payload: Partial<UserProfile> = {
        full_name: editFullName.trim(),
        username: cleanUsername,
        institution: editInstitution.trim() || "Perguruan Tinggi",
        education_level: editEducationLevel.trim() || "Mahasiswa D3/D4/S1",
        province: editProvince.trim() || "Indonesia",
        city: editCity.trim() || "Indonesia",
        birth_date: editBirthDate.trim() || "2004-01-01",
      };

      const res = await updateUserProfile(userProfile.id, payload);
      if (res.error || !res.data) {
        setFeedback({
          type: "error",
          text: res.error || "Gagal menyimpan perubahan data profil.",
        });
      } else {
        onUpdateProfile(res.data);
        setIsEditingProfile(false);
        setFeedback({
          type: "success",
          text: "Data identitas & profil akademik berhasil diperbarui!",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi gangguan sistem saat memperbarui profil.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // State Modal Konfirmasi 2 Langkah Keluar / Logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // State Modal Popup Panduan AI Career & Skill Insight
  const [showInsightGuidePopup, setShowInsightGuidePopup] = useState<boolean>(
    Boolean(initialFocusInsight)
  );

  // Auto-scroll ke container AI Career & Skill Insight jika user baru mendaftar
  React.useEffect(() => {
    if (initialFocusInsight) {
      setShowInsightGuidePopup(true);
      const timer = setTimeout(() => {
        const targetElement = document.getElementById("ai-career-skill-insight");
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [initialFocusInsight]);

  // State Fitur AI Career & Skill Insight (Selalu dimulai null, hanya muncul setelah user menekan tombol Analisis)
  const [userStory, setUserStory] = useState<string>("");
  const [isAnalyzingStory, setIsAnalyzingStory] = useState<boolean>(false);
  const [storyInsightResult, setStoryInsightResult] = useState<ProfileInsightResult | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);

  const INSIGHT_STORAGE_KEY = `angkasa_ai_insight_${userProfile.id}`;

  const handleAnalyzeStory = async () => {
    if (!userStory.trim()) {
      setStoryError("Tuliskan cerita singkat mengenai minat, keahlian, atau pengalamanmu terlebih dahulu.");
      return;
    }

    setIsAnalyzingStory(true);
    setStoryError(null);

    try {
      const res = await fetchProfileInsight(userStory.trim());
      if (res.error || !res.data) {
        setStoryError(res.error || "Gagal mendapatkan insight profil dari AI. Silakan coba kembali.");
      } else {
        const result = res.data;
        setStoryInsightResult(result);

        // Simpan ke localStorage cadangan
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(INSIGHT_STORAGE_KEY, JSON.stringify(result));
          } catch (e) {
            console.warn("[Insight Cache Save Warning]", e);
          }
        }

        // Ganti (replace) daftar tag minat aktif dengan hasil ekstraksi AI terbaru
        if (Array.isArray(result.extractedTags) && result.extractedTags.length > 0) {
          setSelectedTags(Array.from(new Set(result.extractedTags)));
        }
      }
    } catch {
      setStoryError("Terjadi gangguan koneksi saat menganalisis narasi profil.");
    } finally {
      setIsAnalyzingStory(false);
    }
  };

  const handleResetStory = () => {
    setStoryInsightResult(null);
    setUserStory("");
    setStoryError(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(INSIGHT_STORAGE_KEY);
      } catch (e) {
        console.warn("[Insight Cache Remove Warning]", e);
      }
    }
  };

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

  const handleSaveAndGoToFeed = async () => {
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
        onUpdateProfile(res.data);
        onBack();
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Ornamen Background Y2K Tech-Cyber */}
      <BackgroundOrnaments />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#004aad]/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white/80" />
            <span className="hidden xs:inline sm:inline">Kembali</span>
            <span className="inline xs:hidden">Feed</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-white/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs tracking-wider">PROFIL PENGGUNA</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/20 hover:border-rose-400/40 text-xs font-medium text-white/90 hover:text-rose-200 transition active:scale-[0.98] cursor-pointer backdrop-blur-md"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-slide-up">
        {/* User Card Hero (Glassmorphism Surface) */}
        <section className="surface-panel p-6 sm:p-8 rounded-2xl space-y-6">
          {/* Feedback Alert Notifikasi */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 backdrop-blur-md animate-fade-slide-up ${
                feedback.type === "success"
                  ? "bg-amber-400/20 border-amber-300/40 text-amber-200"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-white/60 hover:text-white transition cursor-pointer p-1"
                title="Tutup Notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Circular Avatar Lingkaran Interaktif */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 text-[#004aad] font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userProfile.full_name?.charAt(0).toUpperCase() || "U"}</span>
                )}
              </div>

              {/* Overlay / Tombol Kamera Unggah Foto */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#002b66] hover:bg-[#003d91] text-amber-300 border-2 border-white/40 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                title="Ubah Foto Profil (Maks. 2 MB)"
                aria-label="Ubah Foto Profil"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#003175] shadow-sm" />
            </div>

            {/* Info Nama & Identitas atau Form Edit Profil */}
            {!isEditingProfile ? (
              <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {userProfile.full_name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 font-semibold self-center sm:self-auto">
                      <ShieldCheck className="w-3 h-3 text-amber-300" />
                      <span>Akun Mahasiswa Aktif</span>
                    </span>
                  </div>

                  {/* Tombol Masuk Mode Edit Profil */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditFullName(userProfile.full_name || "");
                      setEditUsername(userProfile.username || "");
                      setEditInstitution(userProfile.institution || "");
                      setEditEducationLevel(userProfile.education_level || "Mahasiswa D3/D4/S1");
                      setEditProvince(userProfile.province || "");
                      setEditCity(userProfile.city || "");
                      setEditBirthDate(userProfile.birth_date || "");
                      setIsEditingProfile(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-semibold text-white transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md self-center sm:self-auto shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Edit Profil</span>
                  </button>
                </div>

                <p className="text-xs font-mono text-white/70">
                  @{userProfile.username || userProfile.email?.split("@")[0] || "mahasiswa"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-white/80">
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
                    <span>{userProfile.education_level || "Mahasiswa D3/D4/S1"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{userProfile.city ? `${userProfile.city}, ${userProfile.province || "Indonesia"}` : "Indonesia"}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode Form Edit Profil Lengkap */
              <form onSubmit={handleSaveFullProfile} className="space-y-4 flex-1 text-left w-full animate-fade-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white">Edit Identitas &amp; Profil Akademik</h2>
                    <p className="text-[11px] sm:text-xs text-white/70">Perbarui data diri untuk personalisasi rekomendasi peluang dan kolaborasi tim.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Nama Lengkap</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                      placeholder="Nama Lengkap"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono">@</span>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                        required
                        placeholder="username"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Institusi / Kampus / Sekolah */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Institusi / Kampus / Sekolah</label>
                    <input
                      type="text"
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      placeholder="Contoh: Politeknik Negeri Malang"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>

                  {/* Jenjang Pendidikan */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Jenjang Pendidikan</label>
                    <select
                      value={editEducationLevel}
                      onChange={(e) => setEditEducationLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#002b66] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition cursor-pointer"
                    >
                      <option value="SMA/SMK" className="bg-[#002b66] text-white">SMA/SMK</option>
                      <option value="Mahasiswa D3/D4/S1" className="bg-[#002b66] text-white">Mahasiswa D3/D4/S1</option>
                      <option value="Fresh Graduate" className="bg-[#002b66] text-white">Fresh Graduate</option>
                      <option value="Umum" className="bg-[#002b66] text-white">Umum</option>
                    </select>
                  </div>

                  {/* Provinsi */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Provinsi</label>
                    <input
                      type="text"
                      value={editProvince}
                      onChange={(e) => setEditProvince(e.target.value)}
                      placeholder="Contoh: Jawa Timur"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>

                  {/* Kota/Kabupaten */}
                  <div className="space-y-1">
                    <label className="font-mono text-white/80 font-medium">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Contoh: Kota Malang"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-mono text-white/80 font-medium">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>
                </div>

                {/* Tombol Aksi Form */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={isSavingProfile}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#002b66] font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* FITUR UTAMA: AI CAREER & SKILL INSIGHT (CERITAKAN DIRIMU) */}
        {/* ========================================================= */}
        <section id="ai-career-skill-insight" className="surface-panel p-6 sm:p-8 rounded-2xl space-y-6 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis AI Naratif</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                AI Career &amp; Skill Insight
              </h2>
              <p className="text-xs text-white/80">
                Ceritakan latar belakang, ketertarikan, teknologi yang disukai, atau pengalaman proyekmu. AI akan menganalisis peran kompetisi ideal dan mengekstrak tag keahlian secara otomatis.
              </p>
            </div>
          </div>

          {/* Kotak Textarea Ceritakan Dirimu */}
          <div className="space-y-3">
            <label className="block text-xs font-mono text-white/80">
              Ceritakan Dirimu, Minat &amp; Pengalamanmu:
            </label>
            <textarea
              rows={4}
              value={userStory}
              onChange={(e) => {
                setUserStory(e.target.value);
                if (storyError) setStoryError(null);
              }}
              placeholder="Contoh: Saya mahasiswa semester 4 teknik informatika. Saya senang membangun web dengan Next.js dan Python, dan sangat tertarik dengan keamanan siber serta integrasi AI untuk mendeteksi ancaman scam atau hoaks..."
              className="w-full p-4 rounded-xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none backdrop-blur-sm"
            />

            {/* Error Story */}
            {storyError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{storyError}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] font-mono text-white/60">
                Panjang cerita: <strong className="text-white font-bold tabular-nums">{userStory.trim().length}</strong> karakter
              </span>

              <button
                type="button"
                onClick={handleAnalyzeStory}
                disabled={isAnalyzingStory || !userStory.trim()}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-xs transition active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-lg shadow-black/20"
              >
                {isAnalyzingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#004aad]" />
                    <span>Menganalisis dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#004aad]" />
                    <span>Analisis dengan AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kartu Highlight Hasil Analisis AI */}
          {storyInsightResult && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.08] border border-amber-300/35 backdrop-blur-md space-y-4 animate-[fadeSlideUp_350ms_ease-out]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                    Hasil Pemetaan AI Angkasa
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {storyInsightResult._modelUsed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Model: {storyInsightResult._modelUsed}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetStory}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-mono text-white/80 hover:text-white transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Hapus hasil dan ulang cerita"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-300" />
                    <span>Reset Analisis</span>
                  </button>
                </div>
              </div>

              {/* 1. Rekomendasi Role Utama */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                  Rekomendasi Role Kompetisi:
                </span>
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 font-bold text-sm sm:text-base">
                    <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{storyInsightResult.recommendedRole}</span>
                  </div>
                </div>
              </div>

              {/* 2. Arahan & Insight Personal AI */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Arahan Strategis &amp; Potensi Peluang:
                </span>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed pl-3 border-l-2 border-amber-400 bg-white/[0.04] p-3 rounded-r-xl">
                  {storyInsightResult.careerInsight}
                </p>
              </div>

              {/* 3. Tag Keahlian Terdeteksi */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tag Keahlian Terdeteksi:</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {storyInsightResult.extractedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-mono font-medium shadow-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-300" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tombol Simpan & Lanjut ke Rekomendasi */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-[11px] text-white/70 italic leading-relaxed">
                  Daftar minat aktif telah diperbarui sesuai hasil pemetaan AI terbaru.
                </p>
                <button
                  type="button"
                  onClick={handleSaveAndGoToFeed}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 hover:from-amber-300 hover:to-amber-100 text-[#002b66] font-bold text-xs shadow-lg shadow-black/25 transition-all duration-300 ease-out active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#002b66]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan &amp; Lanjut ke Rekomendasi</span>
                      <ChevronRight className="w-4 h-4 text-[#002b66]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-white/80">
                Daftar Tag Minat Aktif:
              </label>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTags([]);
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-white/75 hover:text-amber-300 text-xs transition-colors cursor-pointer"
                  title="Hapus semua tag minat aktif"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>
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
      </main>

      {/* Modal Dialog Konfirmasi 2 Langkah Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-[92vw] max-w-md bg-[#002b66]/95 border border-white/20 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-5 animate-fade-slide-up">
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

      {/* ========================================================= */}
      {/* MODAL POPUP PANDUAN PENGISIAN AI CAREER & SKILL INSIGHT   */}
      {/* ========================================================= */}
      {showInsightGuidePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#002b66]/95 border border-white/20 rounded-2xl p-6 shadow-2xl text-white space-y-3">
            {/* Tombol X di Kanan Atas */}
            <button
              type="button"
              onClick={() => setShowInsightGuidePopup(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Tutup panduan"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Format Teks Arahan Pengisian */}
            <div className="space-y-2 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Panduan AI</span>
              </div>
              <h3 className="text-base font-medium text-white tracking-tight">
                Langkah Terakhir: Isi AI Career &amp; Skill Insight
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-normal">
                Selamat datang di Angkasa! Silakan ceritakan latar belakang, minat teknologi, atau pengalaman proyek Anda pada kolom <strong>AI Career &amp; Skill Insight</strong> di bawah ini. AI kami akan menganalisis peran kompetisi yang ideal dan mengekstrak keahlian utama Anda secara otomatis.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInsightGuidePopup(false)}
                className="w-full bg-white text-[#004aad] font-semibold rounded-xl px-4 py-2 hover:bg-white/90 transition text-xs shadow-sm cursor-pointer"
              >
                Mulai Mengisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-[11px] text-white/60 font-mono border-t border-white/20 mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
