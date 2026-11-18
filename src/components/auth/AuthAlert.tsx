"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success";
  message: string | null;
}

/**
 * Komponen Notifikasi Error & Sukses untuk Halaman Autentikasi
 */
export default function AuthAlert({ type, message }: AuthAlertProps) {
  if (!message) return null;

  if (type === "error") {
    return (
      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 font-medium">{message}</div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium">{message}</div>
    </div>
  );
}
