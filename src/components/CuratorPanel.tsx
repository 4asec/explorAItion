"use client";

import React, { useState, useEffect } from "react";
import { Opportunity, OpportunityCategory, DEFAULT_POSTER_URL } from "@/types/schema";
import {
  fetchAllOpportunitiesForCurator,
  createManualOpportunity,
  verifyOpportunity,
  uploadOpportunityPoster,
  getTotalBookmarksCount,
} from "@/lib/apiClient";
import {
  ShieldCheck,
  Clock,
  Bookmark,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  AlertCircle,
  UploadCloud,
  ImageIcon,
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
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>(DEFAULT_POSTER_URL);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [category, setCategory] = useState<OpportunityCategory>("Lomba");
  const [deadline, setDeadline] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oppRes, bmCount] = await Promise.all([
        fetchAllOpportunitiesForCurator(),
        getTotalBookmarksCount(),
      ]);

      if (oppRes.data) {
        setOpportunities(oppRes.data);
      }
      setTotalBookmarks(bmCount);
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

  // Handler: Pemilihan File Gambar Poster
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      try {
        const objectUrl = URL.createObjectURL(file);
        setPosterPreview(objectUrl);
      } catch {
        setPosterPreview(DEFAULT_POSTER_URL);
      }
    }
  };

  // Handler: Input Peluang Manual oleh Kurator
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
      // 1. Upload poster ke bucket Supabase Storage 'posters' (atau fallback data URL / DEFAULT_POSTER_URL)
      let finalPosterUrl = DEFAULT_POSTER_URL;
      if (posterFile) {
        finalPosterUrl = await uploadOpportunityPoster(posterFile);
      }

      // 2. Simpan entri peluang baru dengan is_verified: false
      const payload: Partial<Opportunity> = {
        title: title.trim(),
        organizer: organizer.trim(),
        category,
        caption: deadline.trim() || "Segera",
        deadline: deadline.trim() || "Segera",
        registration_url: registrationUrl.trim() || "https://angkasa.id",
        image_url: finalPosterUrl,
        description_roadmap:
          description.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
        description:
          description.trim() || "Peluang terkurasi oleh tim kurator Angkasa.",
        requirements: [
          "Mahasiswa aktif perguruan tinggi (diploma/sarjana)",
          "Memenuhi kriteria teknis yang disyaratkan panitia penyelenggara",
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
          message: `Draf "${createdItem.title}" berhasil didaftarkan ke antrean verifikasi (is_verified: false).`,
        });

        // Trigger callback ke parent FeedDashboard
        onOpportunityAdded?.(createdItem);

        // Reset form
        setPosterFile(null);
        setPosterPreview(DEFAULT_POSTER_URL);
        setTitle("");
        setOrganizer("");
        setCategory("Lomba");
        setDeadline("");
        setRegistrationUrl("");
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

        // Perbarui state lokal di panel
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_verified: true } : o))
        );

        setNotification({
          type: "success",
          message: `Peluang "${verifiedItem.title}" telah diverifikasi dan resmi tayang di Feed publik Pelajar.`,
        });

        // Callback ke parent FeedDashboard agar feed langsung ter-refresh
        onOpportunityVerified?.(verifiedItem);
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi gangguan koneksi saat memverifikasi peluang.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
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
              Kelola input peluang manual, upload poster ke Supabase Storage, dan verifikasi publik.
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
            {/* Metric 1: Total Peluang Tayang */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Total Peluang Tayang
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

            {/* Metric 2: Antrean Menunggu Verifikasi */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Antrean Menunggu Verifikasi
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

            {/* Metric 3: Total Bookmark Tersimpan */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#888890] block">
                  Total Bookmark Tersimpan
                </span>
                <span className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                  {totalBookmarks.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] text-[#888890] block">
                  Minat aktif pelajar
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Bookmark className="w-5 h-5 text-sky-400" />
              </div>
            </div>
          </div>

          {/* 2-Column Layout: Form Input Manual (Kiri) & Antrean Verifikator (Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Kolom Kiri: Form Input Peluang Manual */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-b border-white/[0.07] pb-2 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider flex items-center gap-1.5 font-semibold">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Input Peluang Manual</span>
                </h3>
                <span className="text-[10px] font-mono text-[#888890] uppercase">
                  Status: is_verified: false
                </span>
              </div>

              <form onSubmit={handleSubmitNewOpportunity} className="space-y-3.5 text-xs">
                {/* Upload File Gambar Poster dengan Live Preview */}
                <div className="space-y-1.5">
                  <label className="block text-[#888890] font-mono">
                    Gambar Poster Peluang (Supabase Storage bucket &apos;posters&apos;)
                  </label>

                  {/* Area Preview Poster */}
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#050505] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] group">
                    <img
                      src={posterPreview}
                      alt="Preview Poster Peluang"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_POSTER_URL) {
                          e.currentTarget.src = DEFAULT_POSTER_URL;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                      <span className="text-[10px] font-mono text-[#888890] bg-[#0C0C0E]/90 px-2 py-0.5 rounded border border-white/[0.1]">
                        {posterFile ? `File: ${posterFile.name}` : "Poster Default Aktif"}
                      </span>
                    </div>
                  </div>

                  {/* Input File Button */}
                  <div className="pt-1">
                    <label
                      htmlFor="poster-file-input"
                      className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-[#FAFAFA] transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium">
                        {posterFile ? "Ganti File Poster" : "Pilih File Gambar Poster"}
                      </span>
                    </label>
                    <input
                      id="poster-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Judul & Penyelenggara */}
                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Judul Peluang <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hackathon Nasional IoT &amp; AI 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Nama Penyelenggara <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Politeknik Negeri Malang &amp; Google Cloud"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition"
                  />
                </div>

                {/* Kategori & Tenggat Waktu */}
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
                    <label className="block text-[#888890] font-mono">Tenggat Waktu / Caption</label>
                    <input
                      type="text"
                      placeholder="Contoh: 28 Februari 2027"
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

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="block text-[#888890] font-mono">
                    Deskripsi Singkat &amp; Syarat Kualifikasi
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ringkasan kompetisi, kriteria peserta, dan benefit yang didapatkan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/[0.07] focus:border-emerald-500 text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition resize-none"
                  />
                </div>

                {/* Tombol Simpan ke Antrean */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#FAFAFA] font-medium transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isSubmitting
                      ? "Mengunggah Poster &amp; Mendaftarkan..."
                      : "Daftarkan ke Antrean (is_verified: false)"}
                  </span>
                </button>
              </form>
            </div>

            {/* Kolom Kanan: Antrean Verifikator Kurator */}
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
                    Seluruh peluang yang didaftarkan telah diverifikasi dan resmi tayang di Feed publik Pelajar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
                  {pendingList.map((item) => {
                    const isProcessing = verifyingId === item.id;
                    const deadlineText = item.caption || item.deadline || "Segera";
                    const posterSrc = item.image_url || DEFAULT_POSTER_URL;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#050505] border border-white/[0.07] hover:border-white/[0.14] transition space-y-3 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
                      >
                        {/* Header Item: Badges & Deadline */}
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

                        {/* Poster Thumbnail + Info */}
                        <div className="flex gap-3 items-start">
                          <div className="w-24 aspect-[16/9] rounded-lg overflow-hidden bg-[#0C0C0E] border border-white/[0.08] shrink-0">
                            <img
                              src={posterSrc}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (e.currentTarget.src !== DEFAULT_POSTER_URL) {
                                  e.currentTarget.src = DEFAULT_POSTER_URL;
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-[#FAFAFA] tracking-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-[11px] font-mono text-[#888890] flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 text-[#888890] shrink-0" />
                              <span className="truncate">{item.organizer}</span>
                            </p>
                          </div>
                        </div>

                        {/* Deskripsi Singkat */}
                        <p className="text-xs text-[#888890] line-clamp-2 leading-relaxed">
                          {item.description_roadmap ||
                            item.description ||
                            "Tidak ada deskripsi rinci."}
                        </p>

                        {/* Actions: Link Resmi & Tombol Hijau Verifikasi & Tayangkan */}
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
                              {isProcessing ? "Memproses..." : "Verifikasi & Tayangkan"}
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
          <span>Sistem Verifikasi &amp; Kurasi Angkasa</span>
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
