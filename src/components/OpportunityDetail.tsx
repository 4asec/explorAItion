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
} from "@/lib/apiClient";
import {
  ArrowLeft,
  Calendar,
  Building2,
  ExternalLink,
  Sparkles,
  Users,
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
        // Tambahkan ke state lokal
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
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111113] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Kembali ke Feed</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Skor Kecocokan AI:</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              {opportunity.matchPercentage}% Relevan
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Opportunity Header Meta Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300">
                {opportunity.category}
              </span>
              {opportunity.is_verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Peluang Terverifikasi
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Batas Pendaftaran: <strong className="text-slate-200 font-semibold">{deadline}</strong></span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50 leading-tight">
              {opportunity.title}
            </h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Penyelenggara: <strong className="text-slate-300 font-medium">{opportunity.organizer}</strong></span>
            </p>
          </div>

          {/* AI Mentor Reason Callout */}
          <div className="p-4 rounded-2xl bg-[#09090B] border-l-2 border-emerald-500 space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              Analisis Personalisasi AI Mahasiswa
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              &ldquo;{opportunity.recommendationReason}&rdquo;
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deskripsi Peluang
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Requirements & Required Skills */}
          {((opportunity.requirements && opportunity.requirements.length > 0) ||
            (opportunity.required_skills && opportunity.required_skills.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {opportunity.requirements && opportunity.requirements.length > 0 && (
                <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Persyaratan Utama
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
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
                <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Keahlian yang Dicari
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
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
          <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-slate-500">
              Informasi langsung terhubung dengan kanal resmi penyelenggara.
            </span>
            <a
              href={opportunity.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <span>Buka Portal Pendaftaran Resmi</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="space-y-6">
          <div className="flex border-b border-white/[0.08] gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("roadmap")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === "roadmap"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Roadmap Persiapan AI (P5)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === "team"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cari Rekan Tim Kolaborasi (P6)</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: AI PREPARATION ROADMAP */}
          {/* ========================================================= */}
          {activeTab === "roadmap" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    Panduan Persiapan Bertahap Menuju Deadline
                  </h2>
                  <p className="text-xs text-slate-400">
                    Disusun khusus oleh AI sesuai profiling keahlian Anda dan kriteria penyelenggara.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRoadmap}
                  disabled={isRoadmapLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111113] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] text-xs font-semibold text-emerald-400 transition cursor-pointer disabled:opacity-50"
                >
                  {isRoadmapLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Perbarui Analisis AI</span>
                </button>
              </div>

              {isRoadmapLoading ? (
                <div className="p-12 rounded-3xl bg-[#111113] border border-white/[0.08] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    AI Gemini sedang merancang strategi persiapan, checklist berkas, dan linimasa...
                  </p>
                  <p className="text-[11px] text-slate-500">Menganalisis deadline dan standar penilaian juri.</p>
                </div>
              ) : roadmapError ? (
                <div className="p-6 rounded-2xl bg-[#111113] border border-rose-900/40 text-center space-y-2">
                  <p className="text-xs sm:text-sm text-rose-300">{roadmapError}</p>
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] text-xs font-semibold text-slate-200"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : roadmap ? (
                <div className="space-y-6">
                  {/* Sub-section 1: Timeline Bertahap */}
                  <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Linimasa &amp; Milestone Bertahap
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {roadmap.timeline.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#09090B] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                              {item.phase}
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                              {item.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-section 2: Checklist Dokumen & Berkas */}
                  <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Checklist Berkas &amp; Dokumen Wajib
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {roadmap.document_checklist.map((doc, idx) => {
                        const isDone = !!checkedDocs[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleCheckDoc(idx)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                              isDone
                                ? "bg-emerald-950/20 border-emerald-500/30 text-slate-400"
                                : "bg-[#09090B] border-white/[0.06] text-slate-200 hover:border-white/[0.15]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleCheckDoc(idx)}
                              className="mt-1 w-4 h-4 accent-emerald-500 cursor-pointer"
                            />
                            <div className="space-y-1 flex-1">
                              <p
                                className={`text-xs sm:text-sm font-semibold ${
                                  isDone ? "line-through text-slate-400" : "text-slate-100"
                                }`}
                              >
                                {doc.item}
                              </p>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                💡 Tip Taktis: {doc.tip}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-section 3: 3 Strategi Pemenangan */}
                  <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        3 Strategi Kunci Pemenangan / Kelolosan
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {roadmap.winning_strategy.map((strat, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#09090B] border border-white/[0.06] space-y-2"
                        >
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {strat}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-section 4: Recommended Tools & Curation Tips (jika ada) */}
                  {(roadmap.recommended_tools || roadmap.curation_tips) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roadmap.recommended_tools && roadmap.recommended_tools.length > 0 && (
                        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              Rekomendasi Perangkat / Tools
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.recommended_tools.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-xl bg-[#09090B] border border-white/[0.06] text-xs text-slate-300 font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {roadmap.curation_tips && roadmap.curation_tips.length > 0 && (
                        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              Tips Penilaian Dewan Juri
                            </h4>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-300">
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
            <div className="space-y-8">
              {/* Form Ringkas: Buat Lowongan Tim Baru */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Bentuk Tim Baru untuk Peluang Ini
                  </h3>
                  <p className="text-xs text-slate-400">
                    Publikasikan posisi anggota yang dibutuhkan berdasarkan framework Hacker, Hipster, atau Hustler.
                  </p>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-400">
                        Nama Tim:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Tim Garuda Tech"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.08] focus:border-emerald-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-400">
                        Role yang Dibutuhkan:
                      </label>
                      <div className="flex gap-2">
                        {(["Hacker", "Hipster", "Hustler"] as TeamRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              selectedRole === r
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-[#09090B] text-slate-400 border border-white/[0.08] hover:border-white/[0.18]"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400">
                      Rincian Kriteria Anggota (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Menguasai Next.js & Supabase, aktif berkomunikasi..."
                      value={roleDetail}
                      onChange={(e) => setRoleDetail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.08] focus:border-emerald-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
                    />
                  </div>

                  {createTeamMessage && (
                    <p
                      className={`text-xs p-3 rounded-xl border ${
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition disabled:opacity-40 cursor-pointer"
                  >
                    {isCreatingTeam ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Daftarkan Tim ke Bursa</span>
                  </button>
                </form>
              </div>

              {/* Daftar Tim Aktif */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tim Terdaftar ({teamRequests.length})
                  </h3>
                  <button
                    type="button"
                    onClick={loadTeamRequests}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition"
                  >
                    Muat Ulang
                  </button>
                </div>

                {isTeamLoading ? (
                  <div className="p-8 rounded-2xl bg-[#111113] border border-white/[0.08] text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Memeriksa lowongan tim...</p>
                  </div>
                ) : teamError ? (
                  <div className="p-6 rounded-2xl bg-[#111113] border border-rose-900/30 text-center text-xs text-rose-300">
                    {teamError}
                  </div>
                ) : teamRequests.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#111113] border border-white/[0.08] text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-300">
                      Belum Ada Tim Terdaftar
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Jadilah inisiator pertama dengan mendaftarkan tim Anda di atas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamRequests.map((team) => {
                      const isCreator = team.creator_id === userProfile.id;
                      const status = inviteStatus[team.id];

                      return (
                        <div
                          key={team.id}
                          className="p-5 rounded-2xl bg-[#111113] border border-white/[0.08] space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-100">
                                {team.team_name}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                                Butuh: {team.role_needed}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400">
                              Inisiator: <strong className="text-slate-300">{team.creator_name}</strong>
                              {isCreator && " (Anda)"}
                            </p>
                          </div>

                          {/* Invite Feedback / Button */}
                          <div className="pt-2 border-t border-white/[0.06] space-y-2">
                            {status?.error && (
                              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{status.error}</span>
                              </p>
                            )}

                            {isCreator ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <UserCheck className="w-3.5 h-3.5" />
                                Tim Milik Anda
                              </span>
                            ) : status?.success ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Permintaan Kolaborasi Terkirim
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendInvite(team.id)}
                                disabled={status?.loading}
                                className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-emerald-500 hover:text-slate-950 border border-white/[0.1] text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {status?.loading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Kirim Permintaan Bergabung</span>
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
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="text-center py-6 text-[11px] text-slate-500 border-t border-white/[0.04]">
        Aplikasi Angkasa &bull; Sistem Rekomendasi Peluang Terkurasi
      </footer>
    </div>
  );
}
