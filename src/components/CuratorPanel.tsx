"use client";

import React, { useState, useEffect } from "react";
import { Opportunity, OpportunityCategory } from "@/types/schema";
import {
  fetchAllOpportunitiesForCurator,
  createManualOpportunity,
  verifyOpportunity,
} from "@/lib/apiClient";
import {
  ShieldCheck,
  Clock,
  Users,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  Layers,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

export interface CuratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpportunityVerified?: (opportunity: Opportunity) => void;
  onOpportunityAdded?: (opportunity: Opportunity) => void;
}

export default function CuratorPanel({
  isOpen,
  onClose,
  onOpportunityVerified,
  onOpportunityAdded,
}: CuratorPanelProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [category, setCategory] = useState<OpportunityCategory>("Lomba");
  const [deadline, setDeadline] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllOpportunitiesForCurator();
      if (res.data) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.warn("[CuratorPanel Load Error]", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setNotification(null);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Metrik Statistik
  const verifiedList = opportunities.filter((o) => o.is_verified);
  const pendingList = opportunities.filter((o) => !o.is_verified);
  const totalVerifiedCount = verifiedList.length;
  const totalPendingCount = pendingList.length;
  const totalStudentsEstimate = 1248;

  // Handler: Input Peluang Baru (is_verified: false)
  const handleSubmitNewOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizer.trim()) {
      setNotification({
        type: "error",
        message: "Judul dan nama penyelenggara wajib diisi.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload: Partial<Opportunity> = {
        title: title.trim(),
        organizer: organizer.trim(),
        category,
        caption: deadline.trim() || "Segera",
        deadline: deadline.trim() || "Segera",
        registration_url: registrationUrl.trim() || "https://angkasa.id",
        image_url: imageUrl.trim() || undefined,
        description_roadmap: description.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
        description: description.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
        requirements: [
          "Mahasiswa aktif perguruan tinggi (diploma/sarjana)",
          "Memenuhi kriteria teknis yang disyaratkan panitia",
        ],
        required_skills: [category, "Kolaborasi Tim", "Problem Solving"],
      };

      const res = await createManualOpportunity(payload);

      if (res.error || !res.data) {
        setNotification({
          type: "error",
          message: res.error || "Gagal menyimpan peluang baru ke antrean.",
        });
      } else {
        const createdItem = res.data;
        setOpportunities((prev) => [createdItem, ...prev]);
        setNotification({
          type: "success",
          message: `Draf "${createdItem.title}" berhasil didaftarkan ke antrean (is_verified: false).`,
        });

        // Trigger callback
        onOpportunityAdded?.(createdItem);

        // Reset form
        setTitle("");
        setOrganizer("");
        setCategory("Lomba");
        setDeadline("");
        setRegistrationUrl("");
        setImageUrl("");
        setDescription("");
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi kesalahan sistem saat menyimpan peluang.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Verifikasi Manual Peluang (is_verified: false -> true)
  const handleVerifyOpportunity = async (id: string) => {
    setVerifyingId(id);
    setNotification(null);

    try {
      const res = await verifyOpportunity(id);
      if (res.error) {
        setNotification({
          type: "error",
          message: res.error || "Gagal memverifikasi peluang.",
        });
      } else {
        const verifiedItem: Opportunity = res.data?.title
          ? res.data
          : {
              ...(opportunities.find((o) => o.id === id) as Opportunity),
              is_verified: true,
            };

        // Update local state list
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_verified: true } : o))
        );

        setNotification({
          type: "success",
          message: `Peluang "${verifiedItem.title}" telah diverifikasi dan resmi tayang di Feed publik.`,
        });

        // Callback ke parent FeedDashboard agar feed ter-refresh
        onOpportunityVerified?.(verifiedItem);
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi gangguan saat memverifikasi peluang.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
      <div className="w-full max-w-5xl bg-[#0C0C0E] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-fade-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between gap-4 bg-[#0C0C0E]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                PANEL KURATOR &amp; VERIFIKATOR
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#FAFAFA]">
              Pusat Kurasi &amp; Verifikasi Peluang
            </h2>
            <p className="text-xs text-[#888890]">
              Kelola input peluang manual dan verifikasi keabsahan sebelum resmi ditayangkan ke Feed Pelajar.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#888890] hover:text-[#FAFAFA] transition cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notification Alert Banner */}
          {notification && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-slide-up ${
                notification.type === "success"
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/20 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-xs opacity-60 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Metric 1: Peluang Tayang */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Peluang Tayang
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {totalVerifiedCount}
                </span>
                <span className="text-[11px] text-[#888890] block">
                  Terverifikasi di Feed
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Metric 2: Menunggu Verifikasi */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Menunggu Verifikasi
                </span>
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  {totalPendingCount}
                </span>
                <span className="text-[11px] text-[#888890] block">
                  Perlu ditinjau kurator
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Metric 3: Total Profil Pelajar */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Total Profil Pelajar
                </span>
                <span className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                  {totalStudentsEstimate.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] text-[#888890] block">
                  Pencari peluang aktif
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
            </div>
          </div>

          {/* 2-Column Section: Form Input Manual (Left) & Antrean Verifikator (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Kolom Kiri: Form Input Lomba / Beasiswa Manual */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-b border-white/[0.07] pb-2 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider flex items-center gap-1.5 font-semibold">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Input Lomba / Beasiswa Manual</span>
                </h3>
                <span className="text-[10px] font-mono text-[#888890] uppercase">
                  Status Awal: Unverified
                </span>
              </div>

              <form onSubmit={handleSubmitNewOpportunity} className="space-y-3.5 text-xs">
                {/* Judul & Penyelenggara */}
                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Judul Peluang <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lomba UI/UX Design Nasional 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Nama Penyelenggara / Instansi <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kementerian Kominfo &amp; Telkom Indonesia"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                {/* Kategori & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Kategori Peluang</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] focus:outline-none transition cursor-pointer"
                    >
                      <option value="Lomba">Lomba</option>
                      <option value="Beasiswa">Beasiswa</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#888890] font-mono">Tenggat Waktu / Deadline</label>
                    <input
                      type="text"
                      placeholder="Contoh: 15 Januari 2027"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Tautan Pendaftaran Resmi */}
                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">Tautan Pendaftaran Resmi</label>
                  <input
                    type="url"
                    placeholder="https://penyelenggara.ac.id/pendaftaran"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                {/* URL Gambar Poster (Opsional) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[#888890] font-mono">URL Poster / Flyer (Opsional)</label>
                    {imageUrl && (
                      <span className="text-[10px] text-emerald-400 font-mono">Poster terpasang</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://.../poster-lomba.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                  {imageUrl.trim() && (
                    <div className="mt-2 w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/[0.07] bg-[#050505] relative">
                      <img
                        src={imageUrl}
                        alt="Preview Poster"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Deskripsi & Ringkasan */}
                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Deskripsi Singkat &amp; Panduan Syarat
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan kriteria peserta, tema perlombaan, dan benefit utama bagi mahasiswa..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition resize-none"
                  />
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#FAFAFA] font-medium transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isSubmitting
                      ? "Menyimpan ke Antrean..."
                      : "Daftarkan ke Antrean (is_verified: false)"}
                  </span>
                </button>
              </form>
            </div>

            {/* Kolom Kanan: Antrean Verifikator (is_verified: false) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-b border-white/[0.07] pb-2 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Antrean Verifikator ({pendingList.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-amber-400">
                  Belum Tayang di Feed
                </span>
              </div>

              {pendingList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#050505] border border-white/[0.06] text-center space-y-2.5 my-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
                  <p className="text-sm font-medium text-[#FAFAFA]">
                    Antrean Verifikasi Kosong
                  </p>
                  <p className="text-xs text-[#888890] max-w-sm mx-auto leading-relaxed">
                    Seluruh peluang yang diajukan telah diverifikasi dan resmi tayang di Feed publik Pelajar. Gunakan formulir di sebelah kiri untuk menambahkan peluang baru.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {pendingList.map((item) => {
                    const isProcessing = verifyingId === item.id;
                    const deadlineText = item.caption || item.deadline || "Segera";

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] hover:border-white/[0.14] transition space-y-3 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
                      >
                        {/* Header Item: Badges & Category */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Menunggu Verifikasi
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#888890] border border-white/[0.06]">
                              {item.category}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-[#888890] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#888890]" />
                            <span className="tabular-nums">{deadlineText}</span>
                          </span>
                        </div>

                        {/* Title & Organizer */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-[#FAFAFA] tracking-tight group-hover:text-emerald-400 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs font-mono text-[#888890] flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-[#888890]" />
                            <span className="truncate">{item.organizer}</span>
                          </p>
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-[#888890] line-clamp-2 leading-relaxed">
                          {item.description_roadmap || item.description || "Tidak ada deskripsi rinci."}
                        </p>

                        {/* Actions: Link Resmi & Tombol Verifikasi & Tayangkan */}
                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-3">
                          {item.registration_url ? (
                            <a
                              href={item.registration_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-[#888890] hover:text-[#FAFAFA] flex items-center gap-1 transition"
                            >
                              <span>Tautan Resmi</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span />
                          )}

                          <button
                            type="button"
                            onClick={() => handleVerifyOpportunity(item.id)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                            title="Setujui dan tayangkan peluang ke feed publik"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                            <span>
                              {isProcessing ? "Memproses..." : "Setujui & Tayangkan"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.07] bg-[#0C0C0E]/90 flex items-center justify-between text-[11px] text-[#888890] font-mono">
          <span>Sistem Verifikasi Multi-Tahap Terintegrasi</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#FAFAFA] transition cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
