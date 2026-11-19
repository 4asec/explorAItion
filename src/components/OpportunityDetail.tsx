"use client";

import React, { useState, useEffect } from "react";
import {
  ScoredOpportunity,
  UserProfile,
  RoadmapResponse,
  TeamRequest,
  TeamInvite,
} from "@/types/schema";
import {
  fetchPreparationRoadmap,
  getTeamRequests,
  createTeamRequest,
  sendTeamInvite,
  getUserBookmarks,
  toggleBookmark,
  getTeamInvitesForOpportunity,
  updateTeamInviteStatus,
} from "@/lib/apiClient";
import BackgroundOrnaments from "@/components/BackgroundOrnaments";
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
  Users,
  UserPlus,
  PlusCircle,
  ArrowRight,
  X,
} from "lucide-react";

export interface OpportunityDetailProps {
  opportunity: ScoredOpportunity;
  userProfile: UserProfile;
  onBack: () => void;
}

type ActiveTab = "roadmap" | "team";

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
  const [opportunityInvites, setOpportunityInvites] = useState<TeamInvite[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Pop-up Konfirmasi & Mode Tampilan Tim ("list" | "create")
  const [showTeamActionModal, setShowTeamActionModal] = useState<boolean>(false);
  const [teamViewMode, setTeamViewMode] = useState<"list" | "create">("list");
  const [teamNoticeBanner, setTeamNoticeBanner] = useState<string | null>(null);

  // Form State untuk Inisiasi Tim Baru (Tanpa Role Hacker/Hipster/Hustler)
  const [newTeamName, setNewTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamContact, setTeamContact] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamMessage, setCreateTeamMessage] = useState<string | null>(null);

  const teamNameInputRef = React.useRef<HTMLInputElement | null>(null);

  // Invite Status Tracking per TeamRequest ID
  const [inviteStatus, setInviteStatus] = useState<
    Record<string, { loading: boolean; success: boolean; error: string | null }>
  >({});

  // Cek apakah user sudah mengirim ajakan kolaborasi / memiliki tim pada peluang ini (Anti-Duplikasi Celah)
  const userHasTeam = teamRequests.some((t) => t.creator_id === userProfile.id);
  const hasSentInvite =
    teamRequests.some((t) => t.hasRequested) ||
    Object.values(inviteStatus).some((status) => status.success) ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem(`angkasa_sent_invite_${userProfile.id}_${opportunity.id}`) === "true");
  const isUserLocked = userHasTeam || hasSentInvite;

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

  // Fetch team requests dan permohonan tim (invites) when switching to tab team
  const loadTeamRequests = async () => {
    setIsTeamLoading(true);
    setTeamError(null);
    try {
      const [res, invites] = await Promise.all([
        getTeamRequests(opportunity.id),
        getTeamInvitesForOpportunity(opportunity.id),
      ]);
      if (res.error || !res.data) {
        setTeamError(res.error || "Gagal memuat daftar tim.");
      } else {
        setTeamRequests(res.data);
      }
      setOpportunityInvites(invites);
    } catch {
      setTeamError("Gagal mengambil data tim kolaborasi.");
    } finally {
      setIsTeamLoading(false);
    }
  };

  // Handler Persetujuan Permintaan Bergabung Masuk (Terima)
  const handleAcceptInvite = async (inviteId: string) => {
    const res = await updateTeamInviteStatus(inviteId, "accepted");
    if (res.success && res.data) {
      setOpportunityInvites((prev) =>
        prev.map((inv) => (inv.id === inviteId ? res.data! : inv))
      );
    }
  };

  // Handler Penolakan Permintaan Bergabung Masuk (Tolak)
  const handleRejectInvite = async (inviteId: string) => {
    const res = await updateTeamInviteStatus(inviteId, "rejected");
    if (res.success && res.data) {
      setOpportunityInvites((prev) =>
        prev.map((inv) => (inv.id === inviteId ? res.data! : inv))
      );
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

  // Handler Modal: Pilihan 1 - "Buat Tim Baru"
  const handleSelectCreateTeam = () => {
    if (isUserLocked) return;
    setShowTeamActionModal(false);
    setTeamNoticeBanner(null);
    setTeamViewMode("create");
    setTimeout(() => {
      teamNameInputRef.current?.focus();
    }, 150);
  };

  // Handler Modal: Pilihan 2 - "Join Tim Lain"
  const handleSelectJoinTeam = async () => {
    setShowTeamActionModal(false);
    setIsTeamLoading(true);
    setTeamError(null);

    try {
      const [res, invites] = await Promise.all([
        getTeamRequests(opportunity.id),
        getTeamInvitesForOpportunity(opportunity.id),
      ]);
      const teams = res.data || [];
      setTeamRequests(teams);
      setOpportunityInvites(invites);

      if (teams.length === 0) {
        // Jika tidak ada tim: banner info jika belum buat tim, tetap di mode list
        if (!isUserLocked) {
          setTeamNoticeBanner("Tidak ada tim, silahkan buat tim");
        } else {
          setTeamNoticeBanner(null);
        }
        setTeamViewMode("list");
      } else {
        setTeamNoticeBanner(null);
        setTeamViewMode("list");
      }
    } catch {
      setTeamNoticeBanner(null);
      setTeamViewMode("list");
    } finally {
      setIsTeamLoading(false);
    }
  };

  // Submit Buat Tim Baru (Tanpa Pilihan Role Hacker/Hipster/Hustler)
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setCreateTeamMessage("Nama tim tidak boleh kosong.");
      return;
    }

    setIsCreatingTeam(true);
    setCreateTeamMessage(null);

    // Kebutuhan kolaborasi & kontak diformat bersih
    const needsSummary = [
      teamDescription.trim() || "Mencari rekan kolaborator",
      teamContact.trim() ? `Kontak: ${teamContact.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    try {
      const res = await createTeamRequest({
        opportunity_id: opportunity.id,
        creator_id: userProfile.id,
        creator_name: userProfile.full_name,
        team_name: newTeamName.trim(),
        role_needed: needsSummary,
      });

      if (res.error || !res.data) {
        setCreateTeamMessage(res.error || "Gagal membuat tim.");
      } else {
        setNewTeamName("");
        setTeamDescription("");
        setTeamContact("");
        setCreateTeamMessage("Tim berhasil didaftarkan ke bursa kolaborasi.");
        setTeamNoticeBanner(null);
        setTeamRequests((prev) => [res.data as TeamRequest, ...prev]);
        const invites = await getTeamInvitesForOpportunity(opportunity.id);
        setOpportunityInvites(invites);
        setTeamViewMode("list");
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
      const targetTeam = teamRequests.find((t) => t.id === teamId);
      const res = await sendTeamInvite(opportunity.id, teamId, userProfile.id, {
        applicant_name: userProfile.full_name,
        role_applied: userProfile.profiling?.[0] || "Anggota Tim",
        message: `Halo, saya tertarik bergabung dengan tim Anda untuk ajang ${opportunity.title}.`,
        opportunity_title: opportunity.title,
        team_name: targetTeam?.team_name,
      });

      if (res.success) {
        setInviteStatus((prev) => ({
          ...prev,
          [teamId]: { loading: false, success: true, error: null },
        }));
        const updatedInvites = await getTeamInvitesForOpportunity(opportunity.id);
        setOpportunityInvites(updatedInvites);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`angkasa_sent_invite_${userProfile.id}_${opportunity.id}`, "true");
          } catch (e) {
            console.warn("[Invite Storage Error]", e);
          }
        }
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Ornamen Background Y2K Tech-Cyber */}
      <BackgroundOrnaments />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-[#004aad]/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white/80" />
            <span className="hidden xs:inline sm:inline">Kembali ke Feed</span>
            <span className="inline xs:hidden">Feed</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Tombol Bookmark P7 */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md ${
                isBookmarked
                  ? "bg-amber-400/20 border-amber-300/40 text-amber-300 font-semibold"
                  : "bg-white/10 border-white/20 text-white/80 hover:text-white hover:border-white/40"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-300" : ""}`} />
              <span>{isBookmarked ? "Tersimpan" : "Simpan"}</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs">
              <span className="text-white/70 hidden sm:inline">Kesesuaian:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-amber-300 font-semibold tabular-nums text-[11px] sm:text-xs">
                {opportunity.matchPercentage}% Relevan
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-slide-up">
        {/* Opportunity Editorial Header Card */}
        <section className="surface-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white/80 uppercase tracking-wider text-[11px]">
                {opportunity.category}
              </span>
              {opportunity.is_verified && (
                <span className="inline-flex items-center gap-1 text-amber-300 font-medium text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-amber-300" />
                  <span>Terverifikasi</span>
                </span>
              )}
            </div>

            <div className="text-white/80 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              <span>Batas waktu: <strong className="text-white font-normal tabular-nums">{deadline}</strong></span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white leading-tight">
              {opportunity.title}
            </h1>
            <p className="text-xs text-white/80">
              Diselenggarakan oleh <strong className="text-white font-medium">{opportunity.organizer}</strong>
            </p>
          </div>

          {/* AI Reason Callout */}
          <div className="p-4 rounded-xl bg-white/[0.08] border border-white/20 border-l-4 border-l-amber-400 space-y-1 backdrop-blur-sm">
            <span className="text-[10px] font-mono tracking-wider text-amber-300 uppercase font-semibold">
              Rekomendasi Personalisasi AI
            </span>
            <p className="text-xs text-white leading-relaxed italic">
              &ldquo;{opportunity.recommendationReason}&rdquo;
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h2 className="text-xs font-mono uppercase text-white/80 tracking-wider">
              Deskripsi Program
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Requirements & Required Skills */}
          {((opportunity.requirements && opportunity.requirements.length > 0) ||
            (opportunity.required_skills && opportunity.required_skills.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {opportunity.requirements && opportunity.requirements.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.06] border border-white/15 space-y-2 backdrop-blur-sm">
                  <h3 className="text-xs font-mono uppercase text-white/80 tracking-wider">
                    Persyaratan
                  </h3>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {opportunity.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-300 shrink-0">&bull;</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.06] border border-white/15 space-y-2 backdrop-blur-sm">
                  <h3 className="text-xs font-mono uppercase text-white/80 tracking-wider">
                    Kualifikasi Keahlian
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-xs font-mono text-white"
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
          <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-white/10">
            <span className="text-xs text-white/80">
              Tautan menuju formulir dan petunjuk teknis resmi panitia penyelenggara.
            </span>
            <a
              href={opportunity.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-xs transition active:scale-[0.98] shadow-md"
            >
              <span>Buka Portal Resmi</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#004aad]" />
            </a>
          </div>
        </section>

        {/* Segmented Tab Controls */}
        <div className="space-y-6">
          <div className="inline-flex p-1 bg-white/10 border border-white/20 rounded-xl backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === "roadmap"
                  ? "bg-white text-[#004aad] font-bold shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Roadmap Persiapan AI
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("team");
                setShowTeamActionModal(true);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === "team"
                  ? "bg-white text-[#004aad] font-bold shadow-md"
                  : "text-white/80 hover:text-white"
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
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                    Panduan Persiapan Menuju Deadline
                  </h2>
                  <p className="text-xs text-white/80">
                    Milestone terstruktur dan strategi pemenangan yang dikalibrasi oleh AI.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRoadmap}
                  disabled={isRoadmapLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition active:scale-[0.98] disabled:opacity-50 cursor-pointer backdrop-blur-md"
                >
                  {isRoadmapLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                  <span>Perbarui Analisis</span>
                </button>
              </div>

              {isRoadmapLoading ? (
                <div className="surface-panel p-10 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="w-6 h-6 text-amber-300 animate-spin" />
                  <p className="text-xs text-white/80">
                    AI sedang menyusun linimasa, berkas kelolosan, dan strategi pemenangan...
                  </p>
                </div>
              ) : roadmapError ? (
                <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-2">
                  <p className="text-xs text-rose-200">{roadmapError}</p>
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="px-3 py-1.5 rounded-lg bg-white/15 text-xs text-white cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : roadmap ? (
                <div className="space-y-6">
                  {/* Minimalist Vertical Timeline Rail */}
                  <div className="surface-panel p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Linimasa Bertahap</span>
                    </h3>

                    <div className="relative pl-6 border-l border-white/20 space-y-6 ml-2 my-2">
                      {roadmap.timeline.map((item, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#002b66] border-2 border-amber-300" />
                          <span className="font-mono text-xs text-amber-300 font-semibold">
                            {item.phase}
                          </span>
                          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                            {item.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Dokumen Interaktif */}
                  <div className="surface-panel p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                      <span>Checklist Berkas &amp; Dokumen</span>
                    </h3>

                    <div className="space-y-2.5">
                      {roadmap.document_checklist.map((doc, idx) => {
                        const isDone = !!checkedDocs[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleCheckDoc(idx)}
                            className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 select-none backdrop-blur-sm ${
                              isDone
                                ? "bg-white/[0.04] border-white/10 text-white/40"
                                : "bg-white/[0.08] border-white/15 hover:border-white/30 text-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleCheckDoc(idx)}
                              className="mt-0.5 w-4 h-4 accent-amber-400 cursor-pointer"
                            />
                            <div className="space-y-0.5 flex-1 text-xs">
                              <p className={`font-semibold ${isDone ? "line-through text-white/40" : "text-white"}`}>
                                {doc.item}
                              </p>
                              <p className="text-white/80 leading-relaxed">
                                {doc.tip}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3 Strategi Pemenangan */}
                  <div className="surface-panel p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-mono uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>Strategi Kunci Kelolosan</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {roadmap.winning_strategy.map((strat, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.08] border border-white/15 space-y-2 backdrop-blur-sm"
                        >
                          <span className="font-mono text-xs font-bold text-amber-300">
                            0{idx + 1}
                          </span>
                          <p className="text-xs text-white/80 leading-relaxed">
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
                        <div className="surface-panel p-5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-mono uppercase text-white/80 tracking-wider flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-amber-300" />
                            <span>Perangkat Kerja Pendukung</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {roadmap.recommended_tools.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono text-white"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {roadmap.curation_tips && roadmap.curation_tips.length > 0 && (
                        <div className="surface-panel p-5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-mono uppercase text-white/80 tracking-wider flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kriteria Kurasi Juri</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-white/80">
                            {roadmap.curation_tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-300 shrink-0">&bull;</span>
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
          {/* TAB 2: TEAM FINDING (DIKENDALIKAN MODAL & BEBAS EMOJI) */}
          {/* ========================================================= */}
          {activeTab === "team" && (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Header Tab Tim & Mode Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                    Bursa Kolaborasi Tim
                  </h2>
                  <p className="text-xs text-white/80">
                    Inisiasi tim baru atau temukan tim yang siap menerima kolaborasi rekan sejawat.
                  </p>
                </div>

                {/* Tombol Ganti Pilihan Modal (Menghilangkan tombol duplikat) */}
                <button
                  type="button"
                  onClick={() => setShowTeamActionModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-xs font-medium text-white transition-all duration-300 ease-out cursor-pointer backdrop-blur-md flex items-center gap-1.5 self-start sm:self-auto active:scale-95 shadow-sm"
                  title="Ganti Pilihan Aksi Kolaborasi"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ganti Pilihan</span>
                </button>
              </div>

              {/* Banner Pemberitahuan jika Tim Kosong saat memilih Join Tim Lain */}
              {teamNoticeBanner && (
                <div className="p-4 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 flex items-center justify-between gap-3 text-xs animate-fade-slide-up backdrop-blur-md shadow-md">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="font-semibold">{teamNoticeBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeamNoticeBanner(null)}
                    className="text-amber-300 hover:text-amber-100 text-xs font-mono transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* TAMPILAN 1: FORMULIR INISIASI TIM BARU (TANPA ROLE HACKER/HIPSTER/HUSTLER) */}
              {teamViewMode === "create" && (
                <div className="surface-panel p-6 sm:p-8 rounded-2xl space-y-5 animate-fade-slide-up">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[11px] font-mono">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Form Inisiasi Tim</span>
                    </div>
                    <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                      Daftarkan Tim Kolaborasi Baru
                    </h3>
                    <p className="text-xs text-white/80">
                      Tentukan nama tim dan rincikan kriteria rekan kolaborator yang Anda perlukan untuk peluang ini.
                    </p>
                  </div>

                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/80">
                        Nama Tim <span className="text-amber-300">*</span>
                      </label>
                      <input
                        ref={teamNameInputRef}
                        type="text"
                        placeholder="Contoh: Nusantara Vision"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/80">
                        Deskripsi Kebutuhan Kolaborator
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Mencari rekan yang berkomitmen mengerjakan proposal, riset kebutuhan pengguna, atau implementasi teknis..."
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none transition resize-none backdrop-blur-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/80">
                        Kontak / Saluran Komunikasi (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: WhatsApp 08123456789 atau Discord @username"
                        value={teamContact}
                        onChange={(e) => setTeamContact(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                      />
                    </div>

                    {createTeamMessage && (
                      <p
                        className={`text-xs p-3 rounded-xl border ${
                          createTeamMessage.includes("berhasil")
                            ? "bg-amber-400/20 border-amber-300/40 text-amber-300 font-medium"
                            : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                        }`}
                      >
                        {createTeamMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={isCreatingTeam || !newTeamName.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-xs transition disabled:opacity-40 cursor-pointer active:scale-[0.98] shadow-md"
                      >
                        {isCreatingTeam ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004aad]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-[#004aad]" />
                        )}
                        <span>Daftarkan Tim</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTeamNoticeBanner(null);
                          setTeamViewMode("list");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAMPILAN 2: DAFTAR TIM AKTIF (BURSA KOLABORASI) */}
              {teamViewMode === "list" && (
                <div className="space-y-4 animate-fade-slide-up">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase text-white/80">
                      Bursa Tim Terdaftar (<span className="tabular-nums text-white font-semibold">{teamRequests.length}</span>)
                    </span>
                    <button
                      type="button"
                      onClick={loadTeamRequests}
                      className="text-white/80 hover:text-white transition cursor-pointer text-xs font-mono"
                    >
                      Muat Ulang
                    </button>
                  </div>

                  {isTeamLoading ? (
                    <div className="surface-panel p-10 rounded-2xl text-center space-y-2">
                      <Loader2 className="w-5 h-5 text-amber-300 animate-spin mx-auto" />
                      <p className="text-xs text-white/80">Memeriksa bursa tim...</p>
                    </div>
                  ) : teamError ? (
                    <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center text-xs text-rose-200">
                      {teamError}
                    </div>
                  ) : teamRequests.length === 0 ? (
                    <div className="surface-panel p-10 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          Belum ada tim terdaftar
                        </p>
                        <p className="text-xs text-white/80 max-w-sm mx-auto">
                          {isUserLocked
                            ? "Belum ada tim lain terdaftar pada ajang ini."
                            : "Belum ada tim terdaftar pada ajang ini."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTeamActionModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition active:scale-[0.98] cursor-pointer shadow-sm backdrop-blur-md"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                        <span>Kembali ke Opsi Kolaborasi</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teamRequests.map((team) => {
                        const isCreator = team.creator_id === userProfile.id;
                        const status = inviteStatus[team.id];
                        const isRequested = team.hasRequested || status?.success;

                        // Data Permohonan & Anggota Kelompok untuk tim ini
                        const teamInvites = opportunityInvites.filter((inv) => inv.team_request_id === team.id);
                        const acceptedMembers = teamInvites.filter((inv) => inv.status === "accepted");
                        const pendingInvites = teamInvites.filter((inv) => inv.status === "pending");

                        return (
                          <div
                            key={team.id}
                            className="surface-panel p-5 rounded-2xl space-y-3.5 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <h4 className="text-sm font-semibold text-white">
                                    {team.team_name}
                                  </h4>
                                  <p className="text-xs text-white/80">
                                    Inisiator: <strong className="text-white font-medium">{team.creator_name}</strong>
                                    {isCreator && (
                                      <span className="text-amber-300 ml-1.5 font-mono text-[11px] font-semibold">(Anda)</span>
                                    )}
                                  </p>
                                </div>

                                {isCreator && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-[10px] font-mono text-amber-300 shrink-0 font-semibold">
                                    Tim Anda
                                  </span>
                                )}
                              </div>

                              {/* Ringkasan Kebutuhan Tim (Tanpa Role Hacker/Hipster/Hustler) */}
                              {team.role_needed && (
                                <div className="p-3 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-white/80 leading-relaxed space-y-1 backdrop-blur-sm">
                                  <span className="text-[10px] font-mono uppercase text-white/70 tracking-wider block">
                                    Kebutuhan Tim:
                                  </span>
                                  <p className="text-white line-clamp-3">
                                    {team.role_needed}
                                  </p>
                                </div>
                              )}

                              {/* Bagian Anggota Kelompok (Inisiator + Anggota Diterima) */}
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-mono uppercase text-white/70 tracking-wider flex items-center gap-1.5">
                                  <Users className="w-3 h-3 text-amber-300" />
                                  <span>Anggota Kelompok ({acceptedMembers.length + 1}):</span>
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {/* Badge Inisiator / Ketua Tim */}
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-semibold shadow-sm">
                                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                                    <span>{team.creator_name}</span>
                                    <span className="text-[10px] font-mono text-amber-300/80 font-normal">(Ketua Tim)</span>
                                  </span>

                                  {/* Daftar Anggota yang Accepted */}
                                  {acceptedMembers.map((member) => (
                                    <span
                                      key={member.id || member.applicant_id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium shadow-sm backdrop-blur-sm"
                                    >
                                      <UserCheck className="w-3 h-3 text-emerald-400" />
                                      <span>{member.applicant_name}</span>
                                      {member.role_applied && (
                                        <span className="text-[10px] font-mono text-white/60">({member.role_applied})</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Sub-panel Permintaan Bergabung Masuk (Khusus Tim Milik Pengguna Saat Ini) */}
                              {isCreator && (
                                <div className="space-y-2 pt-2.5 border-t border-white/10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono uppercase text-amber-300 tracking-wider flex items-center gap-1.5 font-semibold">
                                      <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Permintaan Bergabung Masuk ({pendingInvites.length})</span>
                                    </span>
                                    {pendingInvites.length === 0 && (
                                      <span className="text-[10px] font-mono text-white/50">Belum ada antrean</span>
                                    )}
                                  </div>

                                  {pendingInvites.length > 0 && (
                                    <div className="space-y-2">
                                      {pendingInvites.map((invite) => (
                                        <div
                                          key={invite.id}
                                          className="p-3 rounded-xl bg-white/[0.07] border border-amber-300/30 space-y-2 text-xs backdrop-blur-sm"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <p className="font-semibold text-white">{invite.applicant_name}</p>
                                              {invite.role_applied && (
                                                <p className="text-[10px] font-mono text-amber-300/90">{invite.role_applied}</p>
                                              )}
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-medium border border-amber-300/30">
                                              Menunggu
                                            </span>
                                          </div>

                                          {invite.message && (
                                            <p className="text-[11px] text-white/80 italic leading-relaxed bg-black/20 p-2 rounded-lg border border-white/10">
                                              &ldquo;{invite.message}&rdquo;
                                            </p>
                                          )}

                                          <div className="flex items-center gap-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => handleAcceptInvite(invite.id!)}
                                              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                              <span>Terima</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRejectInvite(invite.id!)}
                                              className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-rose-500/30 border border-white/20 hover:border-rose-400/40 text-white/90 hover:text-rose-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                              <span>Tolak</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/10 space-y-2">
                              {status?.error && (
                                <p className="text-[11px] text-rose-300 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{status.error}</span>
                                </p>
                              )}

                              {isCreator ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-white/80 font-mono py-1">
                                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Anda adalah inisiator tim ini</span>
                                </div>
                              ) : isRequested ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold py-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Permintaan Terkirim</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendInvite(team.id)}
                                  disabled={status?.loading || isUserLocked}
                                  className="w-full py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-50 shadow-sm"
                                >
                                  {status?.loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5 text-white" />
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
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL / POP-UP KONFIRMASI AKSI KOLABORASI TIM (ROYAL GLASS) */}
      {/* ========================================================= */}
      {showTeamActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001d4a]/45 backdrop-blur-sm animate-fade-in">
          <div className="relative w-[92vw] max-w-md p-5 sm:p-6 rounded-2xl bg-[#004aad]/95 backdrop-blur-md border border-white/25 text-white shadow-[0_20px_50px_rgba(0,15,45,0.5)] space-y-5 animate-scale-up">
            {/* Header Modal & Tombol Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-mono font-semibold">
                  <Users className="w-3 h-3" />
                  <span>Kolaborasi Tim</span>
                </div>
                <h3 className="text-base font-semibold tracking-tight text-white">
                  Pilih Tindakan Kolaborasi
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Tentukan apakah Anda ingin menginisiasi tim baru atau mencari tim yang siap menerima rekan kolaborator.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTeamActionModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dua Pilihan Aksi: Lihat Daftar Tim vs Buat Tim Baru */}
            <div className="grid grid-cols-1 gap-3">
              {/* Pilihan 1: Lihat Daftar Tim */}
              <button
                type="button"
                onClick={handleSelectJoinTeam}
                className="p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-300/40 text-left transition-all duration-300 ease-out group cursor-pointer space-y-1.5 backdrop-blur-md shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    <Users className="w-4 h-4 text-amber-300" />
                    <span>Lihat Daftar Tim</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Jelajahi tim yang sudah terdaftar dan ajukan diri untuk berkolaborasi bersama rekan sejawat.
                </p>
              </button>

              {/* Pilihan 2: Buat Tim Baru */}
              <button
                type="button"
                onClick={handleSelectCreateTeam}
                disabled={isUserLocked}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ease-out space-y-1.5 backdrop-blur-md shadow-sm ${
                  isUserLocked
                    ? "bg-white/[0.04] border-white/10 opacity-60 cursor-not-allowed"
                    : "bg-white/10 hover:bg-white/20 border-white/20 hover:border-amber-300/40 group cursor-pointer active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                      isUserLocked ? "text-white/60" : "text-white group-hover:text-amber-300"
                    }`}
                  >
                    <PlusCircle className={`w-4 h-4 ${isUserLocked ? "text-white/40" : "text-amber-300"}`} />
                    <span>Buat Tim Baru</span>
                  </div>
                  {isUserLocked ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300/80 border border-amber-300/20">
                      Terkunci
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-amber-300 transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isUserLocked ? "text-amber-300/90 font-medium" : "text-white/80"
                  }`}
                >
                  {isUserLocked
                    ? "Anda sudah terhubung/mengajukan kolaborasi pada peluang ini."
                    : "Inisiasi kelompok kerja baru dan publikasikan kriteria rekan tim yang Anda cari."}
                </p>
              </button>
            </div>

            {/* Footer Modal */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTeamActionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Clean Footer */}
      <footer className="text-center py-6 text-[11px] text-white/60 font-mono border-t border-white/20 mt-10">
        ANGKASA &bull; EXPLOR[AI]TION HACKATHON
      </footer>
    </div>
  );
}
