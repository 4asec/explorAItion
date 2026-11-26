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
  Layers,
  FileCheck2,
  Lock,
} from "lucide-react";

export interface CuratorPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpportunityVerified?: (opportunity: Opportunity) => void;
  onOpportunityAdded?: (opportunity: Opportunity) => void;
  embedded?: boolean;
}

type CuratorRole = "submitter" | "verifier";

export default function CuratorPanel({
  isOpen = false,
  onClose = () => {},
  onOpportunityVerified,
  onOpportunityAdded,
  embedded = false,
}: CuratorPanelProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<CuratorRole>("submitter");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State Pengupload
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
    if (isOpen || embedded) {
      loadData();
      setNotification(null);
    }
  }, [isOpen, embedded]);

  // Handle ESC key to close modal (modal mode only)
  useEffect(() => {
    if (embedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, embedded]);

  if (!isOpen && !embedded) return null;

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

  // Handler: Input Peluang Manual oleh Kurator Pengupload
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

      // 2. Simpan entri peluang baru dengan is_verified: true dan status: 'verified'
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
        is_verified: true,
        status: "verified",
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
          message: `Peluang "${createdItem.title}" berhasil disimpan dan diverifikasi tayang langsung di Feed publik Pelajar.`,
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

  // Handler: Verifikasi Manual Peluang oleh Kurator Pemverifikasi (is_verified: false -> true)
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
          message: `Peluang "${verifiedItem.title}" telah diverifikasi oleh Verifikator dan resmi tayang di Feed publik Pelajar.`,
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

  const panelContent = (
    <div
      className={`w-full ${
        embedded
          ? "surface-panel bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)]"
          : "max-w-5xl bg-[#003175]/95 border border-white/25 rounded-2xl shadow-2xl my-auto max-h-[92vh]"
      } overflow-hidden flex flex-col text-white backdrop-blur-xl animate-fade-slide-up`}
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-white/15 flex items-center justify-between gap-4 bg-[#003175]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
              PANEL KURATOR &amp; VERIFIKATOR ANGKASA
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-white">
            Pusat Tata Kelola Peluang
          </h2>
          <p className="text-xs text-white/80">
            Pemisahan peran pengupload informasi dan verifikator sebelum resmi tayang ke Feed Pelajar.
          </p>
        </div>

        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Modal Body */}
      <div className={`p-6 ${embedded ? '' : 'overflow-y-auto max-h-[calc(92vh-130px)]'} space-y-6 flex-1`}>
          {/* Notification Alert Banner */}
          {notification && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-slide-up backdrop-blur-md ${
                notification.type === "success"
                  ? "bg-amber-400/20 border-amber-300/40 text-amber-200"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-xs opacity-70 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Metric 1: Total Peluang Tayang */}
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between gap-3 shadow-sm backdrop-blur-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
                  Total Peluang Tayang
                </span>
                <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                  {totalVerifiedCount}
                </span>
                <span className="text-[11px] text-white/80 block">
                  Terverifikasi di Feed
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
              </div>
            </div>

            {/* Metric 2: Antrean Menunggu Verifikasi */}
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between gap-3 shadow-sm backdrop-blur-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
                  Antrean Menunggu Verifikasi
                </span>
                <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                  {totalPendingCount}
                </span>
                <span className="text-[11px] text-white/80 block">
                  Perlu ditinjau verifikator
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
            </div>

            {/* Metric 3: Total Bookmark Tersimpan */}
            <div className="p-4 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-between gap-3 shadow-sm backdrop-blur-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
                  Total Bookmark Tersimpan
                </span>
                <span className="text-2xl font-bold font-mono text-sky-300 tabular-nums">
                  {totalBookmarks.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] text-white/80 block">
                  Minat aktif pelajar
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-300/20 flex items-center justify-center shrink-0">
                <Bookmark className="w-5 h-5 text-sky-300" />
              </div>
            </div>
          </div>

          {/* Segmented Tab Pemisahan Peran: Pengupload vs Pemverifikasi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white/10 border border-white/15 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveRole("submitter")}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-2 ${
                  activeRole === "submitter"
                    ? "bg-white text-[#004aad] font-bold shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>1. Kurator Pengupload (Submitter)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRole("verifier")}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-2 ${
                  activeRole === "verifier"
                    ? "bg-white text-[#004aad] font-bold shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2. Kurator Pemverifikasi (Verifier)</span>
                {totalPendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-[#004aad] text-[10px] font-bold font-mono tabular-nums">
                    {totalPendingCount}
                  </span>
                )}
              </button>
            </div>

            <span className="text-[11px] font-mono text-white/70 px-2 hidden sm:inline">
              {activeRole === "submitter"
                ? "Hak Akses: Input & Upload Sahaja"
                : "Hak Akses: Audit & Penayangan Feed"}
            </span>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: KURATOR PENGUPLOAD (SUBMITTER) */}
          {/* Hanya menampilkan form input peluang manual & daftar status draf terkirim */}
          {/* ========================================================================= */}
          {activeRole === "submitter" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1 animate-fade-slide-up">
              {/* Kolom Kiri: Form Input Peluang Manual */}
              <div className="lg:col-span-6 space-y-4">
                <div className="border-b border-white/15 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-white tracking-wider flex items-center gap-1.5 font-semibold">
                    <Plus className="w-3.5 h-3.5 text-sky-300" />
                    <span>Form Pendaftaran Peluang Baru</span>
                  </h3>
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-medium">
                    Status: Unverified
                  </span>
                </div>

                <form onSubmit={handleSubmitNewOpportunity} className="space-y-3.5 text-xs">
                  {/* Upload File Gambar Poster dengan Live Preview */}
                  <div className="space-y-1.5">
                    <label className="block text-white/80 font-mono">
                      Poster Peluang (Supabase Storage bucket &apos;posters&apos;)
                    </label>

                    {/* Area Preview Poster */}
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#002b66]/60 border border-white/20 shadow-sm group">
                      {posterPreview ? (
                        <img
                          src={posterPreview}
                          alt="Preview Poster Peluang"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() => setPosterPreview("")}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#003580] via-[#004aad] to-[#001f4d] p-4 text-center select-none">
                          <UploadCloud className="w-8 h-8 text-amber-300 mb-1" />
                          <span className="text-xs font-semibold text-white">Poster Geometris Otomatis</span>
                          <span className="text-[10px] text-white/60">Upload berkas gambar atau gunakan poster tipografi Angkasa</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                        <span className="text-[10px] font-mono text-white bg-[#002b66]/90 px-2 py-0.5 rounded border border-white/20">
                          {posterFile ? `File: ${posterFile.name}` : (posterPreview ? "Poster Kustom" : "Poster Tipografi Angkasa")}
                        </span>
                      </div>
                    </div>

                    {/* Input File Button */}
                    <div className="pt-1">
                      <label
                        htmlFor="poster-file-input"
                        className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] backdrop-blur-md"
                      >
                        <UploadCloud className="w-4 h-4 text-sky-300" />
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
                    <label className="block text-white/80 font-mono">
                      Judul Peluang <span className="text-amber-300">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Hackathon Nasional IoT &amp; AI 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-white/80 font-mono">
                      Nama Penyelenggara <span className="text-amber-300">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Politeknik Negeri Malang &amp; Google Cloud"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                    />
                  </div>

                  {/* Kategori & Tenggat Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-white/80 font-mono">Kategori Peluang</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                        className="w-full px-3 py-2 rounded-xl bg-[#003175] border border-white/20 focus:border-white/40 text-white focus:outline-none transition cursor-pointer"
                      >
                        <option value="Lomba">Lomba</option>
                        <option value="Beasiswa">Beasiswa</option>
                        <option value="Seminar">Seminar</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-white/80 font-mono">Tenggat Waktu / Caption</label>
                      <input
                        type="text"
                        placeholder="Contoh: 28 Februari 2027"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Tautan Pendaftaran Resmi */}
                  <div className="space-y-1">
                    <label className="block text-white/80 font-mono">Tautan Pendaftaran Resmi</label>
                    <input
                      type="url"
                      placeholder="https://penyelenggara.ac.id/pendaftaran"
                      value={registrationUrl}
                      onChange={(e) => setRegistrationUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1">
                    <label className="block text-white/80 font-mono">
                      Deskripsi Singkat &amp; Syarat Kualifikasi
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ringkasan kompetisi, kriteria peserta, dan benefit yang didapatkan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-white placeholder:text-white/50 focus:outline-none transition resize-none backdrop-blur-sm shadow-sm"
                    />
                  </div>

                  {/* Tombol Simpan ke Antrean Verifikator */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#004aad]" />
                    <span>
                      {isSubmitting
                        ? "Mengunggah Poster &amp; Mengajukan..."
                        : "Kirim ke Antrean Verifikator (is_verified: false)"}
                    </span>
                  </button>
                </form>
              </div>

              {/* Kolom Kanan: Status Peluang Terkirim Menunggu Audit */}
              <div className="lg:col-span-6 space-y-4">
                <div className="border-b border-white/15 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-white tracking-wider flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Status Draf Terkirim ({pendingList.length})</span>
                  </h3>
                  <span className="text-[10px] font-mono text-white/70 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Audit Terkunci (Hanya Verifikator)</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-amber-200 leading-relaxed backdrop-blur-sm">
                  Pengupload tidak memiliki hak akses verifikasi langsung. Seluruh draf peluang di bawah ini sedang dalam antrean peninjauan Kurator Pemverifikasi.
                </div>

                {pendingList.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.06] border border-white/10 text-center space-y-2.5 my-4 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-amber-300/80 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Tidak Ada Draf yang Tertunda
                    </p>
                    <p className="text-xs text-white/80 max-w-sm mx-auto leading-relaxed">
                      Seluruh peluang yang kamu ajukan telah diverifikasi dan resmi tayang di Feed publik.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {pendingList.map((item) => {
                      const deadlineText = item.caption || item.deadline || "Segera";
                      const posterSrc = item.image_url || DEFAULT_POSTER_URL;

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-white/[0.08] border border-white/15 space-y-2.5 shadow-sm backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30 font-medium">
                              Menunggu Audit Verifikator
                            </span>
                            <span className="text-[11px] font-mono text-white/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-white/70" />
                              <span className="tabular-nums">{deadlineText}</span>
                            </span>
                          </div>

                          <div className="flex gap-3 items-start">
                            <div className="w-20 aspect-[16/9] rounded-lg overflow-hidden bg-[#002b66]/60 border border-white/20 shrink-0">
                              {posterSrc ? (
                                <img
                                  src={posterSrc}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#003580] to-[#001f4d] flex items-center justify-center text-[10px] font-mono text-amber-300 font-bold">
                                  {item.category}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">
                                {item.title}
                              </h4>
                              <p className="text-[11px] font-mono text-white/70 truncate">
                                {item.organizer} &bull; {item.category}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: KURATOR PEMVERIFIKASI (VERIFIER) */}
          {/* Khusus antrean peluang is_verified: false dengan preview poster besar & tombol solid white */}
          {/* ========================================================================= */}
          {activeRole === "verifier" && (
            <div className="space-y-4 pt-1 animate-fade-slide-up">
              <div className="border-b border-white/15 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-mono uppercase text-white tracking-wider flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Meja Audit &amp; Verifikasi Kurator ({pendingList.length})</span>
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    Tinjau keabsahan berkas, validitas poster, dan klik tombol untuk menerbitkan peluang ke Feed Pelajar.
                  </p>
                </div>

                <span className="text-[10px] font-mono text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30 self-start sm:self-auto font-semibold">
                  Hak Akses: Verifikasi Penuh
                </span>
              </div>

              {pendingList.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white/[0.06] border border-white/10 text-center space-y-3 my-4 backdrop-blur-sm">
                  <CheckCircle2 className="w-10 h-10 text-amber-300/80 mx-auto" />
                  <p className="text-base font-semibold text-white">
                    Semua Peluang Telah Terverifikasi
                  </p>
                  <p className="text-xs text-white/80 max-w-md mx-auto leading-relaxed">
                    Tidak ada draf yang menunggu persetujuan. Seluruh peluang dari Kurator Pengupload telah ditayangkan di Feed publik.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[620px] overflow-y-auto pr-1">
                  {pendingList.map((item) => {
                    const isProcessing = verifyingId === item.id;
                    const deadlineText = item.caption || item.deadline || "Segera";
                    const posterSrc = item.image_url || DEFAULT_POSTER_URL;

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-white/[0.08] border border-white/15 hover:border-white/30 transition flex flex-col justify-between space-y-4 backdrop-blur-sm shadow-md"
                      >
                        {/* Poster Besar 16:9 */}
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#002b66]/60 border border-white/20">
                          {posterSrc ? (
                            <img
                              src={posterSrc}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#003580] via-[#004aad] to-[#001f4d]">
                              <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">{item.category}</span>
                              <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30">
                              Draf Menunggu Persetujuan
                            </span>
                          </div>
                        </div>

                        {/* Rincian Peluang */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-white/70">
                            <span className="truncate">{item.organizer}</span>
                            <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-white/10 border border-white/20 text-white/90">
                              {item.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-xs text-white/80 line-clamp-3 leading-relaxed">
                            {item.description_roadmap ||
                              item.description ||
                              "Tidak ada deskripsi rinci dari pengupload."}
                          </p>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/70">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-white/70" />
                              <span>{deadlineText}</span>
                            </span>

                            {item.registration_url && (
                              <a
                                href={item.registration_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-300 hover:text-amber-200 flex items-center gap-1 transition"
                              >
                                <span>Tautan Panitia</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Tombol Solid White: Verifikasi & Tayangkan */}
                        <div className="pt-3 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleVerifyOpportunity(item.id)}
                            disabled={isProcessing}
                            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-white/90 text-[#004aad] text-xs font-bold transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                            title="Setujui dan tayangkan peluang ke feed publik"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#004aad]" />
                            <span>
                              {isProcessing
                                ? "Menerbitkan ke Feed..."
                                : "Verifikasi &amp; Tayangkan ke Pelajar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (only show if not embedded) */}
        {!embedded && (
          <div className="px-6 py-3.5 border-t border-white/15 bg-[#003175]/90 flex items-center justify-between text-[11px] text-white/70 font-mono">
            <span>Tata Kelola Informasi Angkasa: Input Terpisah dari Verifikasi</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        )}
      </div>
  );

  if (embedded) {
    return panelContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {panelContent}
    </div>
  );
}
