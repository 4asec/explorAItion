"use client";

import React, { useState, useEffect } from "react";
import {
  ScoredOpportunity,
  UserProfile,
  RoadmapResponse,
  TeamRequest,
} from "@/types/schema";
import {
  fetchPreparationRoadmap,
  getTeamRequests,
  createTeamRequest,
  sendTeamInvite,
  getUserBookmarks,
  toggleBookmark,
} from "@/lib/apiClient";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Award,
  Wrench,
  AlertCircle,
  Loader2,
  Plus,
  Send,
  UserCheck,
  Bookmark,
} from "lucide-react";

export interface OpportunityDetailProps {
  opportunity: ScoredOpportunity;
  userProfile: UserProfile;
  onBack: () => void;
}

type ActiveTab = "roadmap" | "team";
type TeamRole = "Hacker" | "Hipster" | "Hustler";

export default function OpportunityDetail({
  opportunity,
  userProfile,
  onBack,
}: OpportunityDetailProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("roadmap");

  // State untuk Tab 1: AI Roadmap
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState<boolean>(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  // State untuk P7 Bookmark
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // State untuk Tab 2: Team Finding Anti-Duplikasi
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Form State untuk Buat Tim Baru
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("Hacker");
  const [roleDetail, setRoleDetail] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamMessage, setCreateTeamMessage] = useState<string | null>(null);

  // Invite Status Tracking per TeamRequest ID
  const [inviteStatus, setInviteStatus] = useState<
    Record<string, { loading: boolean; success: boolean; error: string | null }>
  >({});

  // Normalisasi data peluang
  const deadline = opportunity.caption || opportunity.deadline || "Segera";
  const description =
    opportunity.description_roadmap ||
    opportunity.description ||
    "Deskripsi peluang belum dicantumkan oleh kurator.";

  // Fetch initial roadmap on mount
  const handleGenerateRoadmap = async () => {
    setIsRoadmapLoading(true);
    setRoadmapError(null);
    try {
      const res = await fetchPreparationRoadmap(userProfile, opportunity);
      if (res.error || !res.data) {
        setRoadmapError(res.error || "Gagal menyusun roadmap AI.");
      } else {
        setRoadmap(res.data);
      }
    } catch {
      setRoadmapError("Gangguan koneksi saat menyusun roadmap persiapan AI.");
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  // Check initial bookmark status
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const res = await getUserBookmarks(userProfile.id);
        if (res.data) {
          setIsBookmarked(res.data.includes(opportunity.id));
        }
      } catch (e) {
        console.warn("[Check Bookmark Error]", e);
      }
    };
    checkBookmark();
  }, [userProfile.id, opportunity.id]);

  const handleToggleBookmark = async () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await toggleBookmark(userProfile.id, opportunity.id);
    } catch (err) {
      console.warn("[Toggle Bookmark Error]", err);
    }
  };

  // Fetch team requests when switching to tab team
  const loadTeamRequests = async () => {
    setIsTeamLoading(true);
    setTeamError(null);
    try {
      const res = await getTeamRequests(opportunity.id);
      if (res.error || !res.data) {
        setTeamError(res.error || "Gagal memuat daftar tim.");
      } else {
        setTeamRequests(res.data);
      }
    } catch {
      setTeamError("Gagal mengambil data tim kolaborasi.");
    } finally {
      setIsTeamLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateRoadmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity.id]);

  useEffect(() => {
    if (activeTab === "team") {
      loadTeamRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleCheckDoc = (index: number) => {
    setCheckedDocs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Submit Buat Tim Baru
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setCreateTeamMessage("Nama tim tidak boleh kosong.");
      return;
    }

    setIsCreatingTeam(true);
    setCreateTeamMessage(null);

    const fullRoleNeeded = roleDetail.trim()
      ? `${selectedRole} (${roleDetail.trim()})`
      : selectedRole;

    try {
      const res = await createTeamRequest({
        opportunity_id: opportunity.id,
        creator_id: userProfile.id,
        creator_name: userProfile.full_name,
        team_name: newTeamName.trim(),
        role_needed: fullRoleNeeded,
      });

      if (res.error || !res.data) {
        setCreateTeamMessage(res.error || "Gagal membuat tim.");
      } else {
        setNewTeamName("");
        setRoleDetail("");
        setCreateTeamMessage("Tim berhasil didaftarkan ke bursa kolaborasi.");
        setTeamRequests((prev) => [res.data as TeamRequest, ...prev]);
      }
    } catch {
      setCreateTeamMessage("Terjadi kegagalan jaringan saat mendaftarkan tim.");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Ajukan Kolaborasi (Join Team)
  const handleSendInvite = async (teamId: string) => {
    setInviteStatus((prev) => ({
      ...prev,
      [teamId]: { loading: true, success: false, error: null },
    }));

    try {
      const res = await sendTeamInvite(opportunity.id, teamId, userProfile.id, {
        applicant_name: userProfile.full_name,
        role_applied: userProfile.profiling?.[0] || "Anggota Tim",
        message: `Halo, saya tertarik bergabung dengan tim Anda untuk ajang ${opportunity.title}.`,
      });

      if (res.success) {
        setInviteStatus((prev) => ({
          ...prev,
          [teamId]: { loading: false, success: true, error: null },
        }));
      } else {
        setInviteStatus((prev) => ({
          ...prev,
          [teamId]: {
            loading: false,
            success: false,
            error: res.error || "Gagal mengirimkan ajakan kolaborasi.",
          },
        }));
      }
    } catch {
      setInviteStatus((prev) => ({
        ...prev,
        [teamId]: {
          loading: false,
          success: false,
          error: "Gangguan koneksi saat mengirim permintaan kolaborasi.",
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-[#050505]/85 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] text-xs font-medium text-[#FAFAFA] transition active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#888890]" />
            <span>Kembali ke Feed</span>
          </button>

          <div className="flex items-center gap-2.5">
            {/* Tombol Bookmark P7 */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition active:scale-[0.98] cursor-pointer ${
                isBookmarked
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-[#0C0C0E] border-white/[0.07] text-[#888890] hover:text-[#FAFAFA] hover:border-white/[0.14]"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-emerald-400" : ""}`} />
              <span>{isBookmarked ? "Tersimpan" : "Simpan"}</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#888890] hidden sm:inline">Kesesuaian:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold tabular-nums">
                {opportunity.matchPercentage}% Relevan
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-slide-up">
        {/* Opportunity Editorial Header Card */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-6">
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#888890] uppercase tracking-wider text-[11px]">
                {opportunity.category}
              </span>
              {opportunity.is_verified && (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Terverifikasi</span>
                </span>
              )}
            </div>

            <div className="text-[#888890] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Batas waktu: <strong className="text-[#FAFAFA] font-normal tabular-nums">{deadline}</strong></span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#FAFAFA] leading-tight">
              {opportunity.title}
            </h1>
            <p className="text-xs text-[#888890]">
              Diselenggarakan oleh <strong className="text-[#FAFAFA] font-medium">{opportunity.organizer}</strong>
            </p>
          </div>

          {/* AI Reason Callout */}
          <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.06] border-l-2 border-l-emerald-500 space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase">
              Rekomendasi Personalisasi AI
            </span>
            <p className="text-xs text-[#FAFAFA] leading-relaxed italic">
              &ldquo;{opportunity.recommendationReason}&rdquo;
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-white/[0.04]">
            <h2 className="text-xs font-mono uppercase text-[#888890] tracking-wider">
              Deskripsi Program
            </h2>
            <p className="text-xs sm:text-sm text-[#888890] leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Requirements & Required Skills */}
          {((opportunity.requirements && opportunity.requirements.length > 0) ||
            (opportunity.required_skills && opportunity.required_skills.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {opportunity.requirements && opportunity.requirements.length > 0 && (
                <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.06] space-y-2">
                  <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider">
                    Persyaratan
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#888890]">
                    {opportunity.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0">&bull;</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.06] space-y-2">
                  <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider">
                    Kualifikasi Keahlian
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs font-mono text-[#888890]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Official Registration CTA */}
          <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-white/[0.04]">
            <span className="text-xs text-[#888890]">
              Tautan menuju formulir dan petunjuk teknis resmi panitia penyelenggara.
            </span>
            <a
              href={opportunity.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#050505] font-semibold text-xs transition active:scale-[0.98]"
            >
              <span>Buka Portal Resmi</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* Segmented Tab Controls */}
        <div className="space-y-6">
          <div className="inline-flex p-1 bg-[#0C0C0E] border border-white/[0.07] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === "roadmap"
                  ? "bg-white/[0.08] text-[#FAFAFA] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-[#888890] hover:text-[#FAFAFA]"
              }`}
            >
              Roadmap Persiapan AI
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === "team"
                  ? "bg-white/[0.08] text-[#FAFAFA] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-[#888890] hover:text-[#FAFAFA]"
              }`}
            >
              Cari Rekan Tim
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: AI PREPARATION ROADMAP */}
          {/* ========================================================= */}
          {activeTab === "roadmap" && (
            <div className="space-y-6 animate-fade-slide-up">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-[#FAFAFA]">
                    Panduan Persiapan Menuju Deadline
                  </h2>
                  <p className="text-xs text-[#888890]">
                    Milestone terstruktur dan strategi pemenangan yang dikalibrasi oleh AI.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRoadmap}
                  disabled={isRoadmapLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C0C0E] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] text-xs font-medium text-[#FAFAFA] transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isRoadmapLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#888890]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  <span>Perbarui Analisis</span>
                </button>
              </div>

              {isRoadmapLoading ? (
                <div className="p-10 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  <p className="text-xs text-[#888890]">
                    AI sedang menyusun linimasa, berkas kelolosan, dan strategi pemenangan...
                  </p>
                </div>
              ) : roadmapError ? (
                <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-rose-900/40 text-center space-y-2">
                  <p className="text-xs text-rose-300">{roadmapError}</p>
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-[#FAFAFA] cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : roadmap ? (
                <div className="space-y-6">
                  {/* Minimalist Vertical Timeline Rail */}
                  <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
                    <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Linimasa Bertahap</span>
                    </h3>

                    <div className="relative pl-6 border-l border-white/[0.08] space-y-6 ml-2 my-2">
                      {roadmap.timeline.map((item, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#050505] border-2 border-emerald-400" />
                          <span className="font-mono text-xs text-emerald-400 font-medium">
                            {item.phase}
                          </span>
                          <p className="text-xs sm:text-sm text-[#888890] leading-relaxed">
                            {item.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Dokumen Interaktif */}
                  <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
                    <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Checklist Berkas &amp; Dokumen</span>
                    </h3>

                    <div className="space-y-2.5">
                      {roadmap.document_checklist.map((doc, idx) => {
                        const isDone = !!checkedDocs[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleCheckDoc(idx)}
                            className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 select-none ${
                              isDone
                                ? "bg-white/[0.02] border-white/[0.04] text-[#888890]/60"
                                : "bg-[#050505] border-white/[0.06] hover:border-white/[0.14] text-[#FAFAFA]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleCheckDoc(idx)}
                              className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer"
                            />
                            <div className="space-y-0.5 flex-1 text-xs">
                              <p className={`font-medium ${isDone ? "line-through text-[#888890]/60" : "text-[#FAFAFA]"}`}>
                                {doc.item}
                              </p>
                              <p className="text-[#888890] leading-relaxed">
                                {doc.tip}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3 Strategi Pemenangan */}
                  <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
                    <h3 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Strategi Kunci Kelolosan</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {roadmap.winning_strategy.map((strat, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#050505] border border-white/[0.06] space-y-2"
                        >
                          <span className="font-mono text-xs font-semibold text-emerald-400">
                            0{idx + 1}
                          </span>
                          <p className="text-xs text-[#888890] leading-relaxed">
                            {strat}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Tools & Curation Tips */}
                  {(roadmap.recommended_tools || roadmap.curation_tips) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roadmap.recommended_tools && roadmap.recommended_tools.length > 0 && (
                        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] space-y-3">
                          <h4 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Perangkat Kerja Pendukung</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {roadmap.recommended_tools.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-[#050505] border border-white/[0.06] text-xs font-mono text-[#FAFAFA]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {roadmap.curation_tips && roadmap.curation_tips.length > 0 && (
                        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] space-y-3">
                          <h4 className="text-xs font-mono uppercase text-[#888890] tracking-wider flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Kriteria Kurasi Juri</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-[#888890]">
                            {roadmap.curation_tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 shrink-0">&bull;</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TEAM FINDING (ANTI-DUPLIKASI) */}
          {/* ========================================================= */}
          {activeTab === "team" && (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Form Ringkas: Buat Lowongan Tim Baru */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-[#FAFAFA]">
                    Inisiasi Tim Kolaborasi
                  </h3>
                  <p className="text-xs text-[#888890]">
                    Pilih posisi anggota yang dibutuhkan berdasarkan pembagian peran Hacker, Hipster, atau Hustler.
                  </p>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-[#888890]">
                        Nama Tim
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Nusantara Vision"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-white/20 text-xs sm:text-sm text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-[#888890]">
                        Role yang Dibutuhkan
                      </label>
                      <div className="flex gap-1.5">
                        {(["Hacker", "Hipster", "Hustler"] as TeamRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer active:scale-[0.98] ${
                              selectedRole === r
                                ? "bg-white/[0.1] text-[#FAFAFA] border border-white/[0.16]"
                                : "bg-[#050505] text-[#888890] border border-white/[0.07] hover:text-[#FAFAFA]"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#888890]">
                      Kualifikasi Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Menguasai Next.js & Supabase..."
                      value={roleDetail}
                      onChange={(e) => setRoleDetail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-white/20 text-xs sm:text-sm text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>

                  {createTeamMessage && (
                    <p
                      className={`text-xs p-3 rounded-lg border ${
                        createTeamMessage.includes("berhasil")
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-950/20 border-rose-800/30 text-rose-300"
                      }`}
                    >
                      {createTeamMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isCreatingTeam || !newTeamName.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#050505] font-semibold text-xs transition disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                  >
                    {isCreatingTeam ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Daftarkan Tim</span>
                  </button>
                </form>
              </div>

              {/* Daftar Tim Aktif */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase text-[#888890]">
                    Bursa Tim Terdaftar (<span className="tabular-nums text-[#FAFAFA]">{teamRequests.length}</span>)
                  </span>
                  <button
                    type="button"
                    onClick={loadTeamRequests}
                    className="text-[#888890] hover:text-[#FAFAFA] transition cursor-pointer"
                  >
                    Muat Ulang
                  </button>
                </div>

                {isTeamLoading ? (
                  <div className="p-8 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] text-center space-y-2">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-xs text-[#888890]">Memeriksa bursa tim...</p>
                  </div>
                ) : teamError ? (
                  <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-rose-900/30 text-center text-xs text-rose-300">
                    {teamError}
                  </div>
                ) : teamRequests.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] text-center space-y-1">
                    <p className="text-xs text-[#FAFAFA] font-medium">
                      Belum ada tim terdaftar
                    </p>
                    <p className="text-[11px] text-[#888890]">
                      Jadilah inisiator pertama dengan mendaftarkan tim Anda di atas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teamRequests.map((team) => {
                      const isCreator = team.creator_id === userProfile.id;
                      const status = inviteStatus[team.id];

                      return (
                        <div
                          key={team.id}
                          className="surface-panel p-5 rounded-2xl space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#FAFAFA]">
                                {team.team_name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-emerald-400">
                                {team.role_needed}
                              </span>
                            </div>

                            <p className="text-xs text-[#888890]">
                              Inisiator: <strong className="text-[#FAFAFA] font-normal">{team.creator_name}</strong>
                              {isCreator && " (Anda)"}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/[0.04] space-y-2">
                            {status?.error && (
                              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{status.error}</span>
                              </p>
                            )}

                            {isCreator ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#888890] font-mono">
                                <UserCheck className="w-3 h-3 text-emerald-400" />
                                <span>Tim Anda</span>
                              </span>
                            ) : status?.success ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Permintaan Terkirim</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendInvite(team.id)}
                                disabled={status?.loading}
                                className="w-full py-1.5 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-[#FAFAFA] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                              >
                                {status?.loading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span>Ajukan Kolaborasi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Editorial Clean Footer */}
      <footer className="text-center py-6 text-[11px] text-[#888890]/50 font-mono border-t border-white/[0.04]">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
