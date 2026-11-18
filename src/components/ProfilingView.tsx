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
    <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-12 font-sans selection:bg-amber-400/30 selection:text-amber-200">
      <main className="w-full max-w-2xl mx-auto space-y-10 py-6 animate-fade-slide-up">
        {/* Top Minimal Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-white/80">
              ANGKASA &bull; PROFILING MINAT &amp; BAKAT
            </span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
        </div>

        {/* Heading & Context */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white leading-tight">
            Tentukan profil minat &amp; keahlian Anda
          </h1>
          <p className="text-sm text-white/80 leading-relaxed max-w-xl">
            Pilih domain kompetensi teknis, karya ilmiah, atau kepemimpinan Anda. Algoritma cerdas Angkasa memfilter ribuan peluang menjadi rekomendasi presisi tinggi.
          </p>
        </div>

        {/* Selected Tags Summary Pillbox */}
        <section className="surface-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-white/80 tracking-wider uppercase">
              Terpilih (<span className="tabular-nums text-white font-semibold">{selectedTags.length}</span>)
            </span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-white/70 hover:text-rose-300 transition cursor-pointer"
              >
                Hapus semua
              </button>
            )}
          </div>

          <div className="min-h-[44px] flex flex-wrap gap-2 items-center">
            {selectedTags.length === 0 ? (
              <p className="text-xs text-white/60 italic font-mono">
                Belum ada tag dipilih. Pilih dari opsi di bawah atau tambahkan sendiri.
              </p>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-semibold tracking-tight shadow-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:text-amber-100 transition cursor-pointer"
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
              className="w-full pl-4 pr-24 py-3 rounded-xl bg-white/[0.08] border border-white/20 focus:border-white/40 text-sm text-white placeholder:text-white/50 focus:outline-none transition backdrop-blur-sm shadow-sm"
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customInput.trim()}
              className="absolute right-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 cursor-pointer border border-white/20"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Category Groups (Clean Glass Editorial Stack) */}
        <div className="space-y-7 pt-2">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="space-y-2.5">
              <h2 className="text-xs font-medium text-white/80 tracking-wide">
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
                          ? "bg-white text-[#004aad] font-bold border border-white shadow-md"
                          : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
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
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* High-Contrast Solid White Primary Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || selectedTags.length === 0}
            className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-white/90 text-[#004aad] font-bold text-sm tracking-tight transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] shadow-xl shadow-black/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#004aad]" />
                <span>Menghubungkan ke AI Engine...</span>
              </>
            ) : (
              <>
                <span>Simpan &amp; Tampilkan Rekomendasi Peluang</span>
                <ArrowRight className="w-4 h-4 text-[#004aad]" />
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-[11px] text-white/60 font-mono border-t border-white/20">
        ANGKASA &bull; CAREER &amp; TALENT INTELLIGENCE
      </footer>
    </div>
  );
}
