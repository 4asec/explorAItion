"use client";

import React from "react";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";

interface DemoLoginButtonProps {
  onDemoLogin: () => void;
  isLoading: boolean;
}

/**
 * Tombol 1-Klik Akun Demo (Persyaratan Wajib P1 untuk Pengujian Juri Tanpa Registrasi Manual)
 */
export default function DemoLoginButton({
  onDemoLogin,
  isLoading,
}: DemoLoginButtonProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-400">Pengujian Instan Juri</p>
          <p className="text-[11px] text-slate-400">Masuk akun demo tanpa registrasi.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDemoLogin}
        disabled={isLoading}
        className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Memverifikasi...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Klik Akun Demo</span>
          </>
        )}
      </button>
    </div>
  );
}
