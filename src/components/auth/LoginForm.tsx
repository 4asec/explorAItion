"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginUser } from "@/lib/apiClient";
import { UserProfile } from "@/types/schema";

interface LoginFormProps {
  onSuccess: (user: any, profile: UserProfile) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Formulir Masuk Akun (LoginForm)
 * Menggunakan token warna resmi Royal Blue & Glassmorphism
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
    } catch {
      onError("Terjadi gangguan koneksi saat proses masuk akun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {/* Kolom Email */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-white/90">Email</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Contoh: johnfrans@gmail.com"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
          }}
          className={`w-full bg-white/[0.08] border ${
            fieldErrors.email ? "border-rose-400" : "border-white/20 focus:border-white/50"
          } rounded-xl px-4 py-2.5 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
          disabled={isLoading}
        />
        {fieldErrors.email && (
          <p className="text-[11px] text-rose-300 flex items-center gap-1 font-normal">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.email}</span>
          </p>
        )}
      </div>

      {/* Kolom Kata Sandi */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-white/90">Kata Sandi</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi Anda"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
            }}
            className={`w-full bg-white/[0.08] border ${
              fieldErrors.password ? "border-rose-400" : "border-white/20 focus:border-white/50"
            } rounded-xl pl-4 pr-10 py-2.5 text-white placeholder:text-white/50 text-sm focus:outline-none transition font-normal`}
            disabled={isLoading}
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
          <p className="text-[11px] text-rose-300 flex items-center gap-1 font-normal">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{fieldErrors.password}</span>
          </p>
        )}
      </div>

      {/* Tombol Masuk Akun (CTA Token Resmi) */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 bg-white text-[#004aad] font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
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
