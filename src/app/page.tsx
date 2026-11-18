"use client";

import { useState, useEffect } from "react";
import { AuthPage } from "@/page";
import { UserProfile, PersonalizedOpportunity, RoadmapResponse } from "@/types/schema";
import {
  logoutUser,
  updateUserProfile,
  fetchPersonalizedFeed,
  fetchPreparationRoadmap,
} from "@/lib/apiClient";
import {
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  Plus,
  X,
  Loader2,
  ArrowRight,
  Compass,
  FileCheck2,
  Award,
  Layers,
  Edit3,
} from "lucide-react";

type ActiveView = "auth" | "profiling" | "feed";

const POPULAR_PROFILING_TAGS = [
  "Next.js",
  "React",
  "TypeScript",
  "Python",
  "Artificial Intelligence",
  "GenAI Prompting",
  "Cybersecurity",
  "Machine Learning",
  "UI/UX Design",
  "Cloud Computing",
  "Mobile Development",
  "Competitive Programming",
  "Public Speaking",
  "Pitching",
  "System Architecture",
  "Business Strategy",
];

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>("auth");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State untuk P2 Profiling View
  const [profilingTags, setProfilingTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profilingError, setProfilingError] = useState<string | null>(null);

  // State untuk P3 AI Personalized Feed View
  const [feedItems, setFeedItems] = useState<PersonalizedOpportunity[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  // State untuk P5 AI Preparation Roadmap Modal
  const [activeRoadmapOpp, setActiveRoadmapOpp] = useState<PersonalizedOpportunity | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  // Handler Sukses Login / Register
  const handleAuthSuccess = (user: any, profile: UserProfile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);

    // Persyaratan P2 vs P3: Periksa apakah array profiling kosong
    const hasProfiling =
      Array.isArray(profile.profiling) && profile.profiling.length > 0;

    if (hasProfiling) {
      setProfilingTags(profile.profiling);
      setCurrentView("feed");
    } else {
      setProfilingTags([]);
      setCurrentView("profiling");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setCurrentUser(null);
      setCurrentProfile(null);
      setFeedItems([]);
      setProfilingTags([]);
      setCurrentView("auth");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Muat AI Personalized Feed saat berpindah ke tampilan feed
  useEffect(() => {
    if (currentView === "feed" && currentProfile) {
      loadPersonalizedFeed(currentProfile);
    }
  }, [currentView, currentProfile]);

  const loadPersonalizedFeed = async (profile: UserProfile) => {
    setIsFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetchPersonalizedFeed(profile);
      if (res.error || !res.data) {
        setFeedError(res.error || "Gagal memuat rekomendasi peluang.");
      } else {
        setFeedItems(res.data);
      }
    } catch (err) {
      setFeedError("Gangguan jaringan saat memuat feed rekomendasi.");
    } finally {
      setIsFeedLoading(false);
    }
  };

  // Tag Management untuk Profiling (P2)
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (profilingTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    setProfilingTags([...profilingTags, trimmed]);
    setTagInput("");
    setProfilingError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProfilingTags(profilingTags.filter((t) => t !== tagToRemove));
  };

  const handleSaveProfiling = async () => {
    if (profilingTags.length === 0) {
      setProfilingError("Silakan tambahkan minimal 1 keahlian, minat, atau bakat Anda.");
      return;
    }

    if (!currentProfile) return;

    setIsSavingProfile(true);
    setProfilingError(null);

    try {
      const res = await updateUserProfile(currentProfile.id, profilingTags);
      if (res.error || !res.data) {
        setProfilingError(res.error || "Gagal menyimpan data profiling.");
      } else {
        const updated = res.data;
        setCurrentProfile(updated);
        // Langsung arahkan ke Feed (P3)
        setCurrentView("feed");
      }
    } catch (err) {
      setProfilingError("Terjadi gangguan jaringan saat menyimpan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Buka AI Roadmap (P5)
  const handleOpenRoadmap = async (opp: PersonalizedOpportunity) => {
    if (!currentProfile) return;
    setActiveRoadmapOpp(opp);
    setRoadmapData(null);
    setIsRoadmapLoading(true);

    try {
      const res = await fetchPreparationRoadmap(currentProfile, opp);
      if (res.data) {
        setRoadmapData(res.data);
      }
    } catch (err) {
      console.warn("Gagal memuat roadmap", err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  // ==========================================================
  // VIEW 1: AUTHENTICATION (P1: Login, Register, 1-Click Demo)
  // ==========================================================
  if (!currentProfile || currentView === "auth") {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // ==========================================================
  // VIEW 2: PROFILING VIEW (P2: Input Minat & Bakat jika profiling kosong)
  // ==========================================================
  if (currentView === "profiling") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="w-full max-w-2xl z-10 space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Compass className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 tracking-wide">ANGKASA PROFILING</span>
                <span className="text-[10px] block text-emerald-400 font-medium">Tahap P2: Minat &amp; Bakat</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-rose-300 hover:text-rose-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Main Profiling Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-md">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Personalisasi Algoritma AI
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                Halo, {currentProfile.full_name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Sebelum melihat rekomendasi peluang, masukkan keahlian teknis, bidang minat, dan potensi bakat Anda agar AI Gemini dapat mencocokkan kompetisi secara presisi.
              </p>
            </div>

            {/* Input Tag Custom */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Ketik Keahlian / Minat / Bakat Anda:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Next.js, AI Engineering, Desain UI, Python..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs sm:text-sm text-slate-100 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Active Selected Tags */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">
                Profil Terpilih ({profilingTags.length}):
              </span>
              <div className="min-h-[60px] p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap gap-2 items-center">
                {profilingTags.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Belum ada keahlian yang ditambahkan. Pilih dari rekomendasi di bawah atau ketik manual.
                  </span>
                ) : (
                  profilingTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 transition cursor-pointer"
                        title="Hapus"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">
                Pilihan Cepat Populer:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PROFILING_TAGS.map((tag) => {
                  const isSelected = profilingTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      disabled={isSelected}
                      className={`px-3 py-1 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 text-slate-500 border border-slate-800 opacity-50 cursor-not-allowed"
                          : "bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300"
                      }`}
                    >
                      + {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {profilingError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl">
                {profilingError}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSaveProfiling}
              disabled={isSavingProfile || profilingTags.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Profiling...</span>
                </>
              ) : (
                <>
                  <span>Simpan &amp; Lanjut ke Rekomendasi Peluang (P3)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // VIEW 3: AI PERSONALIZED FEED (P3: Feed Peluang Terpersonalisasi)
  // ==========================================================
  const filteredFeed =
    selectedCategory === "Semua"
      ? feedItems
      : feedItems.filter((i) => i.category === selectedCategory);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-3 sm:p-6 lg:p-8 relative">
      {/* Background Ambience */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 space-y-6">
        {/* Navigation Bar */}
        <header className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-slate-100">ANGKASA</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  AI FEED P3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentProfile.full_name} ({currentProfile.institution})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentView("profiling")}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Perbarui Minat & Bakat"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ubah Profiling ({currentProfile.profiling?.length || 0})</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-800 text-xs font-semibold text-rose-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Profiling Badges Strip */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Minat &amp; Keahlian Aktif:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentProfile.profiling?.map((p) => (
              <span
                key={p}
                className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {["Semua", "Lomba", "Beasiswa", "Seminar"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-emerald-400">{filteredFeed.length}</strong> peluang terkurasi
          </span>
        </div>

        {/* Feed Cards Section */}
        {isFeedLoading ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">
              Gemini AI sedang menghitung kecocokan profil Anda...
            </p>
            <p className="text-xs text-slate-500">Menganalisis relevansi keahlian dan deskripsi kompetisi.</p>
          </div>
        ) : feedError ? (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs sm:text-sm">
            {feedError}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeed.map((opp) => (
              <article
                key={opp.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-4 shadow-lg backdrop-blur-md"
              >
                <div className="space-y-3">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                      {opp.category}
                    </span>

                    <div className="flex items-center gap-2">
                      {opp.is_verified && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
                        {opp.matchPercentage}% Cocok
                      </span>
                    </div>
                  </div>

                  {/* Title & Organizer */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{opp.organizer}</span>
                    </p>
                  </div>

                  {/* 1 Kalimat Alasan AI */}
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                    <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                      💡 {opp.recommendationReason}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Required Skills */}
                  {opp.required_skills && opp.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {opp.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Deadline: {opp.deadline}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenRoadmap(opp)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Roadmap AI</span>
                    </button>

                    <a
                      href={opp.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Daftar</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal AI Preparation Roadmap (P5) */}
        {activeRoadmapOpp && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-5 shadow-2xl relative">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    AI Preparation Roadmap (P5)
                  </span>
                  <h2 className="text-lg font-bold text-slate-100">{activeRoadmapOpp.title}</h2>
                  <p className="text-xs text-slate-400">Penyelenggara: {activeRoadmapOpp.organizer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRoadmapOpp(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isRoadmapLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-slate-400">Menyusun strategi pemenangan &amp; lini masa persiapan...</p>
                </div>
              ) : roadmapData ? (
                <div className="space-y-5 text-xs sm:text-sm">
                  {/* Checklist Dokumen */}
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase">
                      <FileCheck2 className="w-4 h-4" /> Checklist Dokumen Wajib
                    </h3>
                    <div className="space-y-2">
                      {roadmapData.document_checklist.map((doc, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <p className="font-semibold text-slate-200">{doc.item}</p>
                          <p className="text-slate-400 text-xs">💡 {doc.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategi Kemenangan */}
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase">
                      <Award className="w-4 h-4" /> 3 Strategi Pemenangan Teruji
                    </h3>
                    <ul className="space-y-2">
                      {roadmapData.winning_strategy.map((strat, idx) => (
                        <li key={idx} className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-slate-200">
                          {idx + 1}. {strat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline Persiapan */}
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase">
                      <Layers className="w-4 h-4" /> Lini Masa Persiapan Bertahap
                    </h3>
                    <div className="space-y-2">
                      {roadmapData.timeline.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold shrink-0">
                            {item.phase}
                          </span>
                          <p className="text-slate-300 text-xs">{item.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Gagal memuat detail roadmap.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
