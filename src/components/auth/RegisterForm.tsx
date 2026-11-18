"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Building2,
  Calendar,
  GraduationCap,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { registerUser } from "@/lib/apiClient";
import { UserProfile, RegisterPayload } from "@/types/schema";

interface RegisterFormProps {
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
 * Komponen Form Registrasi (P1: 9 Field Wajib Identitas Akademik Mahasiswa)
 */
export default function RegisterForm({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: RegisterFormProps) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    institution: "",
    birth_date: "",
    education_level: EDUCATION_LEVEL_OPTIONS[3],
    province: "DKI Jakarta",
    city: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      errors.full_name = "Nama lengkap wajib diisi.";
    } else if (form.full_name.trim().length < 2) {
      errors.full_name = "Nama lengkap minimal 2 karakter.";
    }

    if (!form.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Format email tidak valid.";
    }

    if (!form.username.trim()) {
      errors.username = "Username wajib diisi.";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      errors.username = "Username 3-20 karakter alfanumerik (tanpa spasi).";
    }

    if (!form.password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (form.password.length < 6) {
      errors.password = "Kata sandi minimal 6 karakter.";
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    if (!form.institution.trim()) {
      errors.institution = "Asal institusi / universitas wajib diisi.";
    }

    if (!form.birth_date) {
      errors.birth_date = "Tanggal lahir wajib diisi.";
    }

    if (!form.education_level) {
      errors.education_level = "Jenjang pendidikan wajib dipilih.";
    }

    if (!form.province) {
      errors.province = "Asal provinsi wajib dipilih.";
    }

    if (!form.city.trim()) {
      errors.city = "Asal kota / kabupaten wajib diisi.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
        onError(
          response.error || "Gagal melakukan pendaftaran. Silakan coba kembali."
        );
        return;
      }

      onSuccess(response.data.user, response.data.profile);
    } catch (err) {
      onError("Terjadi gangguan jaringan saat memproses pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1" noValidate>
      {/* Row 1: Nama Lengkap & Username */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Nama Lengkap <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Ahmad Zaki"
              value={form.full_name}
              onChange={(e) => {
                setForm({ ...form, full_name: e.target.value });
                if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: "" });
              }}
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.full_name ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
          </div>
          {fieldErrors.full_name && (
            <p className="text-[11px] text-rose-400">{fieldErrors.full_name}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Username <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
              @
            </span>
            <input
              type="text"
              placeholder="ahmadzaki"
              value={form.username}
              onChange={(e) => {
                setForm({
                  ...form,
                  username: e.target.value.replace(/\s+/g, ""),
                });
                if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
              }}
              className={`w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.username ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
          </div>
          {fieldErrors.username && (
            <p className="text-[11px] text-rose-400">{fieldErrors.username}</p>
          )}
        </div>
      </div>

      {/* Row 2: Email */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-300">
          Alamat Email <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="email"
            placeholder="nama@kampus.ac.id"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
            }}
            className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border ${
              fieldErrors.email ? "border-rose-500" : "border-slate-800"
            } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-[11px] text-rose-400">{fieldErrors.email}</p>
        )}
      </div>

      {/* Row 3: Kata Sandi & Konfirmasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Kata Sandi <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 karakter"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
              }}
              className={`w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.password ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[11px] text-rose-400">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Ulangi Sandi <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ketik ulang"
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                if (fieldErrors.confirmPassword)
                  setFieldErrors({ ...fieldErrors, confirmPassword: "" });
              }}
              className={`w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.confirmPassword ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[11px] text-rose-400">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Row 4: Institusi & Tanggal Lahir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Institusi / Kampus <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="ITB, UI, Polinema"
              value={form.institution}
              onChange={(e) => {
                setForm({ ...form, institution: e.target.value });
                if (fieldErrors.institution)
                  setFieldErrors({ ...fieldErrors, institution: "" });
              }}
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.institution ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
          </div>
          {fieldErrors.institution && (
            <p className="text-[11px] text-rose-400">{fieldErrors.institution}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Tanggal Lahir <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => {
                setForm({ ...form, birth_date: e.target.value });
                if (fieldErrors.birth_date)
                  setFieldErrors({ ...fieldErrors, birth_date: "" });
              }}
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.birth_date ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
          </div>
          {fieldErrors.birth_date && (
            <p className="text-[11px] text-rose-400">{fieldErrors.birth_date}</p>
          )}
        </div>
      </div>

      {/* Row 5: Jenjang Pendidikan */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-300">
          Jenjang Pendidikan <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={form.education_level}
            onChange={(e) =>
              setForm({ ...form, education_level: e.target.value })
            }
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
          >
            {EDUCATION_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level} className="bg-slate-900 text-slate-100">
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 6: Asal Provinsi & Asal Kota */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Asal Provinsi <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={form.province}
              onChange={(e) =>
                setForm({ ...form, province: e.target.value })
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
            >
              {PROVINCE_OPTIONS.map((prov) => (
                <option key={prov} value={prov} className="bg-slate-900 text-slate-100">
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">
            Asal Kota / Kabupaten <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Surabaya / Bandung"
              value={form.city}
              onChange={(e) => {
                setForm({ ...form, city: e.target.value });
                if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
              }}
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border ${
                fieldErrors.city ? "border-rose-500" : "border-slate-800"
              } text-slate-100 text-xs focus:border-emerald-500 focus:outline-none`}
            />
          </div>
          {fieldErrors.city && (
            <p className="text-[11px] text-rose-400">{fieldErrors.city}</p>
          )}
        </div>
      </div>

      {/* Submit Register Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mendaftarkan Akun...</span>
          </>
        ) : (
          <>
            <span>Daftar Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
