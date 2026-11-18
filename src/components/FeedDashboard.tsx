"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, ScoredOpportunity, PersonalizedOpportunity } from "@/types/schema";
import { fetchPersonalizedFeed } from "@/lib/apiClient";
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  Calendar,
  Building2,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  Edit3,
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
      setErrorMessage("Terjadi gangguan jaringan saat memuat rekomendasi AI.");
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
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans">
      {/* Top Editorial Header */}
      <header className="sticky top-0 z-30 bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand & User Meta */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-100">
                  ANGKASA INTELLIGENCE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  FEED AKTIF
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userProfile.full_name} &bull; {userProfile.institution || "Mahasiswa"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onEditProfile}
              className="px-3.5 py-2 rounded-xl bg-[#111113] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ubah Minat ({userProfile.profiling?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-[#111113] hover:bg-rose-950/20 border border-white/[0.08] hover:border-rose-900/40 text-xs font-semibold text-slate-400 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Profiling Tag Strip */}
        <div className="bg-[#111113]/60 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              Profil:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {(userProfile.profiling || []).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-300 font-medium whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2">
          {/* Category Tabs */}
          <div className="inline-flex p-1 bg-[#111113] border border-white/[0.08] rounded-2xl self-start">
            {(["Semua", "Lomba", "Beasiswa", "Seminar"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari peluang atau institusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#111113] border border-white/[0.08] focus:border-emerald-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Feed List or States */}
        {isLoading ? (
          /* Skeleton Loading */
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-6 rounded-2xl bg-[#111113] border border-white/[0.08] animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-white/[0.06] rounded-md" />
                  <div className="h-5 w-28 bg-white/[0.06] rounded-md" />
                </div>
                <div className="h-6 w-3/4 bg-white/[0.08] rounded-md" />
                <div className="h-4 w-1/3 bg-white/[0.04] rounded-md" />
                <div className="h-12 w-full bg-white/[0.04] rounded-xl" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          /* Error State with Retry */
          <div className="p-8 rounded-2xl bg-[#111113] border border-rose-900/40 text-center space-y-3">
            <p className="text-sm text-rose-300">{errorMessage}</p>
            <button
              type="button"
              onClick={loadFeed}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.1] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang
            </button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#111113] border border-white/[0.08] text-center space-y-2">
            <h3 className="text-base font-semibold text-slate-300">
              Tidak Ada Peluang yang Cocok
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan peluang dengan kata kunci "${searchQuery}".`
                : "Belum ada peluang terverifikasi pada kategori ini."}
            </p>
          </div>
        ) : (
          /* Cards Grid / List (Clean Editorial Style) */
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>
                Menampilkan <strong className="text-slate-200">{filteredOpportunities.length}</strong> rekomendasi terpersonalisasi
              </span>
              <span className="text-[11px] text-slate-500">Urut berdasarkan skor relevansi AI</span>
            </div>

            {filteredOpportunities.map((item) => {
              const deadline = item.caption || item.deadline || "Segera";
              const matchScore = item.matchPercentage ?? 75;
              const isHighMatch = matchScore >= 80;

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectOpportunity(item)}
                  className="group p-6 rounded-2xl bg-[#111113] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 cursor-pointer space-y-4 relative"
                >
                  {/* Element 1: Badges & Scores */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 tracking-wide">
                        {item.category}
                      </span>
                      {item.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Terverifikasi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                          isHighMatch
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {matchScore}% Cocok
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] group-hover:bg-emerald-500 group-hover:text-slate-950 transition flex items-center justify-center text-slate-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Element 2: Judul & Penyelenggara */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{item.organizer}</span>
                    </p>
                  </div>

                  {/* Element 4: 1 Blok Kutipan Alasan Kecocokan AI (Anti-AI Slop) */}
                  <blockquote className="p-3.5 rounded-xl bg-[#09090B] border-l-2 border-emerald-500 text-xs text-slate-300 leading-relaxed italic">
                    &ldquo;{item.recommendationReason}&rdquo;
                  </blockquote>

                  {/* Element 3: Tenggat Waktu & Footer Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Batas Pendaftaran: <strong className="text-slate-300 font-semibold">{deadline}</strong></span>
                    </span>

                    <span className="text-[11px] text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                      Lihat Roadmap &amp; Tim &rarr;
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="text-center py-6 text-[11px] text-slate-500 border-t border-white/[0.04]">
        Aplikasi Angkasa &bull; Explor[AI]tion Hackathon 2026
      </footer>
    </div>
  );
}
