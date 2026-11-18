"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserProfile,
  ScoredOpportunity,
  PersonalizedOpportunity,
  OpportunityCategory,
} from "@/types/schema";
import { fetchPersonalizedFeed, getUserBookmarks, toggleBookmark } from "@/lib/apiClient";
import {
  LogOut,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit3,
  ArrowUpRight,
  Bookmark,
  SlidersHorizontal,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export interface FeedDashboardProps {
  userProfile: UserProfile;
  onSelectOpportunity: (opp: ScoredOpportunity) => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

type CategoryFilter = "Semua" | "Lomba" | "Beasiswa" | "Seminar" | "Tersimpan";

// Antrean draf awal untuk demo Mode Kurator kepada juri
const INITIAL_CURATOR_QUEUE: PersonalizedOpportunity[] = [
  {
    id: "draft-opp-101",
    title: "National Cyber Defense Competition 2026",
    category: "Lomba",
    organizer: "Badan Siber dan Sandi Negara (BSSN)",
    caption: "30 Desember 2026",
    deadline: "30 Desember 2026",
    description_roadmap:
      "Kompetisi simulasi pertahanan jaringan komputer dan insiden keamanan siber berskala nasional untuk perguruan tinggi.",
    description:
      "Kompetisi simulasi pertahanan jaringan komputer dan insiden keamanan siber berskala nasional untuk perguruan tinggi.",
    requirements: [
      "Mahasiswa aktif program diploma atau sarjana",
      "Memiliki tim beranggotakan 3 orang",
      "Menguasai dasar jaringan dan analisis log sistem",
    ],
    required_skills: ["Cybersecurity", "Network Defense", "Linux", "Penetration Testing"],
    registration_url: "https://bssn.go.id/kompetisi-siber",
    image_url: "",
    is_verified: false,
    matchPercentage: 92,
    recommendationReason: "Keahlian Cybersecurity Anda sangat selaras dengan kualifikasi lomba pertahanan siber ini.",
  },
];

export default function FeedDashboard({
  userProfile,
  onSelectOpportunity,
  onEditProfile,
  onLogout,
}: FeedDashboardProps) {
  const [opportunities, setOpportunities] = useState<PersonalizedOpportunity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("Semua");

  // State Mode Kurator (Demo Juri)
  const [isCuratorOpen, setIsCuratorOpen] = useState<boolean>(false);
  const [curatorQueue, setCuratorQueue] = useState<PersonalizedOpportunity[]>(INITIAL_CURATOR_QUEUE);
  const [curatorSuccessMsg, setCuratorSuccessMsg] = useState<string | null>(null);

  // Form Input Kurator Baru
  const [newTitle, setNewTitle] = useState("");
  const [newOrganizer, setNewOrganizer] = useState("");
  const [newCategory, setNewCategory] = useState<OpportunityCategory>("Lomba");
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRegUrl, setNewRegUrl] = useState("");

  const loadFeed = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchPersonalizedFeed(userProfile);
      if (res.error || !res.data) {
        setErrorMessage(res.error || "Gagal memuat rekomendasi peluang.");
      } else {
        setOpportunities(res.data);
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi saat memuat rekomendasi AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const res = await getUserBookmarks(userProfile.id);
      if (res.data) {
        setBookmarkedIds(new Set(res.data));
      }
    } catch (e) {
      console.warn("[Bookmarks Load Error]", e);
    }
  };

  useEffect(() => {
    loadFeed();
    loadBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const handleToggleBookmark = async (e: React.MouseEvent, oppId: string) => {
    e.stopPropagation();
    const nextSet = new Set(bookmarkedIds);
    if (nextSet.has(oppId)) {
      nextSet.delete(oppId);
    } else {
      nextSet.add(oppId);
    }
    setBookmarkedIds(nextSet);

    try {
      await toggleBookmark(userProfile.id, oppId);
    } catch (err) {
      console.warn("[Toggle Bookmark Error]", err);
    }
  };

  // Handler: Tambah Peluang Manual oleh Kurator (Status: is_verified = false)
  const handleAddManualOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOrganizer.trim()) return;

    const newDraft: PersonalizedOpportunity = {
      id: `manual-opp-${Date.now()}`,
      title: newTitle.trim(),
      organizer: newOrganizer.trim(),
      category: newCategory,
      caption: newCaption.trim() || "Segera",
      deadline: newCaption.trim() || "Segera",
      description_roadmap: newDescription.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
      description: newDescription.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
      registration_url: newRegUrl.trim() || "https://angkasa.id",
      image_url: newImageUrl.trim() || undefined,
      is_verified: false,
      matchPercentage: 88,
      recommendationReason: `Peluang kategori ${newCategory} ini sangat relevan untuk memperkuat portofolio Anda.`,
    };

    setCuratorQueue((prev) => [newDraft, ...prev]);
    setCuratorSuccessMsg(`Draf "${newDraft.title}" berhasil ditambahkan ke antrean verifikasi.`);

    // Reset Form
    setNewTitle("");
    setNewOrganizer("");
    setNewCaption("");
    setNewImageUrl("");
    setNewDescription("");
    setNewRegUrl("");
  };

  // Handler: Kurator Memverifikasi & Menayangkan Peluang (is_verified: false -> true)
  const handleVerifyAndPublish = (draftId: string) => {
    const targetDraft = curatorQueue.find((item) => item.id === draftId);
    if (!targetDraft) return;

    const publishedOpportunity: PersonalizedOpportunity = {
      ...targetDraft,
      is_verified: true,
    };

    // 1. Masukkan ke feed publik
    setOpportunities((prev) => [publishedOpportunity, ...prev]);

    // 2. Hapus dari antrean verifikasi
    setCuratorQueue((prev) => prev.filter((item) => item.id !== draftId));

    setCuratorSuccessMsg(`Peluang "${publishedOpportunity.title}" telah diverifikasi dan resmi tayang di Feed publik.`);
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const matchCat =
        selectedCategory === "Semua"
          ? true
          : selectedCategory === "Tersimpan"
          ? bookmarkedIds.has(item.id)
          : item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.organizer.toLowerCase().includes(q) ||
        (item.caption || item.deadline || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [opportunities, selectedCategory, searchQuery, bookmarkedIds]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header — Minimalist Navigation */}
      <header className="sticky top-0 z-30 bg-[#050505]/85 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand & User Breadcrumb */}
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-[#FAFAFA] tracking-tight">ANGKASA</span>
              <span className="text-[#888890]">&bull;</span>
              <span className="text-[#888890] truncate max-w-[180px] sm:max-w-xs">
                {userProfile.full_name}
              </span>
            </div>
          </div>

          {/* Actions: Mode Kurator Demo + Ubah Minat + Keluar */}
          <div className="flex items-center gap-2">
            {/* Tombol Mode Kurator untuk Demo Juri */}
            <button
              type="button"
              onClick={() => setIsCuratorOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-medium text-emerald-400 transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              title="Panel Kurator & Verifikator Manual"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Mode Kurator</span>
              {curatorQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold tabular-nums">
                  {curatorQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onEditProfile}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] text-xs font-medium text-[#FAFAFA] transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-[#888890]" />
              <span>Minat ({userProfile.profiling?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-rose-950/20 border border-white/[0.07] hover:border-rose-900/40 text-xs font-medium text-[#888890] hover:text-rose-300 transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Minimalist Profile Pills Strip */}
        <div className="border-t border-white/[0.04] bg-[#0C0C0E]/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono uppercase text-[#888890] tracking-wider shrink-0">
              Profil:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {(userProfile.profiling || []).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#888890] font-mono whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Editorial Subheader & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#FAFAFA]">
              Rekomendasi Peluang Terkurasi
            </h1>
            <p className="text-xs text-[#888890]">
              Disaring otomatis berdasarkan keselarasan profiling dan kualifikasi resmi penyelenggara.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-[#888890]">
            <span className="tabular-nums text-[#FAFAFA] font-semibold">
              {filteredOpportunities.length}
            </span>
            <span>tayang terverifikasi</span>
          </div>
        </div>

        {/* Controls: Segmented Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Tab Filter (Termasuk P7 Tersimpan) */}
          <div className="inline-flex p-1 bg-[#0C0C0E] border border-white/[0.07] rounded-xl self-start flex-wrap gap-0.5">
            {(["Semua", "Lomba", "Beasiswa", "Seminar", "Tersimpan"] as CategoryFilter[]).map((cat) => {
              const isSavedTab = cat === "Tersimpan";
              const count = isSavedTab ? bookmarkedIds.size : null;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-white/[0.08] text-[#FAFAFA] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                      : "text-[#888890] hover:text-[#FAFAFA]"
                  }`}
                >
                  {isSavedTab && <Bookmark className="w-3 h-3 text-emerald-400" />}
                  <span>{cat}</span>
                  {count !== null && count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 tabular-nums">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#888890] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari peluang atau instansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0C0C0E] border border-white/[0.07] focus:border-white/20 text-xs sm:text-sm text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            />
          </div>
        </div>

        {/* Feed Cards Section — Grid Poster/Flyer Card */}
        {isLoading ? (
          /* Clean Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-[#0C0C0E] border border-white/[0.07] overflow-hidden animate-pulse space-y-4"
              >
                <div className="w-full aspect-[16/9] bg-white/[0.04]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-24 bg-white/[0.04] rounded" />
                  <div className="h-5 w-4/5 bg-white/[0.06] rounded" />
                  <div className="h-4 w-full bg-white/[0.03] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          /* Error State */
          <div className="p-8 rounded-2xl bg-[#0C0C0E] border border-rose-900/40 text-center space-y-3">
            <p className="text-xs text-rose-300">{errorMessage}</p>
            <button
              type="button"
              onClick={loadFeed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-[#FAFAFA] border border-white/[0.08] transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Muat Ulang
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] text-center space-y-2">
            <p className="text-sm font-medium text-[#FAFAFA]">
              {selectedCategory === "Tersimpan"
                ? "Belum ada peluang yang disimpan"
                : "Tidak ada peluang yang cocok"}
            </p>
            <p className="text-xs text-[#888890]">
              {selectedCategory === "Tersimpan"
                ? "Klik ikon simpan pada kartu peluang untuk menyimpannya ke daftar pribadi Anda."
                : searchQuery
                ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}".`
                : "Belum ada peluang terverifikasi pada kategori ini."}
            </p>
          </div>
        ) : (
          /* Grid Poster/Flyer Card Layout (Responsive 1-2-3 Col) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOpportunities.map((item, index) => {
              const deadline = item.caption || item.deadline || "Segera";
              const matchScore = item.matchPercentage ?? 75;
              const isHighMatch = matchScore >= 80;
              const isBookmarked = bookmarkedIds.has(item.id);

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectOpportunity(item)}
                  style={{ animationDelay: `${index * 35}ms` }}
                  className="surface-panel surface-interactive group rounded-2xl cursor-pointer flex flex-col justify-between overflow-hidden relative animate-fade-slide-up"
                >
                  {/* Top Area: Poster / Flyer Visual Aspect 16:9 */}
                  <div className="relative w-full aspect-[16/9] bg-[#0C0C0E] border-b border-white/[0.07] overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Sembunyikan gambar rusak dan tampilkan poster editorial
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      /* Poster Editorial Terkurasi (60-30-10 Aesthetic) */
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#111114] via-[#0C0C0E] to-[#070709] relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {item.category}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#888890] block truncate">
                            {item.organizer}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#FAFAFA] tracking-tight line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        {/* Subtle decorative hairline grid */}
                        <div className="absolute right-0 bottom-0 w-20 h-20 bg-emerald-500/5 rounded-tl-full pointer-events-none blur-sm" />
                      </div>
                    )}

                    {/* Overlaid Badges on Poster */}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
                      {/* Left: Lencana Verified */}
                      {item.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#050505]/85 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-lg shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Terverifikasi</span>
                        </span>
                      )}

                      {/* Right: Persentase Kecocokan AI */}
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-lg backdrop-blur-md border shadow-sm ml-auto ${
                          isHighMatch
                            ? "bg-[#050505]/85 border-emerald-500/30 text-emerald-400"
                            : "bg-[#050505]/85 border-white/[0.1] text-[#888890]"
                        }`}
                      >
                        {matchScore}% Cocok
                      </span>
                    </div>
                  </div>

                  {/* Bottom Content Area */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#888890]">
                        <span className="truncate">{item.organizer}</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-[#FAFAFA] group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Tepat 1 Kalimat Alasan AI (Secondary Clean) */}
                      <p className="text-xs text-[#888890] leading-relaxed line-clamp-2 pt-1 border-t border-white/[0.04]">
                        <span className="text-emerald-400/80 mr-1.5 font-medium">&bull;</span>
                        {item.recommendationReason}
                      </p>
                    </div>

                    {/* Footer: Deadline & Tombol Bookmark (P7) */}
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-[#888890] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#888890]" />
                        <span className="tabular-nums">{deadline}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Tombol Bookmark P7 */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, item.id)}
                          className={`p-1.5 rounded-lg border transition active:scale-[0.95] cursor-pointer ${
                            isBookmarked
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-white/[0.04] border-white/[0.07] text-[#888890] hover:text-[#FAFAFA] hover:border-white/[0.14]"
                          }`}
                          title={isBookmarked ? "Hapus dari Tersimpan" : "Simpan Peluang"}
                          aria-label="Bookmark"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isBookmarked ? "fill-emerald-400" : ""
                            }`}
                          />
                        </button>

                        <div className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] text-[#888890] group-hover:text-[#FAFAFA] group-hover:border-white/[0.14] transition">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL / PANEL MODE KURATOR (DEMO JURI) */}
      {/* ========================================================= */}
      {isCuratorOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0C0C0E] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 animate-fade-slide-up relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.07]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                    PANEL KURATOR &amp; VERIFIKASI PELUANG
                  </span>
                </div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#FAFAFA] mt-1">
                  Alur Input Manual &amp; Kurasi Internal
                </h2>
                <p className="text-xs text-[#888890]">
                  Peluang baru berstatus <strong className="text-amber-400 font-normal">is_verified: false</strong> dan tidak akan tampil di feed sebelum disetujui kurator.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCuratorOpen(false);
                  setCuratorSuccessMsg(null);
                }}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#888890] hover:text-[#FAFAFA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Alert */}
            {curatorSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{curatorSuccessMsg}</span>
              </div>
            )}

            {/* Section 1: Form Input Manual Peluang Baru */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Input Peluang Baru ke Antrean Kurasi</span>
              </h3>

              <form onSubmit={handleAddManualOpportunity} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Judul Peluang *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Lomba Desain Web Nasional 2026"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Penyelenggara *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Universitas Indonesia"
                      value={newOrganizer}
                      onChange={(e) => setNewOrganizer(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Kategori *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as OpportunityCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] focus:outline-none transition"
                    >
                      <option value="Lomba">Lomba</option>
                      <option value="Beasiswa">Beasiswa</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Batas Waktu / Caption</label>
                    <input
                      type="text"
                      placeholder="Contoh: 15 Januari 2027"
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">URL Poster (Opsional)</label>
                    <input
                      type="text"
                      placeholder="https://.../poster.jpg"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">Deskripsi Singkat &amp; Panduan</label>
                  <textarea
                    rows={2}
                    placeholder="Ringkasan kriteria kompetisi atau beasiswa..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">Tautan Pendaftaran Resmi</label>
                  <input
                    type="url"
                    placeholder="https://penyelenggara.ac.id/daftar"
                    value={newRegUrl}
                    onChange={(e) => setNewRegUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#FAFAFA] font-medium transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daftarkan ke Antrean (is_verified: false)</span>
                </button>
              </form>
            </div>

            {/* Section 2: Antrean Kurasi Menunggu Verifikasi */}
            <div className="space-y-3 pt-4 border-t border-white/[0.07]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Antrean Menunggu Verifikasi ({curatorQueue.length})</span>
                </h3>

                <span className="text-[11px] font-mono text-amber-400/80">
                  Belum Tampil di Feed Publik
                </span>
              </div>

              {curatorQueue.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#050505] border border-white/[0.06] text-center space-y-1">
                  <p className="text-xs text-[#FAFAFA] font-medium">Antrean Verifikasi Kosong</p>
                  <p className="text-[11px] text-[#888890]">
                    Seluruh peluang yang diajukan telah diverifikasi dan tayang di feed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {curatorQueue.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Menunggu Verifikasi
                          </span>
                          <span className="text-[10px] font-mono text-[#888890]">
                            {draft.category}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#FAFAFA]">
                          {draft.title}
                        </h4>
                        <p className="text-[11px] text-[#888890]">
                          Penyelenggara: {draft.organizer} &bull; Deadline: {draft.caption}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyAndPublish(draft.id)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                        <span>Verifikasi &amp; Tayangkan</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editorial Clean Footer */}
      <footer className="text-center py-6 text-[11px] text-[#888890]/50 font-mono border-t border-white/[0.04] mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
