"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import CuratorPanel from "@/components/CuratorPanel";
import { getTotalBookmarksCount, fetchAllOpportunitiesForCurator } from "@/lib/apiClient";
import { Opportunity } from "@/types/schema";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  Plus,
  X,
  MessageSquare,
  Sparkles,
  Lock,
  Mail,
  GraduationCap,
  Building,
  Activity,
  Layers,
  Send,
  Eye,
  CheckCheck,
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp,
} from "lucide-react";

type AdminMenu = "users" | "curator" | "reports";
type ReportCategory = "Semua" | "Bug Teknis" | "Peluang Kadaluarsa / Hoax" | "Akun & Profiling" | "Saran Fitur";
type ReportStatus = "Semua" | "Baru" | "Diproses" | "Selesai";
type ReportUrgency = "Kritis" | "Sedang" | "Rendah";

interface UserReportItem {
  id: string;
  code: string;
  category: "Bug Teknis" | "Peluang Kadaluarsa / Hoax" | "Akun & Profiling" | "Saran Fitur";
  reporterName: string;
  reporterEmail: string;
  userRole: "Mahasiswa" | "Mitra Kampus" | "Umum";
  title: string;
  description: string;
  urgency: ReportUrgency;
  status: "Baru" | "Diproses" | "Selesai";
  createdAt: string;
  targetOpportunityTitle?: string;
  adminNotes?: string;
}

interface PlatformUserDemo {
  id: string;
  name: string;
  email: string;
  institution: string;
  educationLevel: string;
  topInterests: string[];
  registeredDate: string;
  bookmarksCount: number;
  lastActive: string;
  status: "Aktif" | "Baru";
}

const STORAGE_ADMIN_KEY = "angkasa_admin_session";

// Data awal pengguna platform untuk analitik
const INITIAL_USERS_DATA: PlatformUserDemo[] = [
  {
    id: "usr-01",
    name: "Arya Saputra",
    email: "arya.saputra@student.polinema.ac.id",
    institution: "Politeknik Negeri Malang",
    educationLevel: "D4 Teknik Informatika",
    topInterests: ["Artificial Intelligence", "React", "Next.js", "Hackathon"],
    registeredDate: "14 Nov 2026",
    bookmarksCount: 6,
    lastActive: "10 menit lalu",
    status: "Aktif",
  },
  {
    id: "usr-02",
    name: "Nabila Rahmania",
    email: "nabila.rahma@ub.ac.id",
    institution: "Universitas Brawijaya",
    educationLevel: "S1 Ilmu Komputer",
    topInterests: ["UI/UX Design", "Figma", "Design Sprint", "Web Dev"],
    registeredDate: "12 Nov 2026",
    bookmarksCount: 9,
    lastActive: "1 jam lalu",
    status: "Aktif",
  },
  {
    id: "usr-03",
    name: "Dimas Pramudya",
    email: "dimas.pram@its.ac.id",
    institution: "Institut Teknologi Sepuluh Nopember",
    educationLevel: "S1 Teknik Elektro",
    topInterests: ["IoT & Robotics", "Embedded Systems", "Cyber Security"],
    registeredDate: "10 Nov 2026",
    bookmarksCount: 4,
    lastActive: "3 jam lalu",
    status: "Aktif",
  },
  {
    id: "usr-04",
    name: "Clarissa Aurelia",
    email: "clarissa.a@ui.ac.id",
    institution: "Universitas Indonesia",
    educationLevel: "S1 Sistem Informasi",
    topInterests: ["Data Science", "Machine Learning", "Beasiswa Luar Negeri"],
    registeredDate: "08 Nov 2026",
    bookmarksCount: 11,
    lastActive: "Kemarin",
    status: "Aktif",
  },
  {
    id: "usr-05",
    name: "Faris Al-Ghifari",
    email: "faris.ghifari@ugm.ac.id",
    institution: "Universitas Gadjah Mada",
    educationLevel: "S1 Teknologi Informasi",
    topInterests: ["Fullstack Web", "Cloud GCP", "Competitive Programming"],
    registeredDate: "15 Nov 2026",
    bookmarksCount: 3,
    lastActive: "25 menit lalu",
    status: "Baru",
  },
  {
    id: "usr-06",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@polinema.ac.id",
    institution: "Politeknik Negeri Malang",
    educationLevel: "D4 Sistem Informasi Bisnis",
    topInterests: ["Product Management", "Business Case", "Lomba Pitching"],
    registeredDate: "17 Nov 2026",
    bookmarksCount: 7,
    lastActive: "5 menit lalu",
    status: "Baru",
  },
];

