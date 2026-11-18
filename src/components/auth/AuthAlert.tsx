"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success";
  message: string | null;
}

/**
 * Komponen Notifikasi Error & Sukses untuk Halaman Autentikasi
 * Menggunakan gaya Glassmorphism selaras tema Royal Blue
 */
export default function AuthAlert({ type, message }: AuthAlertProps) {
  if (!message) return null;

  if (type === "error") {
    return (
      <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
        <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
        <div className="flex-1 font-normal leading-relaxed">{message}</div>
      </div>
    );
  }

  return (
    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn">
      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
      <div className="flex-1 font-normal leading-relaxed">{message}</div>
    </div>
  );
}
