"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginUser } from "@/lib/apiClient";
import { UserProfile } from "@/types/schema";

interface LoginFormProps {
  onSuccess: (user: any, profile: UserProfile) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Komponen Form Login (P1: Email dan Password)
 */
export default function LoginForm({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
}: LoginFormProps) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await loginUser(form.email.trim(), form.password);

      if (response.error || !response.data) {
        onError(
          response.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda."
        );
        return;
      }

      onSuccess(response.data.user, response.data.profile);
    } catch (err) {
      onError("Terjadi gangguan koneksi saat proses masuk akun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Field Email */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Alamat Email <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nama@institusi.ac.id"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
            }}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border ${
              fieldErrors.email
                ? "border-rose-500 focus:border-rose-500"
                : "border-slate-800 focus:border-emerald-500"
            } text-slate-100 text-xs sm:text-sm focus:outline-none transition`}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.email}</span>
          </p>
        )}
      </div>

      {/* Field Password */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Kata Sandi <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
            }}
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border ${
              fieldErrors.password
                ? "border-rose-500 focus:border-rose-500"
                : "border-slate-800 focus:border-emerald-500"
            } text-slate-100 text-xs sm:text-sm focus:outline-none transition`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.password}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sedang Masuk...</span>
          </>
        ) : (
          <>
            <span>Masuk ke Akun</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