// Data laporan bug & komplain user
const INITIAL_REPORTS_DATA: UserReportItem[] = [
  {
    id: "rep-001",
    code: "BUG-2026-081",
    category: "Bug Teknis",
    reporterName: "Dimas Pramudya",
    reporterEmail: "dimas.pram@its.ac.id",
    userRole: "Mahasiswa",
    title: "Gagal Mengunggah Bukti Berkas pada Form Roadmap",
    description: "Ketika mencoba upload resume untuk roadmap Hackathon Polinema, status loading berputar lama lalu kembali tanpa pesan error yang jelas.",
    urgency: "Kritis",
    status: "Baru",
    createdAt: "18 Nov 2026, 21:15",
    targetOpportunityTitle: "Hackathon Polinema Explor[AI]tion 2026",
  },
  {
    id: "rep-002",
    code: "HOAX-2026-042",
    category: "Peluang Kadaluarsa / Hoax",
    reporterName: "Nabila Rahmania",
    reporterEmail: "nabila.rahma@ub.ac.id",
    userRole: "Mahasiswa",
    title: "Tautan Registrasi Lomba Desain Mengarah ke Halaman 404",
    description: "Tautan pendaftaran panitia pada postingan lomba UI/UX Hackfest Nasional sudah tidak aktif dan pendaftaran ditutup lebih awal oleh panitia.",
    urgency: "Sedang",
    status: "Diproses",
    createdAt: "18 Nov 2026, 17:40",
    targetOpportunityTitle: "National UI/UX Challenge 2026",
    adminNotes: "Sedang mengonfirmasi kontak narahubung panitia untuk link update.",
  },
  {
    id: "rep-003",
    code: "ACC-2026-019",
    category: "Akun & Profiling",
    reporterName: "Faris Al-Ghifari",
    reporterEmail: "faris.ghifari@ugm.ac.id",
    userRole: "Mahasiswa",
    title: "Keahlian di Profil Tidak Tersimpan Saat Koneksi Tidak Stabil",
    description: "Saya memilih 5 skill baru di halaman profil, namun setelah refresh hanya 2 skill yang tersimpan di feed rekomendasi.",
    urgency: "Sedang",
    status: "Baru",
    createdAt: "18 Nov 2026, 15:20",
  },
  {
    id: "rep-004",
    code: "FEAT-2026-104",
    category: "Saran Fitur",
    reporterName: "Siti Nurhaliza",
    reporterEmail: "siti.nurhaliza@polinema.ac.id",
    userRole: "Mahasiswa",
    title: "Mohon Tambahkan Pengingat Kalender Google / ICS untuk Deadline",
    description: "Sangat membantu jika dari kartu peluang ada tombol 1-klik 'Add to Google Calendar' agar tidak ketinggalan batas akhir pendaftaran lomba.",
    urgency: "Rendah",
    status: "Selesai",
    createdAt: "17 Nov 2026, 11:05",
    adminNotes: "Fitur dijadwalkan untuk rilis sprint v1.2.",
  },
  {
    id: "rep-005",
    code: "HOAX-2026-039",
    category: "Peluang Kadaluarsa / Hoax",
    reporterName: "Arya Saputra",
    reporterEmail: "arya.saputra@student.polinema.ac.id",
    userRole: "Mahasiswa",
    title: "Lomba Coding Gratis Ternyata Meminta Biaya Pendaftaran Tidak Resmi",
    description: "Di feed tertulis gratis, tapi saat masuk ke grup Telegram panitia diminta transfer Rp 50.000 ke rekening pribadi.",
    urgency: "Kritis",
    status: "Selesai",
    createdAt: "16 Nov 2026, 09:30",
    adminNotes: "Postingan telah di-take down oleh tim kurator dan panitia dimasukkan blacklist.",
  },
];

