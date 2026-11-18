"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, ScoredOpportunity, PersonalizedOpportunity } from "@/types/schema";
import { fetchPersonalizedFeed } from "@/lib/apiClient";
import {
  LogOut,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit3,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export interface FeedDashboardProps {
  userProfile: UserProfile;
  onSelectOpportunity: (opp: ScoredOpportunity) => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

type CategoryFilter = "Semua" | "Lomba" | "Beasiswa" | "Seminar";

export default function FeedDashboard({
  userProfile,
  onSelectOpportunity,
  onEditProfile,
  onLogout,
}: FeedDashboardProps) {
  const [opportunities, setOpportunities] = useState<PersonalizedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("Semua");

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

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
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
  }, [opportunities, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header — Linear / Vercel Minimalist Navigation */}
      <header className="sticky top-0 z-30 bg-[#050505]/85 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand & User Breadcrumb */}
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-[#FAFAFA] tracking-tight">ANGKASA</span>
              <span className="text-[#888890]">&bull;</span>
              <span className="text-[#888890] truncate max-w-[200px] sm:max-w-xs">
                {userProfile.full_name}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditProfile}
              className="px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] text-xs font-medium text-[#FAFAFA] transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3 text-[#888890]" />
              <span>Minat ({userProfile.profiling?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-rose-950/20 border border-white/[0.07] hover:border-rose-900/40 text-xs font-medium text-[#888890] hover:text-rose-300 transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Minimalist Profile Pills Strip */}
        <div className="border-t border-white/[0.04] bg-[#0C0C0E]/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
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
            <span>tersedia</span>
          </div>
        </div>

        {/* Controls: Segmented Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Tab Filter */}
          <div className="inline-flex p-1 bg-[#0C0C0E] border border-white/[0.07] rounded-xl self-start">
            {(["Semua", "Lomba", "Beasiswa", "Seminar"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  selectedCategory === cat
                    ? "bg-white/[0.08] text-[#FAFAFA] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                    : "text-[#888890] hover:text-[#FAFAFA]"
                }`}
              >
                {cat}
              </button>
            ))}
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

        {/* Feed Cards Section */}
        {isLoading ? (
          /* Clean Skeleton */
          <div className="space-y-3.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-white/[0.04] rounded" />
                  <div className="h-4 w-24 bg-white/[0.04] rounded" />
                </div>
                <div className="h-5 w-2/3 bg-white/[0.06] rounded" />
                <div className="h-4 w-full bg-white/[0.03] rounded" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          /* Error State with Minimalist Retry */
          <div className="p-8 rounded-2xl bg-[#0C0C0E] border border-rose-900/40 text-center space-y-3">
            <p className="text-xs text-rose-300">{errorMessage}</p>
            <button
              type="button"
              onClick={loadFeed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-[#FAFAFA] border border-white/[0.08] transition active:scale-[0.98]"
            >
              <RefreshCw className="w-3 h-3" />
              Muat Ulang
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] text-center space-y-2">
            <p className="text-sm font-medium text-[#FAFAFA]">
              Tidak ada peluang yang cocok
            </p>
            <p className="text-xs text-[#888890]">
              {searchQuery
                ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}".`
                : "Belum ada peluang terverifikasi pada kategori ini."}
            </p>
          </div>
        ) : (
          /* Linear / wridev.id Inspired List Cards (Calm & Architectural) */
          <div className="space-y-3">
            {filteredOpportunities.map((item, index) => {
              const deadline = item.caption || item.deadline || "Segera";
              const matchScore = item.matchPercentage ?? 75;
              const isHighMatch = matchScore >= 80;

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectOpportunity(item)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className="surface-panel surface-interactive group p-5 sm:p-6 rounded-2xl cursor-pointer space-y-3 relative animate-fade-slide-up"
                >
                  {/* Top Line: Category & Verified Badge + Match Score */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[#888890] uppercase tracking-wider text-[11px]">
                        {item.category}
                      </span>
                      {item.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Terverifikasi</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md border ${
                          isHighMatch
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                            : "bg-white/[0.04] border-white/[0.08] text-[#888890]"
                        }`}
                      >
                        {matchScore}% Cocok
                      </span>

                      <ArrowUpRight className="w-3.5 h-3.5 text-[#888890] group-hover:text-[#FAFAFA] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Title & Organizer */}
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-semibold tracking-[-0.02em] text-[#FAFAFA] group-hover:text-emerald-400 transition-colors leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#888890]">
                      {item.organizer}
                    </p>
                  </div>

                  {/* 1 Kalimat Alasan AI (Clean Secondary Typography) */}
                  <p className="text-xs text-[#888890] leading-relaxed line-clamp-2 pt-1 border-t border-white/[0.04]">
                    <span className="text-emerald-400/80 mr-1.5 font-medium">&bull;</span>
                    {item.recommendationReason}
                  </p>

                  {/* Deadline & Meta Footer */}
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#888890]/80">
                    <span>
                      Batas waktu: <strong className="text-[#FAFAFA] font-normal tabular-nums">{deadline}</strong>
                    </span>

                    <span className="text-emerald-400 group-hover:underline">
                      Detail &amp; Roadmap &rarr;
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Editorial Clean Footer */}
      <footer className="text-center py-6 text-[11px] text-[#888890]/50 font-mono border-t border-white/[0.04] mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
