"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { registerUser } from "@/lib/apiClient";
import { UserProfile, RegisterPayload } from "@/types/schema";

interface RegisterFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onSuccess: (user: any, profile: UserProfile) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PROVINCE_OPTIONS = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Barat Daya",
];

const EDUCATION_LEVEL_OPTIONS = [
  "SMA / SMK Sederajat",
  "D3 (Diploma Tiga)",
  "D4 (Sarjana Terapan)",
  "S1 (Sarjana)",
  "S2 (Magister)",
  "Alumni / Fresh Graduate",
];

/**
 * Formulir Pendaftaran Bertahap (RegisterForm)
 * - 100% mematuhi 9 kolom skema database tabel `profiles` di REQUIREMENTS.md
 * - Menggunakan token input & tombol persis sesuai desain halaman utama
 * - Format ringkas anti-scroll di layar laptop
 */
export default function RegisterForm({
  currentStep,
  setCurrentStep,
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: RegisterFormProps) {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    institution: "",
    birth_date: "",
    education_level: EDUCATION_LEVEL_OPTIONS[3],
    province: "DKI Jakarta",
    city: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validasi Step 1: Akun & Kredensial
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      errors.full_name = "Nama lengkap wajib diisi.";
    } else if (form.full_name.trim().length < 2) {
      errors.full_name = "Nama lengkap minimal 2 karakter.";
    }

    if (!form.username.trim()) {
      errors.username = "Username wajib diisi.";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      errors.username = "Username 3-20 karakter alfanumerik.";
    }

    if (!form.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Format email tidak valid.";
    }

    if (!form.password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (form.password.length < 6) {
      errors.password = "Kata sandi minimal 6 karakter.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validasi Step 2: Data Akademik
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.institution.trim()) {
      errors.institution = "Institusi / sekolah wajib diisi.";
    }

    if (!form.birth_date) {
      errors.birth_date = "Tanggal lahir wajib diisi.";
    }

    if (!form.education_level) {
      errors.education_level = "Jenjang pendidikan wajib dipilih.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validasi Step 3: Domisili
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.province) {
      errors.province = "Asal provinsi wajib dipilih.";
    }

    if (!form.city.trim()) {
      errors.city = "Asal kota / kabupaten wajib diisi.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim().toLowerCase(),
        institution: form.institution.trim(),
        birth_date: form.birth_date,
        education_level: form.education_level,
        province: form.province,
        city: form.city.trim(),
      };

      const response = await registerUser(payload);

      if (response.error || !response.data) {
        onError(response.error || "Gagal melakukan pendaftaran. Silakan coba kembali.");
        return;
      }

      onSuccess(response.data.user, response.data.profile);
    } catch {
      onError("Terjadi gangguan jaringan saat memproses pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* ============================================================== */}
      {/* STEP 1: DAFTAR AKUN (Nama Lengkap, Username, Email, Kata Sandi) */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-2.5 sm:space-y-3" noValidate>
          {/* Kolom Tunggal: Nama Lengkap (full_name) */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Nama Lengkap <span className="text-amber-300">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: John Francisco"
              value={form.full_name}
              onChange={(e) => {
                setForm({ ...form, full_name: e.target.value });
                if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.full_name ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.full_name && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Kolom Username */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Username <span className="text-amber-300">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: johnfrancisco"
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value.replace(/\s+/g, "") });
                if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.username ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.username && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.username}</p>
            )}
          </div>

          {/* Kolom Email */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Email <span className="text-amber-300">*</span>
            </label>
            <input
              type="email"
              placeholder="Contoh: johnfrans@gmail.com"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.email ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.email}</p>
            )}
          </div>

          {/* Kolom Kata Sandi */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Kata Sandi <span className="text-amber-300">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                }}
                className={`w-full bg-white/[0.08] border ${
                  fieldErrors.password ? "border-rose-400" : "border-white/20 focus:border-white/50"
                } rounded-xl pl-3.5 pr-10 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1 cursor-pointer"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-white/60 font-normal">Minimal 6 karakter.</p>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.password}</p>
            )}
          </div>

          {/* Tombol Lanjut ke Tahap 2 (CTA Token) */}
          <button
            type="submit"
            className="w-full mt-1.5 bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Lanjutkan ke Identitas Akademik</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ============================================================== */}
      {/* STEP 2: IDENTITAS AKADEMIK (Institusi, Tanggal Lahir, Jenjang) */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-3" noValidate>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Institusi / Perguruan Tinggi / Sekolah <span className="text-amber-300">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Institut Teknologi Bandung, Polinema"
              value={form.institution}
              onChange={(e) => {
                setForm({ ...form, institution: e.target.value });
                if (fieldErrors.institution) setFieldErrors({ ...fieldErrors, institution: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.institution ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.institution && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.institution}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Tanggal Lahir <span className="text-amber-300">*</span>
            </label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => {
                setForm({ ...form, birth_date: e.target.value });
                if (fieldErrors.birth_date) setFieldErrors({ ...fieldErrors, birth_date: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.birth_date ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.birth_date && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.birth_date}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Jenjang Pendidikan <span className="text-amber-300">*</span>
            </label>
            <select
              value={form.education_level}
              onChange={(e) => setForm({ ...form, education_level: e.target.value })}
              className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-white/50 transition appearance-none cursor-pointer font-normal"
            >
              {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-[#003d91] text-white font-normal">
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Navigasi Tahap 2 */}
          <div className="flex gap-2.5 pt-1.5">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2.5 hover:bg-white/[0.18] transition flex items-center justify-center gap-1.5 cursor-pointer text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <span>Lanjutkan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* STEP 3: DATA DOMISILI (Asal Provinsi & Asal Kota/Kabupaten)    */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-3" noValidate>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Asal Provinsi <span className="text-amber-300">*</span>
            </label>
            <select
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-white/50 transition appearance-none cursor-pointer font-normal"
            >
              {PROVINCE_OPTIONS.map((prov) => (
                <option key={prov} value={prov} className="bg-[#003d91] text-white font-normal">
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-white/90">
              Asal Kota / Kabupaten <span className="text-amber-300">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Surabaya, Bandung, Jakarta Selatan"
              value={form.city}
              onChange={(e) => {
                setForm({ ...form, city: e.target.value });
                if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
              }}
              className={`w-full bg-white/[0.08] border ${
                fieldErrors.city ? "border-rose-400" : "border-white/20 focus:border-white/50"
              } rounded-xl px-3.5 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            />
            {fieldErrors.city && (
              <p className="text-[11px] text-rose-300 font-normal">{fieldErrors.city}</p>
            )}
          </div>

          {/* Tombol Navigasi Tahap 3 (Final Submit) */}
          <div className="flex gap-2.5 pt-1.5">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isLoading}
              className="flex-1 bg-white/[0.12] text-white border border-white/20 rounded-xl px-4 py-2.5 hover:bg-white/[0.18] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun</span>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
