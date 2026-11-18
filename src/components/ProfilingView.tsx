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
  Cpu,
  Shield,
  Briefcase,
  Palette,
  BookOpen,
  Award,
} from "lucide-react";

export interface ProfilingViewProps {
  userProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
}

interface CategoryGroup {
  name: string;
  icon: React.ElementType;
  tags: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "Teknologi & AI",
    icon: Cpu,
    tags: [
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "Artificial Intelligence",
      "Prompt Engineering",
      "Machine Learning",
      "Cloud Computing",
      "Mobile Development",
    ],
  },
  {
    name: "Keamanan Siber",
    icon: Shield,
    tags: [
      "Cybersecurity",
      "Ethical Hacking",
      "Network Security",
      "Penetration Testing",
      "Cryptography",
    ],
  },
  {
    name: "Bisnis & Startup",
    icon: Briefcase,
    tags: [
      "Business Strategy",
      "Pitching",
      "Market Research",
      "Product Management",
      "Growth Hacking",
      "Financial Modeling",
    ],
  },
  {
    name: "Desain & UI/UX",
    icon: Palette,
    tags: [
      "UI/UX Design",
      "Figma",
      "Design Thinking",
      "User Research",
      "Graphic Design",
      "Prototyping",
    ],
  },
  {
    name: "Riset & Karya Tulis",
    icon: BookOpen,
    tags: [
      "Karya Tulis Ilmiah (KTI)",
      "Metodologi Penelitian",
      "Academic Writing",
      "Data Analysis",
      "Studi Literatur",
    ],
  },
  {
    name: "Kepemimpinan & Beasiswa",
    icon: Award,
    tags: [
      "Public Speaking",
      "Community Service",
      "Student Leadership",
      "International Exchange",
      "Volunteerism",
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
      setErrorMessage(`Keahlian "${trimmed}" sudah ada di daftar pilihan.`);
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
      setErrorMessage("Pilih minimal 1 minat atau keahlian untuk mempersonalisasi rekomendasi AI.");
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
      setErrorMessage("Terjadi kesalahan koneksi saat menyimpan profiling.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
        {/* Top Bar / Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-slate-100">
                PROFILING MINAT &amp; BAKAT
              </h2>
              <p className="text-xs text-slate-400">
                Langkah P2 &bull; Kalibrasi Algoritma Rekomendasi Angkasa
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 transition px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.18]"
            >
              Batal
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">
            Tentukan Fokus Keahlian &amp; Target Karir Anda
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Pilih topik yang sesuai dengan kemampuan teknis, minat penelitian, atau kompetensi kepemimpinan Anda.
            Model AI Gemini kami menyaring ratusan lomba dan beasiswa untuk mencocokkan peluang dengan probabilitas keberhasilan tertinggi.
          </p>
        </div>

        {/* Active Selected Tags Bar */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Minat Terpilih ({selectedTags.length})
            </span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                Reset Semua
              </button>
            )}
          </div>

          <div className="min-h-[52px] flex flex-wrap gap-2 items-center">
            {selectedTags.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Belum ada tag dipilih. Silakan klik chip kategori di bawah atau tambahkan keahlian kustom Anda.
              </p>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium"
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
        </div>

        {/* Custom Tag Input */}
        <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.08] space-y-3">
          <label htmlFor="custom-tag-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tambahkan Keahlian / Minat Spesifik Lainnya
          </label>
          <div className="flex gap-2">
            <input
              id="custom-tag-input"
              type="text"
              placeholder="Ketik topik kustom (contoh: Golang, Bioinformatika, Pitch Deck Strategy)..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.08] focus:border-emerald-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-xs sm:text-sm font-semibold text-slate-200 transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Category Groups Selector */}
        <div className="space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kategori Kompetensi Terverifikasi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORY_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.name}
                  className="p-5 rounded-2xl bg-[#111113] border border-white/[0.08] hover:border-white/[0.15] transition space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 tracking-wide">
                      {group.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {group.tags.map((tag) => {
                      const isSelected = selectedTags.some(
                        (t) => t.toLowerCase() === tag.toLowerCase()
                      );
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                              : "bg-[#09090B] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.15]"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || selectedTags.length === 0}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Menghubungkan ke Gemini AI &amp; Menyusun Rekomendasi...</span>
              </>
            ) : (
              <>
                <span>Simpan &amp; Muat Rekomendasi Peluang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Meta */}
      <footer className="text-center py-6 text-[11px] text-slate-500 border-t border-white/[0.04] mt-8">
        Aplikasi Angkasa &bull; Sistem Rekomendasi Peluang AI Mahasiswa Indonesia
      </footer>
    </div>
  );
}
