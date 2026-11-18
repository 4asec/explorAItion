"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserProfile,
  ScoredOpportunity,
  PersonalizedOpportunity,
  Opportunity,
} from "@/types/schema";
import {
  fetchPersonalizedFeed,
  getUserBookmarks,
  toggleBookmark,
  fetchAllOpportunitiesForCurator,
  DEFAULT_POSTER_URL,
} from "@/lib/apiClient";
import CuratorPanel from "@/components/CuratorPanel";
import {
  LogOut,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowUpRight,
  Bookmark,
  Calendar,
  Bell,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export interface FeedDashboardProps {
  userProfile: UserProfile;
  onSelectOpportunity: (opp: ScoredOpportunity) => void;
  onEditProfile?: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

type CategoryFilter = "Semua" | "Lomba" | "Beasiswa" | "Seminar";

export default function FeedDashboard({
  userProfile,
  onSelectOpportunity,
  onEditProfile,
  onOpenProfile,
  onLogout,
}: FeedDashboardProps) {
  const [opportunities, setOpportunities] = useState<PersonalizedOpportunity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isBookmarkedOnly, setIsBookmarkedOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("Semua");

  // State Sidebar Notifikasi Peluang Relevan
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // State Panel Kurator (Admin Input Manual & Verifikator)
  const [isCuratorOpen, setIsCuratorOpen] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

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

  const refreshCuratorCounts = async () => {
    try {
      const res = await fetchAllOpportunitiesForCurator();
      if (res.data) {
        const pending = res.data.filter((o) => !o.is_verified);
        setPendingCount(pending.length);
      }
    } catch (e) {
      console.warn("[Curator Count Error]", e);
    }
  };

  useEffect(() => {
    loadFeed();
    loadBookmarks();
    refreshCuratorCounts();
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

  // Handler: Peluang Baru Diverifikasi oleh Kurator (is_verified: false -> true)
  const handleOpportunityVerified = (verifiedOpp: Opportunity) => {
    setOpportunities((prev) => {
      const exists = prev.some((o) => o.id === verifiedOpp.id);
      if (exists) {
        return prev.map((o) =>
          o.id === verifiedOpp.id ? { ...o, is_verified: true } : o
        );
      }
      const newPersonalized: PersonalizedOpportunity = {
        ...verifiedOpp,
        is_verified: true,
        matchPercentage: 92,
        recommendationReason: `Peluang kategori ${verifiedOpp.category} ini telah diverifikasi kurator dan sangat selaras dengan kualifikasi profil Anda.`,
      };
      return [newPersonalized, ...prev];
    });
    setPendingCount((prev) => Math.max(0, prev - 1));
  };

  // Handler: Peluang Baru Ditambahkan ke Antrean oleh Kurator
  const handleOpportunityAdded = (_newOpp: Opportunity) => {
    setPendingCount((prev) => prev + 1);
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (isBookmarkedOnly && !bookmarkedIds.has(item.id)) {
        return false;
      }
      const matchCat =
        selectedCategory === "Semua" ? true : item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.organizer.toLowerCase().includes(q) ||
        (item.caption || item.deadline || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [opportunities, selectedCategory, searchQuery, bookmarkedIds, isBookmarkedOnly]);

  // Postingan terbaru yang paling relevan untuk Sidebar Notifikasi
  const relevantNotifications = useMemo(() => {
    return opportunities
      .filter((item) => (item.matchPercentage ?? 0) >= 70 || item.is_verified)
      .sort((a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0))
      .slice(0, 8);
  }, [opportunities]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Top Header — Minimalist Royal Glass Navigation */}
      <header className="sticky top-0 z-30 bg-[#004aad]/85 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Bagian Navbar Sisi Kiri: Foto/Lingkaran Profil User + Username (Klik menuju Profile Page) */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="group flex items-center gap-3 p-1.5 -ml-1.5 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/20 transition-all cursor-pointer text-left active:scale-[0.98]"
            title="Buka Halaman Profil Pengguna"
            aria-label="Profil Pengguna"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 text-[#004aad] font-bold text-sm flex items-center justify-center shadow-md ring-2 ring-white/40 group-hover:ring-amber-300 transition">
                {userProfile.full_name?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#004aad]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[200px] group-hover:text-amber-200 transition">
                  {userProfile.full_name}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] font-mono text-white/80">
                  {userProfile.education_level || "Mahasiswa"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-white/70 truncate max-w-[120px] sm:max-w-[180px]">
                @{userProfile.username || userProfile.email?.split("@")[0] || "angkasa"}
              </span>
            </div>
          </button>

          {/* Bagian Navbar Sisi Kanan: Ikon Notifikasi Postingan Terbaru yang Relevan + Keluar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Ikon Notifikasi Postingan Terbaru yang Relevan */}
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white transition active:scale-[0.96] cursor-pointer backdrop-blur-md shadow-sm group"
              title="Notifikasi Postingan Terbaru yang Relevan"
              aria-label="Buka Notifikasi Peluang Relevan"
            >
              <Bell className="w-4 h-4 text-white group-hover:text-amber-300 transition" />
              {relevantNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center rounded-full bg-amber-400 text-[#004aad] font-mono text-[10px] font-bold tabular-nums shadow-md">
                  {relevantNotifications.length}
                </span>
              )}
            </button>

            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/20 hover:border-rose-400/40 text-white/80 hover:text-rose-200 transition active:scale-[0.96] flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              title="Keluar dari Akun"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Editorial Subheader & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white">
              Rekomendasi Peluang Terkurasi
            </h1>
            <p className="text-xs text-white/80">
              Disaring otomatis berdasarkan keselarasan profiling dan kualifikasi resmi penyelenggara.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-white/80">
            <span className="tabular-nums text-white font-semibold">
              {filteredOpportunities.length}
            </span>
            <span>{isBookmarkedOnly ? "tersimpan" : "tayang terverifikasi"}</span>
          </div>
        </div>

        {/* Controls: Segmented Filter (Kiri) & Tombol Tersimpan + Search Box (Kanan) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Segmented Tab Filter Utama */}
          <div className="inline-flex p-1 bg-white/10 border border-white/20 rounded-xl self-start flex-wrap gap-0.5 backdrop-blur-md shadow-sm">
            {(["Semua", "Lomba", "Beasiswa", "Seminar"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  selectedCategory === cat
                    ? "bg-white text-[#004aad] font-bold shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sisi Kanan: Tombol Toggle Mandiri Tersimpan (P7) + Search Box */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Tombol Toggle Mandiri Tersimpan */}
            <button
              type="button"
              onClick={() => setIsBookmarkedOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center gap-2 shrink-0 backdrop-blur-md shadow-sm ${
                isBookmarkedOnly
                  ? "bg-amber-400/25 border-amber-300/40 text-amber-300 shadow-sm font-semibold"
                  : "bg-white/10 border-white/20 text-white/80 hover:text-white hover:border-white/40"
              }`}
              title={isBookmarkedOnly ? "Tampilkan semua peluang" : "Filter peluang tersimpan"}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isBookmarkedOnly ? "fill-amber-300 text-amber-300" : "text-white/80"
                }`}
              />
              <span>Tersimpan</span>
              {bookmarkedIds.size > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isBookmarkedOnly
                      ? "bg-amber-400 text-[#004aad] font-bold"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {bookmarkedIds.size}
                </span>
              )}
            </button>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari peluang atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-md shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Feed Cards Section — Grid Poster/Flyer Card */}
        {isLoading ? (
          /* Clean Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl surface-panel overflow-hidden animate-pulse space-y-4"
              >
                <div className="w-full aspect-[16/9] bg-white/[0.06]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-24 bg-white/[0.08] rounded" />
                  <div className="h-5 w-4/5 bg-white/[0.12] rounded" />
                  <div className="h-4 w-full bg-white/[0.06] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          /* Error State */
          <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-3">
            <p className="text-xs text-rose-200">{errorMessage}</p>
            <button
              type="button"
              onClick={loadFeed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs text-white border border-white/20 transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Muat Ulang
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          /* Empty State */
          <div className="surface-panel p-12 rounded-2xl text-center space-y-3">
            <p className="text-sm font-semibold text-white">
              {isBookmarkedOnly
                ? "Belum ada peluang yang disimpan"
                : "Tidak ada peluang yang cocok"}
            </p>
            <p className="text-xs text-white/80 max-w-sm mx-auto">
              {isBookmarkedOnly
                ? "Klik ikon simpan pada kartu peluang untuk menyimpannya ke daftar pribadi Anda."
                : searchQuery
                ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}".`
                : "Belum ada peluang terverifikasi pada kategori ini."}
            </p>
            {isBookmarkedOnly && (
              <button
                type="button"
                onClick={() => setIsBookmarkedOnly(false)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-xs font-semibold text-[#004aad] shadow-md transition cursor-pointer"
              >
                Kembali ke Semua Peluang
              </button>
            )}
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
                  <div className="relative w-full aspect-[16/9] rounded-t-xl overflow-hidden bg-[#002b66]/60 border-b border-white/15">
                    <img
                      src={item.image_url || DEFAULT_POSTER_URL}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Otomatis mengalihkan ke DEFAULT_POSTER_URL agar tidak pernah terjadi gambar rusak
                        if (e.currentTarget.src !== DEFAULT_POSTER_URL) {
                          e.currentTarget.src = DEFAULT_POSTER_URL;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002b66]/90 via-transparent to-black/30 pointer-events-none" />

                    {/* Overlaid Badges on Poster */}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none z-10">
                      {/* Left: Lencana Verified */}
                      {item.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#002b66]/90 backdrop-blur-md border border-white/20 text-white px-2.5 py-0.5 rounded-lg shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-amber-300" />
                          <span>Terverifikasi</span>
                        </span>
                      )}

                      {/* Right: Persentase Kecocokan AI */}
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-lg backdrop-blur-md border shadow-sm ml-auto ${
                          isHighMatch
                            ? "bg-[#002b66]/90 border-amber-300/40 text-amber-300"
                            : "bg-[#002b66]/90 border-white/20 text-white/80"
                        }`}
                      >
                        {matchScore}% Cocok
                      </span>
                    </div>
                  </div>

                  {/* Bottom Content Area */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-white/70">
                        <span className="truncate">{item.organizer}</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-white/10 border border-white/15 text-white/90">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold tracking-[-0.02em] text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Tepat 1 Kalimat Alasan AI (Secondary Clean) */}
                      <p className="text-xs text-white/80 leading-relaxed line-clamp-2 pt-1 border-t border-white/10">
                        <span className="text-amber-300 mr-1.5 font-bold">&bull;</span>
                        {item.recommendationReason}
                      </p>
                    </div>

                    {/* Footer: Deadline & Tombol Bookmark (P7) */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-white/70 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-white/70" />
                        <span className="tabular-nums">{deadline}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Tombol Bookmark P7 */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, item.id)}
                          className={`p-1.5 rounded-lg border transition active:scale-[0.95] cursor-pointer ${
                            isBookmarked
                              ? "bg-amber-400/20 border-amber-300/40 text-amber-300"
                              : "bg-white/10 border-white/20 text-white/80 hover:text-white hover:border-white/40"
                          }`}
                          title={isBookmarked ? "Hapus dari Tersimpan" : "Simpan Peluang"}
                          aria-label="Bookmark"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isBookmarked ? "fill-amber-300" : ""
                            }`}
                          />
                        </button>

                        <div className="p-1.5 rounded-lg border border-white/20 bg-white/10 text-white/80 group-hover:text-white group-hover:bg-white/20 transition">
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
      {/* SIDEBAR NOTIFIKASI INFORMASI POSTINGAN TERBARU RELEVAN */}
      {/* ========================================================= */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNotificationOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#002b66]/95 border-l border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col justify-between animate-fade-slide-up">
              {/* Header Sidebar */}
              <div className="p-5 border-b border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">
                      Notifikasi Postingan Relevan
                    </h2>
                    <p className="text-[11px] text-white/70">
                      Rekomendasi disesuaikan dengan minat profil Anda
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 cursor-pointer"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List Peluang Relevan */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {relevantNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/70 border border-dashed border-white/20 rounded-2xl">
                    Belum ada rekomendasi baru yang memenuhi ambang batas relevansi.
                  </div>
                ) : (
                  relevantNotifications.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => {
                        onSelectOpportunity(opp);
                        setIsNotificationOpen(false);
                      }}
                      className="group p-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-amber-300/40 transition cursor-pointer flex flex-col gap-2.5 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 text-[10px] font-mono text-white uppercase tracking-wider">
                          {opp.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#004aad] text-[10px] font-bold font-mono tabular-nums">
                          {opp.matchPercentage ?? 85}% Cocok
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-200 transition line-clamp-2">
                          {opp.title}
                        </h3>
                        <p className="text-[11px] text-white/70 truncate mt-0.5">
                          {opp.organizer}
                        </p>
                      </div>

                      {opp.recommendationReason && (
                        <p className="text-[11px] text-white/80 leading-relaxed bg-white/[0.05] p-2 rounded-lg border border-white/10 line-clamp-2">
                          <span className="text-amber-300 mr-1 font-bold">&bull;</span>
                          {opp.recommendationReason}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono text-white/60">
                        <span className="flex items-center gap-1 text-white/70">
                          <Calendar className="w-3 h-3" />
                          <span>{opp.deadline || "Mendatang"}</span>
                        </span>
                        <span className="text-amber-300 group-hover:translate-x-0.5 transition flex items-center gap-0.5 font-sans font-medium">
                          Lihat Detail &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Sidebar: Link ke Profile Page */}
              <div className="p-4 border-t border-white/15 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-medium text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sesuaikan Topik Minat di Profil</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PANEL KURATOR & VERIFIKATOR KOMPONEN (DEMO JURI) */}
      {/* ========================================================= */}
      <CuratorPanel
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        onOpportunityVerified={handleOpportunityVerified}
        onOpportunityAdded={handleOpportunityAdded}
      />

      {/* Editorial Clean Footer */}
      <footer className="text-center py-6 text-[11px] text-white/60 font-mono border-t border-white/20 mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
