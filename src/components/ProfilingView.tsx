"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types/schema";
import { updateUserProfile } from "@/lib/apiClient";
import {
  Sparkles,
  Plus,
  X,
  Loader2,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export interface ProfilingViewProps {
  userProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
}

interface CategoryGroup {
  name: string;
  tags: string[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    name: "Teknologi & Kecerdasan Buatan",
    tags: [
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "Artificial Intelligence",
      "Prompt Engineering",
      "Machine Learning",
      "Cloud Architecture",
      "Mobile Dev",
    ],
  },
  {
    name: "Keamanan Siber & Sistem",
    tags: [
      "Cybersecurity",
      "Ethical Hacking",
      "Network Defense",
      "Penetration Testing",
      "Cryptography",
    ],
  },
  {
    name: "Produk, Bisnis & Startup",
    tags: [
      "Business Strategy",
      "Pitching & Storytelling",
      "Market Research",
      "Product Management",
      "Financial Modeling",
    ],
  },
  {
    name: "Desain Antarmuka & UX",
    tags: [
      "UI/UX Design",
      "Figma Prototyping",
      "Design Systems",
      "User Research",
      "Interaction Design",
    ],
  },
  {
    name: "Riset Ilmiah & Kepenulisan",
    tags: [
      "Karya Tulis Ilmiah (KTI)",
      "Metodologi Riset",
      "Academic Writing",
      "Data Analysis",
      "Literature Review",
    ],
  },
  {
    name: "Kepemimpinan & Beasiswa",
    tags: [
      "Public Speaking",
      "Community Leadership",
      "International Exchange",
      "Youth Advocacy",
      "English Debate",
    ],
  },
];

export default function ProfilingView({
  userProfile,
  onComplete,
  onCancel,
}: ProfilingViewProps) {
  const initialTags = Array.isArray(userProfile.profiling) ? userProfile.profiling : [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [customInput, setCustomInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setErrorMessage(null);
    if (selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedTags(selectedTags.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()));
    } else {
      setSelectedTags([...selectedTags, trimmed]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Keahlian "${trimmed}" sudah tercantum.`);
      return;
    }
    setSelectedTags([...selectedTags, trimmed]);
    setCustomInput("");
    setErrorMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const handleSave = async () => {
    if (selectedTags.length === 0) {
      setErrorMessage("Pilih minimal 1 keahlian atau minat untuk mempersonalisasi rekomendasi AI.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateUserProfile(userProfile.id, { profiling: selectedTags });

      if (res.error || !res.data) {
        setErrorMessage(res.error || "Gagal memperbarui profil. Silakan coba kembali.");
      } else {
        onComplete(res.data);
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi saat menyimpan profiling.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 lg:p-12 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <main className="w-full max-w-2xl mx-auto space-y-10 py-6 animate-fade-slide-up">
        {/* Top Minimal Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#888890]">
              ANGKASA &bull; PROFILING P2
            </span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-[#888890] hover:text-[#FAFAFA] transition active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
        </div>

        {/* Heading & Context */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#FAFAFA] leading-tight">
            Tentukan profil minat &amp; keahlian Anda
          </h1>
          <p className="text-sm text-[#888890] leading-relaxed max-w-xl">
            Pilih domain kompetensi teknis, karya ilmiah, atau kepemimpinan Anda. Algoritma cerdas Angkasa memfilter ribuan peluang menjadi rekomendasi presisi tinggi.
          </p>
        </div>

        {/* Selected Tags Summary Pillbox */}
        <section className="p-5 rounded-2xl bg-[#0C0C0E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#888890] tracking-wider uppercase">
              Terpilih (<span className="tabular-nums text-[#FAFAFA]">{selectedTags.length}</span>)
            </span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-[#888890] hover:text-rose-400 transition"
              >
                Hapus semua
              </button>
            )}
          </div>

          <div className="min-h-[44px] flex flex-wrap gap-2 items-center">
            {selectedTags.length === 0 ? (
              <p className="text-xs text-[#888890]/60 italic font-mono">
                Belum ada tag dipilih. Pilih dari opsi di bawah atau tambahkan sendiri.
              </p>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium tracking-tight"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:text-emerald-200 transition"
                    aria-label={`Hapus ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Custom Input */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ketik topik kustom lalu tekan Enter..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-4 pr-24 py-3 rounded-xl bg-[#0C0C0E] border border-white/[0.07] focus:border-white/20 text-sm text-[#FAFAFA] placeholder:text-[#888890]/50 focus:outline-none transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customInput.trim()}
              className="absolute right-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#FAFAFA] transition active:scale-[0.98] disabled:opacity-40"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Category Groups (Clean Editorial Stack) */}
        <div className="space-y-7 pt-2">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="space-y-2.5">
              <h2 className="text-xs font-medium text-[#888890] tracking-wide">
                {cat.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => {
                  const isSelected = selectedTags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]"
                          : "bg-[#0C0C0E] text-[#888890] hover:text-[#FAFAFA] border border-white/[0.07] hover:border-white/[0.16]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* High-Contrast Monochrome Primary Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || selectedTags.length === 0}
            className="w-full py-3.5 px-5 rounded-xl bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#050505] font-semibold text-sm tracking-tight transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#050505]" />
                <span>Menghubungkan ke AI Engine...</span>
              </>
            ) : (
              <>
                <span>Simpan &amp; Tampilkan Rekomendasi Peluang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-[11px] text-[#888890]/60 font-mono border-t border-white/[0.04]">
        ANGKASA &bull; CAREER &amp; TALENT INTELLIGENCE
      </footer>
    </div>
  );
}