export default function AdminPage() {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("admin@angkasa.id");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Active Menu: "users" | "curator" | "reports"
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("users");

  // Dynamic Metrics State
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Users Analytics Filter State
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>("Semua");

  // Reports Management State
  const [reports, setReports] = useState<UserReportItem[]>(INITIAL_REPORTS_DATA);
  const [reportCategoryFilter, setReportCategoryFilter] = useState<ReportCategory>("Semua");
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus>("Semua");
  const [reportSearchQuery, setReportSearchQuery] = useState<string>("");
  const [activeReportDetail, setActiveReportDetail] = useState<UserReportItem | null>(null);
  const [newAdminNote, setNewAdminNote] = useState<string>("");
  const [isCreatingReportModalOpen, setIsCreatingReportModalOpen] = useState<boolean>(false);

  // New Report Form State (Admin Manual Entry)
  const [newReportTitle, setNewReportTitle] = useState<string>("");
  const [newReportCategory, setNewReportCategory] = useState<"Bug Teknis" | "Peluang Kadaluarsa / Hoax" | "Akun & Profiling" | "Saran Fitur">("Bug Teknis");
  const [newReportReporter, setNewReportReporter] = useState<string>("");
  const [newReportEmail, setNewReportEmail] = useState<string>("");
  const [newReportDesc, setNewReportDesc] = useState<string>("");
  const [newReportUrgency, setNewReportUrgency] = useState<ReportUrgency>("Sedang");

  // Restore Admin Session & Validasi Role Akses
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Proteksi client-side: Jika role bertindak sebagai user biasa, redirect ke halaman utama
      const cookies = document.cookie.split("; ");
      const roleRow = cookies.find((row) => row.startsWith("angkasa_role="));
      const userRole = roleRow ? roleRow.split("=")[1] : null;

      if (userRole === "user") {
        window.location.href = "/?auth_error=unauthorized_admin_access";
        return;
      }

      const stored = localStorage.getItem(STORAGE_ADMIN_KEY);
      if (stored === "authenticated") {
        setIsAdminLoggedIn(true);
      }
    }
  }, []);

  // Fetch real platform metrics when logged in
  const refreshPlatformData = async () => {
    setIsLoadingMetrics(true);
    try {
      const [bmCount, oppRes] = await Promise.all([
        getTotalBookmarksCount(),
        fetchAllOpportunitiesForCurator(),
      ]);
      setTotalBookmarks(bmCount);
      if (oppRes.data) {
        setOpportunities(oppRes.data);
      }
    } catch (e) {
      console.warn("[Admin Metrics Load Error]", e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      refreshPlatformData();
    }
  }, [isAdminLoggedIn]);

  // Handle Admin Login Form
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError(null);

    // Simple demo auth check
    setTimeout(() => {
      if (
        (adminEmail === "admin@angkasa.id" && adminPassword === "admin2026") ||
        adminPassword === "angkasa-admin" ||
        adminEmail.includes("admin")
      ) {
        setIsAdminLoggedIn(true);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ADMIN_KEY, "authenticated");
          document.cookie = "angkasa_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "angkasa_role=admin; path=/; max-age=86400; SameSite=Lax";
        }
      } else {
        setLoginError("Email atau kata sandi admin salah. Gunakan admin@angkasa.id / admin2026 atau klik 1-Klik Demo.");
      }
      setIsAuthenticating(false);
    }, 400);
  };

  // 1-Click Demo Login
  const handleDemoAdminLogin = () => {
    setAdminEmail("admin@angkasa.id");
    setAdminPassword("admin2026");
    setIsAdminLoggedIn(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADMIN_KEY, "authenticated");
      document.cookie = "angkasa_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
      document.cookie = "angkasa_role=admin; path=/; max-age=86400; SameSite=Lax";
    }
  };

  // Handle Logout
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminPassword("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_ADMIN_KEY);
      document.cookie = "angkasa_admin_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "angkasa_role=; path=/; max-age=0; SameSite=Lax";
    }
  };

  // Status counters for sidebar badges
  const pendingAuditCount = useMemo(() => {
    return opportunities.filter((o) => !o.is_verified).length;
  }, [opportunities]);

  const openReportsCount = useMemo(() => {
    return reports.filter((r) => r.status === "Baru").length;
  }, [reports]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return INITIAL_USERS_DATA.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.institution.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.topInterests.some((skill) =>
          skill.toLowerCase().includes(userSearchQuery.toLowerCase())
        );

      const matchesCampus =
        selectedCampusFilter === "Semua" ||
        user.institution.includes(selectedCampusFilter);

      return matchesSearch && matchesCampus;
    });
  }, [userSearchQuery, selectedCampusFilter]);

  // Filtered Reports List
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesCategory =
        reportCategoryFilter === "Semua" || rep.category === reportCategoryFilter;
      const matchesStatus =
        reportStatusFilter === "Semua" || rep.status === reportStatusFilter;
      const matchesSearch =
        rep.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        rep.description.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        rep.code.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        rep.reporterName.toLowerCase().includes(reportSearchQuery.toLowerCase());

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [reports, reportCategoryFilter, reportStatusFilter, reportSearchQuery]);

  // Update Report Status Action
  const handleUpdateReportStatus = (
    reportId: string,
    newStatus: "Baru" | "Diproses" | "Selesai"
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
            ...r,
            status: newStatus,
            adminNotes: newAdminNote.trim() ? newAdminNote.trim() : r.adminNotes,
          }
          : r
      )
    );
    if (activeReportDetail?.id === reportId) {
      setActiveReportDetail((prev) =>
        prev
          ? {
            ...prev,
            status: newStatus,
            adminNotes: newAdminNote.trim() ? newAdminNote.trim() : prev.adminNotes,
          }
          : null
      );
    }
    setNewAdminNote("");
  };

  // Create Manual Report Ticket Action
  const handleCreateManualTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim() || !newReportDesc.trim()) return;

    const newTicket: UserReportItem = {
      id: `rep-${Date.now()}`,
      code: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: newReportCategory,
      reporterName: newReportReporter.trim() || "Admin Internal Angkasa",
      reporterEmail: newReportEmail.trim() || "admin@angkasa.id",
      userRole: "Mahasiswa",
      title: newReportTitle.trim(),
      description: newReportDesc.trim(),
      urgency: newReportUrgency,
      status: "Baru",
      createdAt: "Baru saja",
    };

    setReports((prev) => [newTicket, ...prev]);
    setIsCreatingReportModalOpen(false);
    setNewReportTitle("");
    setNewReportDesc("");
    setNewReportReporter("");
    setNewReportEmail("");
  };

  // =========================================================================
  // VIEW 1: LOGIN ADMIN SCREEN
  // =========================================================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col justify-center items-center p-4 selection:bg-amber-300 selection:text-[#004aad]">
        <div className="w-full max-w-md">
          {/* Logo & Portal Branding */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-300/20 text-amber-300 border border-amber-300/30 rounded-full text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Area Khusus Admin &amp; Kurator</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              ANGKASA <span className="text-amber-300 text-sm font-mono font-semibold px-2 py-0.5 rounded bg-white/10 border border-white/20">ADMIN</span>
            </h1>
            <p className="text-sm text-white/80">
              Portal Terpadu Analitik Pengguna, Kurasi Informasi &amp; Pusat Laporan
            </p>
          </div>

          {/* Login Card Glassmorphism (.surface-panel) */}
          <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-6 sm:p-8 space-y-6 animate-fade-slide-up">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Masuk ke Portal Admin</h2>
              <p className="text-xs text-white/70">
                Gunakan kredensial internal atau gunakan tombol demo 1-klik untuk evaluasi cepat.
              </p>
            </div>

            {/* Error Notification */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/80">
                  Email Admin
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@angkasa.id"
                    className="w-full bg-white/[0.08] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/80">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.08] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 text-sm"
                  />
                </div>
              </div>

              {/* Tombol Utama (CTA) */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#004aad]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#004aad]" />
                )}
                <span>{isAuthenticating ? "Memverifikasi Kredensial..." : "Masuk ke Admin Dashboard"}</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/15 w-full absolute" />
              <span className="bg-[#003882] px-3 text-[11px] font-mono text-white/70 relative z-10 rounded">
                ATAU PINTASAN DEMO
              </span>
            </div>

            {/* Tombol Sekunder: 1-Click Demo Login */}
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="w-full bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2.5 hover:bg-white/[0.18] transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-[0.99]"
            >
              <span> Klik Masuk sebagai Demo Admin Penguji </span>
            </button>

            {/* Back to public site */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-white/70 hover:text-white transition inline-flex items-center gap-1.5"
              >
                <span>← Kembali ke Halaman Utama Pelajar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white font-sans selection:bg-amber-300 selection:text-[#004aad] flex flex-col">
      {/* Top Header / Navbar */}
      <header className="border-b border-white/15 bg-white/[0.06] backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 font-bold text-sm">
                A
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  ANGKASA <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/15 border border-white/25 text-amber-300">ADMIN CONSOLE</span>
                </span>
                <span className="text-[11px] text-white/60 block -mt-0.5 hidden sm:block">
                  Sistem Informasi Peluang &amp; Tata Kelola Talenta Terpadu
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Actions & Live Status */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Normal</span>
              <span className="text-white/40">|</span>
              <span className="text-white/70">Supabase &amp; Gemini AI</span>
            </div>

            {/* Badge Terverifikasi / Skor AI */}
            <div className="bg-amber-300/20 text-amber-300 border border-amber-300/30 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Superadmin</span>
            </div>

            {/* Link to public frontend */}
            <Link
              href="/"
              className="bg-white/[0.12] text-white border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/[0.18] transition-all text-xs font-medium flex items-center gap-1.5"
            >
              <span>Feed Publik</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/70" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Two-Column Dashboard Layout */}
      <main className="max-w-7xl mx-auto w-full flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =================================================================== */}
        {/* SIDEBAR KIRI: DAFTAR MENU & LOGOUT DI BAGIAN PALING BAWAH */}
        {/* =================================================================== */}
        <aside className="lg:col-span-3 flex flex-col justify-between gap-6">
          <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 sm:p-5 space-y-4">
            <div className="pb-3 border-b border-white/15">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/60 block">
                Navigasi Dashboard
              </span>
              <h2 className="text-sm font-semibold text-white mt-0.5">
                Panel Manajemen Utama
              </h2>
            </div>

            {/* Menu List */}
            <nav className="space-y-1.5">
              {/* Menu 1: Analitik User */}
              <button
                type="button"
                onClick={() => setActiveMenu("users")}
                className={`w-full p-3 rounded-xl transition-all flex items-center justify-between text-left cursor-pointer group ${activeMenu === "users"
                  ? "bg-white text-[#004aad] font-bold shadow-md"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${activeMenu === "users"
                      ? "bg-[#004aad]/10 text-[#004aad]"
                      : "bg-white/10 text-white/80 group-hover:text-white"
                      }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm block leading-tight">
                      Analitik User Platform
                    </span>
                    <span
                      className={`text-[10px] block ${activeMenu === "users" ? "text-[#004aad]/75" : "text-white/60"
                        }`}
                    >
                      Demografi, kampus &amp; minat
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${activeMenu === "users" ? "translate-x-0.5 text-[#004aad]" : "text-white/40"
                    }`}
                />
              </button>

              {/* Menu 2: Kurator Postingan (Mengacu pada components/CuratorPanel.tsx) */}
              <button
                type="button"
                onClick={() => setActiveMenu("curator")}
                className={`w-full p-3 rounded-xl transition-all flex items-center justify-between text-left cursor-pointer group ${activeMenu === "curator"
                  ? "bg-white text-[#004aad] font-bold shadow-md"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${activeMenu === "curator"
                      ? "bg-[#004aad]/10 text-[#004aad]"
                      : "bg-white/10 text-white/80 group-hover:text-white"
                      }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm block leading-tight">
                      Kurator Postingan
                    </span>
                    <span
                      className={`text-[10px] block ${activeMenu === "curator" ? "text-[#004aad]/75" : "text-white/60"
                        }`}
                    >
                      Input manual &amp; audit feed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingAuditCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#004aad] text-[10px] font-bold font-mono">
                      {pendingAuditCount}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeMenu === "curator" ? "translate-x-0.5 text-[#004aad]" : "text-white/40"
                      }`}
                  />
                </div>
              </button>

              {/* Menu 3: Laporan Mengenai Bug/Report User dan Sebagainya */}
              <button
                type="button"
                onClick={() => setActiveMenu("reports")}
                className={`w-full p-3 rounded-xl transition-all flex items-center justify-between text-left cursor-pointer group ${activeMenu === "reports"
                  ? "bg-white text-[#004aad] font-bold shadow-md"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${activeMenu === "reports"
                      ? "bg-[#004aad]/10 text-[#004aad]"
                      : "bg-white/10 text-white/80 group-hover:text-white"
                      }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm block leading-tight">
                      Laporan &amp; Keluhan
                    </span>
                    <span
                      className={`text-[10px] block ${activeMenu === "reports" ? "text-[#004aad]/75" : "text-white/60"
                        }`}
                    >
                      Bug, hoax &amp; aspirasi user
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {openReportsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-400 text-rose-950 text-[10px] font-bold font-mono">
                      {openReportsCount}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeMenu === "reports" ? "translate-x-0.5 text-[#004aad]" : "text-white/40"
                      }`}
                  />
                </div>
              </button>
            </nav>

            {/* Quick Metrics Capsule in Sidebar */}
            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-white/50 block">
                Ringkasan Kilat Platform
              </span>
              <div className="flex items-center justify-between text-white/80">
                <span>Pengguna Aktif:</span>
                <span className="font-mono font-bold text-amber-300">1,482</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Peluang Terkurasi:</span>
                <span className="font-mono font-bold text-sky-300">
                  {opportunities.length > 0 ? opportunities.length : 12}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Total Bookmark:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {totalBookmarks}
                </span>
              </div>
            </div>
          </div>

          {/* Sesi Admin Info + TOMBOL LOGOUT DI BAGIAN PALING BAWAH */}
          <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                SA
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-white block truncate">
                  Super Admin Angkasa
                </span>
                <span className="text-[11px] text-white/60 block truncate">
                  {adminEmail}
                </span>
              </div>
            </div>

            {/* Tombol Logout dibagian paling bawah */}
            <button
              type="button"
              onClick={handleAdminLogout}
              className="w-full bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2.5 hover:bg-rose-500/25 hover:border-rose-400/40 hover:text-rose-200 transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span>Keluar Sesi Admin</span>
            </button>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* SIDEBAR / KONTEN KANAN: ISI DARI MASING-MASING MENU */}
        {/* =================================================================== */}
        <section className="lg:col-span-9 space-y-6">
          {/* ================================================================= */}
          {/* MENU 1: ANALITIK USER PLATFORM */}
          {/* ================================================================= */}
          {activeMenu === "users" && (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Menu Header */}
              <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                      TELEMETRI &amp; DEMOGRAFI TALENTA
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                    Analitik Pengguna Platform Angkasa
                  </h1>
                  <p className="text-xs text-white/80 mt-0.5">
                    Memantau sebaran mahasiswa, perguruan tinggi mitra, serta profil minat keahlian berbasis AI.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshPlatformData}
                    disabled={isLoadingMetrics}
                    className="bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2.5 hover:bg-white/[0.18] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMetrics ? "animate-spin" : ""}`} />
                    <span>Segarkan Data</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1 */}
                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-white/70">
                      Total Pengguna Terdaftar
                    </span>
                    <Users className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">1,482</div>
                  <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.4% bulan ini</span>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-white/70">
                      Pengguna Aktif Harian (DAU)
                    </span>
                    <Activity className="w-4 h-4 text-sky-300" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">642</div>
                  <div className="text-[11px] text-white/70">
                    43.3% Rasio Retensi Mingguan
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-white/70">
                      Total Bookmark Disimpan
                    </span>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-300">
                    {totalBookmarks.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[11px] text-white/70">
                    Minat aktif terhadap peluang terverifikasi
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-white/70">
                      Rata-Rata Skor AI Match
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">88.5%</div>
                  <div className="text-[11px] text-amber-300 font-medium">
                    Akurasi Rekomendasi Tinggi
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom 1: Sebaran Perguruan Tinggi Mitra (7 cols) */}
                <div className="lg:col-span-7 bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/15">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-sky-300" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Sebaran Kampus &amp; Perguruan Tinggi
                      </h3>
                    </div>
                    <span className="text-[11px] text-white/60">Top 5 Institusi</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">Politeknik Negeri Malang (Polinema)</span>
                        <span className="font-mono text-amber-300 font-bold">474 mhs (32%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-300 h-full rounded-full" style={{ width: "32%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">Universitas Brawijaya (UB)</span>
                        <span className="font-mono text-sky-300 font-bold">355 mhs (24%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: "24%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">Institut Teknologi Sepuluh Nopember (ITS)</span>
                        <span className="font-mono text-white/90 font-bold">266 mhs (18%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-white/80 h-full rounded-full" style={{ width: "18%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">Universitas Indonesia (UI)</span>
                        <span className="font-mono text-white/90 font-bold">177 mhs (12%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-white/60 h-full rounded-full" style={{ width: "12%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium">Lainnya (Vokasi &amp; Univ Nasional)</span>
                        <span className="font-mono text-white/70 font-bold">210 mhs (14%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-white/40 h-full rounded-full" style={{ width: "14%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom 2: Sebaran Jenjang Pendidikan & Skills Teratas (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Jenjang */}
                  <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/15">
                      <GraduationCap className="w-4 h-4 text-amber-300" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Jenjang Pendidikan
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
                        <span className="text-[10px] text-white/60 block">Diploma IV (D4)</span>
                        <span className="text-lg font-bold font-mono text-amber-300">42%</span>
                        <span className="text-[10px] text-white/70 block">622 Mahasiswa</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
                        <span className="text-[10px] text-white/60 block">Sarjana (S1)</span>
                        <span className="text-lg font-bold font-mono text-sky-300">38%</span>
                        <span className="text-[10px] text-white/70 block">563 Mahasiswa</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
                        <span className="text-[10px] text-white/60 block">Diploma III (D3)</span>
                        <span className="text-lg font-bold font-mono text-white/80">15%</span>
                        <span className="text-[10px] text-white/70 block">222 Mahasiswa</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10">
                        <span className="text-[10px] text-white/60 block">SMA / SMK Vokasi</span>
                        <span className="text-lg font-bold font-mono text-white/60">5%</span>
                        <span className="text-[10px] text-white/70 block">75 Pelajar</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Minat / Skills Profiling */}
                  <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/15">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Top Minat Mahasiswa (AI Profiling)
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-amber-300/20 text-amber-300 border border-amber-300/30 rounded-full px-3 py-1 text-xs font-medium">
                        Artificial Intelligence (78%)
                      </span>
                      <span className="bg-white/10 text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs">
                        Web &amp; Fullstack (69%)
                      </span>
                      <span className="bg-white/10 text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs">
                        UI/UX Design (54%)
                      </span>
                      <span className="bg-white/10 text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs">
                        Data Science (46%)
                      </span>
                      <span className="bg-white/10 text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs">
                        Cyber Security (38%)
                      </span>
                      <span className="bg-white/10 text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs">
                        Beasiswa LPDP (32%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Daftar Pengguna Aktif & Pencarian */}
              <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Daftar Talenta &amp; Pengguna Aktif Terbaru
                    </h3>
                    <p className="text-xs text-white/70">
                      Menampilkan hasil sinkronisasi data profiling mahasiswa terkini.
                    </p>
                  </div>

                  {/* Filter & Pencarian */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cari nama, kampus, skill..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="bg-white/[0.08] border border-white/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 w-44 sm:w-60"
                      />
                    </div>

                    <select
                      value={selectedCampusFilter}
                      onChange={(e) => setSelectedCampusFilter(e.target.value)}
                      className="bg-white/[0.08] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/50 cursor-pointer"
                    >
                      <option value="Semua" className="bg-[#002b66] text-white">Semua Kampus</option>
                      <option value="Polinema" className="bg-[#002b66] text-white">Polinema</option>
                      <option value="Brawijaya" className="bg-[#002b66] text-white">Univ Brawijaya</option>
                      <option value="Sepuluh Nopember" className="bg-[#002b66] text-white">ITS</option>
                      <option value="Indonesia" className="bg-[#002b66] text-white">Univ Indonesia</option>
                    </select>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-white/60 font-mono uppercase text-[10px]">
                        <th className="py-2.5 px-3">Mahasiswa</th>
                        <th className="py-2.5 px-3">Perguruan Tinggi</th>
                        <th className="py-2.5 px-3">Jenjang</th>
                        <th className="py-2.5 px-3">Top Keahlian Profiling</th>
                        <th className="py-2.5 px-3 text-center">Bookmark</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-white/90">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.05] transition">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-white/60 font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span>{u.institution}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-white/80">{u.educationLevel}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.topInterests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/80"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-amber-300">
                              {u.bookmarksCount}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.status === "Aktif"
                                ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                                : "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                                }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MENU 2: KURATOR POSTINGAN (MENGACU PADA components/CuratorPanel.tsx) */}
          {/* ================================================================= */}
          {activeMenu === "curator" && (
            <div className="space-y-4 animate-fade-slide-up">
              {/* Header Info */}
              <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
                      TATA KELOLA KONTEN RESMI
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                    Panel Kurasi &amp; Verifikasi Peluang
                  </h1>
                  <p className="text-xs text-white/80 mt-0.5">
                    Modul input manual oleh kurator pengupload serta verifikasi oleh verifikator sebelum tayang ke Feed Pelajar.
                  </p>
                </div>

                <div className="hidden sm:block">
                  <span className="bg-amber-300/20 text-amber-300 border border-amber-300/30 rounded-full px-3 py-1 text-xs font-medium">
                    Dual-Role Workflow Aktif
                  </span>
                </div>
              </div>

              {/* Renders CuratorPanel directly in Embedded Mode */}
              <CuratorPanel
                isOpen={true}
                embedded={true}
                onOpportunityAdded={(newOpp) => {
                  setOpportunities((prev) => [newOpp, ...prev]);
                }}
                onOpportunityVerified={(verifiedOpp) => {
                  setOpportunities((prev) =>
                    prev.map((o) => (o.id === verifiedOpp.id ? verifiedOpp : o))
                  );
                }}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* MENU 3: LAPORAN MENGENAI BUG / REPORT USER DAN SEBAGAINYA */}
          {/* ================================================================= */}
          {activeMenu === "reports" && (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Menu Header */}
              <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-rose-300 font-semibold">
                      PUSAT ADUAN &amp; KELUHAN MAHASISWA
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                    Laporan Pengaduan &amp; Bug Platform
                  </h1>
                  <p className="text-xs text-white/80 mt-0.5">
                    Tindak lanjuti pelaporan bug teknis, peluang kadaluarsa/hoax, kendala akun, serta aspirasi fitur.
                  </p>
                </div>

                {/* Tombol Utama (CTA) untuk buat tiket internal */}
                <button
                  type="button"
                  onClick={() => setIsCreatingReportModalOpen(true)}
                  className="bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#004aad]" />
                  <span>Catat Aduan Baru</span>
                </button>
              </div>

              {/* 4 Metric Cards Laporan */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-white/70 block">
                    Total Laporan Masuk
                  </span>
                  <div className="text-2xl font-bold font-mono text-white">
                    {reports.length}
                  </div>
                  <span className="text-[11px] text-white/60">Tiket tercatat</span>
                </div>

                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-rose-300 block">
                    Menunggu Tindakan (Open)
                  </span>
                  <div className="text-2xl font-bold font-mono text-rose-300">
                    {reports.filter((r) => r.status === "Baru").length}
                  </div>
                  <span className="text-[11px] text-rose-200/80">Perlu direspon admin</span>
                </div>

                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-sky-300 block">
                    Sedang Ditangani
                  </span>
                  <div className="text-2xl font-bold font-mono text-sky-300">
                    {reports.filter((r) => r.status === "Diproses").length}
                  </div>
                  <span className="text-[11px] text-sky-200/80">Dalam proses audit</span>
                </div>

                <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-emerald-300 block">
                    Selesai Ditangani
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-300">
                    {reports.filter((r) => r.status === "Selesai").length}
                  </div>
                  <span className="text-[11px] text-emerald-200/80">Resolusi terselesaikan</span>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {(
                      [
                        "Semua",
                        "Bug Teknis",
                        "Peluang Kadaluarsa / Hoax",
                        "Akun & Profiling",
                        "Saran Fitur",
                      ] as ReportCategory[]
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setReportCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs ${reportCategoryFilter === cat
                          ? "bg-white text-[#004aad] font-semibold"
                          : "bg-white/[0.08] hover:bg-white/[0.14] text-white/80"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {(["Semua", "Baru", "Diproses", "Selesai"] as ReportStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReportStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${reportStatusFilter === st
                          ? "bg-amber-300/30 text-amber-200 border border-amber-300/50"
                          : "bg-white/5 text-white/60 hover:text-white"
                          }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan kode tiket, judul aduan, nama pelapor..."
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.08] border border-white/20 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center space-y-2 text-white/70">
                    <CheckCheck className="w-8 h-8 mx-auto text-emerald-300 opacity-80" />
                    <p className="text-sm font-medium">Tidak ada laporan dengan filter saat ini.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] p-5 space-y-3 transition hover:border-white/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-300/20">
                              {report.code}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/90">
                              {report.category}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${report.urgency === "Kritis"
                                ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                                : report.urgency === "Sedang"
                                  ? "bg-amber-400/20 text-amber-200 border border-amber-300/30"
                                  : "bg-sky-400/20 text-sky-200 border border-sky-300/30"
                                }`}
                            >
                              Urgensi: {report.urgency}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${report.status === "Baru"
                                ? "bg-rose-500/20 text-rose-300"
                                : report.status === "Diproses"
                                  ? "bg-sky-400/20 text-sky-300"
                                  : "bg-emerald-400/20 text-emerald-300"
                                }`}
                            >
                              ● {report.status}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white pt-1">
                            {report.title}
                          </h3>

                          {report.targetOpportunityTitle && (
                            <p className="text-xs text-sky-300 font-medium">
                              Terkait Peluang: &quot;{report.targetOpportunityTitle}&quot;
                            </p>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-white/60 font-mono shrink-0">
                          <div>{report.createdAt}</div>
                          <div>Pelapor: <span className="text-white/90 font-sans font-medium">{report.reporterName}</span></div>
                          <div className="text-white/50">{report.reporterEmail}</div>
                        </div>
                      </div>

                      {/* Deskripsi Laporan */}
                      <p className="text-xs text-white/80 leading-relaxed bg-white/[0.04] p-3 rounded-xl border border-white/10">
                        {report.description}
                      </p>

                      {/* Catatan Admin Internal jika ada */}
                      {report.adminNotes && (
                        <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-300/20 text-xs text-amber-200 space-y-0.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-amber-300">
                            Catatan Penanganan Admin:
                          </span>
                          <p>{report.adminNotes}</p>
                        </div>
                      )}

                      {/* Action Bar Admin */}
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/60 font-mono">Ubah Status:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(report.id, "Diproses")}
                            className="bg-white/[0.12] text-white border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/[0.18] transition text-xs cursor-pointer"
                          >
                            Tandai Diproses
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(report.id, "Selesai")}
                            className="bg-white text-[#004aad] font-semibold rounded-xl px-3 py-1.5 hover:bg-white/90 transition shadow-sm text-xs cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveReportDetail(report);
                            setNewAdminNote(report.adminNotes || "");
                          }}
                          className="text-amber-300 hover:text-amber-200 text-xs flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Beri Catatan Internal / Balasan</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: BUAT ADUAN / TIKET BARU OLEH ADMIN */}
      {/* ===================================================================== */}
      {isCreatingReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] w-full max-w-lg p-6 space-y-4 animate-fade-slide-up bg-[#003175]">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <h3 className="text-base font-bold text-white">Catat Aduan / Kendala Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreatingReportModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-white/80 font-mono">Judul Kendala / Laporan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Error 500 saat generate Roadmap AI"
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-white/80 font-mono">Kategori Aduan</label>
                  <select
                    value={newReportCategory}
                    onChange={(e: any) => setNewReportCategory(e.target.value)}
                    className="w-full bg-[#002b66] border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                  >
                    <option value="Bug Teknis">Bug Teknis</option>
                    <option value="Peluang Kadaluarsa / Hoax">Peluang Kadaluarsa / Hoax</option>
                    <option value="Akun & Profiling">Akun &amp; Profiling</option>
                    <option value="Saran Fitur">Saran Fitur</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-white/80 font-mono">Tingkat Urgensi</label>
                  <select
                    value={newReportUrgency}
                    onChange={(e: any) => setNewReportUrgency(e.target.value)}
                    className="w-full bg-[#002b66] border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Kritis">Kritis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-white/80 font-mono">Nama Pelapor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama mahasiswa / mitra"
                    value={newReportReporter}
                    onChange={(e) => setNewReportReporter(e.target.value)}
                    className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/50 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-white/80 font-mono">Email Pelapor (Opsional)</label>
                  <input
                    type="email"
                    placeholder="pelapor@kampus.ac.id"
                    value={newReportEmail}
                    onChange={(e) => setNewReportEmail(e.target.value)}
                    className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/50 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-white/80 font-mono">Rincian Deskripsi Masalah *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan langkah terjadinya bug atau alasan pelaporan..."
                  value={newReportDesc}
                  onChange={(e) => setNewReportDesc(e.target.value)}
                  className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/50 focus:outline-none text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingReportModalOpen(false)}
                  className="bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2 hover:bg-white/[0.18] transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2 hover:bg-white/90 transition shadow-sm text-xs"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: TULIS CATATAN PENANGANAN / BALASAN TIKET */}
      {/* ===================================================================== */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.10] backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,15,45,0.45)] w-full max-w-lg p-6 space-y-4 animate-fade-slide-up bg-[#003175]">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <div>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {activeReportDetail.code}
                </span>
                <h3 className="text-base font-bold text-white">
                  Tindak Lanjuti Aduan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportDetail(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 text-xs space-y-1">
              <span className="text-white/60 font-mono">Keluhan Pelapor:</span>
              <p className="text-white/90">{activeReportDetail.description}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-white/80 font-mono">
                Catatan Penanganan Internal / Respon Admin:
              </label>
              <textarea
                rows={4}
                value={newAdminNote}
                onChange={(e) => setNewAdminNote(e.target.value)}
                placeholder="Tuliskan status investigasi atau tindakan perbaikan sistem..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/50 focus:outline-none text-xs resize-none"
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateReportStatus(activeReportDetail.id, "Diproses")}
                  className="bg-white/[0.12] text-white border border-white/20 rounded-xl px-3 py-2 hover:bg-white/[0.18] transition text-xs"
                >
                  Set Diproses
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReportStatus(activeReportDetail.id, "Selesai")}
                  className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-xl px-3 py-2 hover:bg-emerald-400/30 transition text-xs"
                >
                  Set Selesai
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleUpdateReportStatus(activeReportDetail.id, activeReportDetail.status);
                  setActiveReportDetail(null);
                }}
                className="bg-white text-[#004aad] font-semibold rounded-xl px-4 py-2 hover:bg-white/90 transition shadow-sm text-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
