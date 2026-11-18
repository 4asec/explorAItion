import React from "react";

/**
 * 4-Point Y2K Sparkle Star SVG
 */
export function FourPointStar({
  className = "w-5 h-5 text-amber-300",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
}

/**
 * Lapisan Ornamen Latar Belakang Y2K Tech-Cyber
 * Memadukan pola grid titik teknis, cincin orbit elips, dan kilau bintang 4-sudut.
 */
export default function BackgroundOrnaments() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Pola Grid Titik Teknis Halus */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

      {/* 2. Cincin Orbit Tipis Sudut Kiri Atas */}
      <div className="absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full border border-white/[0.07] flex items-center justify-center">
        <div className="w-[380px] h-[380px] rounded-full border border-dashed border-white/[0.05]" />
      </div>

      {/* 3. Cincin Orbit Tipis Sudut Kanan Bawah */}
      <div className="absolute -bottom-64 -right-64 w-[640px] h-[640px] rounded-full border border-white/[0.07] flex items-center justify-center">
        <div className="w-[460px] h-[460px] rounded-full border border-dashed border-white/[0.05]" />
      </div>

      {/* 4. Ornamen Vektor Geometris & Kilau Bintang Y2K 4-Sudut di Margin Kiri */}
      <div className="hidden lg:block absolute left-4 xl:left-8 top-32 space-y-24">
        {/* Sparkle Star 1 */}
        <div className="flex flex-col items-center gap-1.5 opacity-60">
          <FourPointStar className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="w-8 h-px bg-white/20" />
          <span className="text-[9px] font-mono text-white/40 tracking-widest">SYS.01</span>
        </div>

        {/* Crosshair & Star 2 */}
        <div className="flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] font-mono text-white/30 font-bold">+</span>
          <FourPointStar className="w-3.5 h-3.5 text-white/60" />
          <span className="w-6 h-px bg-white/15" />
        </div>

        {/* Sparkle Star 3 */}
        <div className="flex flex-col items-center gap-1.5 opacity-55">
          <FourPointStar className="w-4 h-4 text-amber-200/80" />
          <span className="text-[9px] font-mono text-white/30 tracking-widest">NAV.AI</span>
        </div>
      </div>

      {/* 5. Ornamen Vektor Geometris & Kilau Bintang Y2K 4-Sudut di Margin Kanan */}
      <div className="hidden lg:block absolute right-4 xl:right-8 top-44 space-y-28">
        {/* Sparkle Star 4 */}
        <div className="flex flex-col items-center gap-1.5 opacity-60">
          <FourPointStar className="w-4 h-4 text-white/70 animate-pulse" />
          <span className="w-8 h-px bg-white/20" />
          <span className="text-[9px] font-mono text-white/40 tracking-widest">ORB.26</span>
        </div>

        {/* Star 5 + Crosshair */}
        <div className="flex flex-col items-center gap-2 opacity-50">
          <FourPointStar className="w-5 h-5 text-amber-300/80" />
          <span className="text-[10px] font-mono text-white/30 font-bold">+</span>
          <span className="w-6 h-px bg-white/15" />
        </div>

        {/* Star 6 */}
        <div className="flex flex-col items-center gap-1.5 opacity-40">
          <FourPointStar className="w-3.5 h-3.5 text-white/50" />
          <span className="text-[9px] font-mono text-white/30 tracking-widest">EXP.4</span>
        </div>
      </div>
    </div>
  );
}
