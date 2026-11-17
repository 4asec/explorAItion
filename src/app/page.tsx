"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
    const handleAnalyze = async () => {
      if (!input.trim()) return;
      setLoading(true);
      setResult(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: input }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        setResult(data);
      } catch (err: any) {
        if (err.name === "AbortError") {
          setResult({ error: "Koneksi timeout (lebih dari 15 detik). Cek terminal atau jaringan." });
        } else {
          setResult({ error: "Terjadi kesalahan koneksi ke server." });
        }
      } finally {
        setLoading(false);
      }
    };

  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
          Explor[AI]tion — AI Starter Beta Test
        </h1>

        <textarea
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-emerald-500 text-sm"
          rows={4}
          placeholder="Contoh: Saya mahasiswa semester 1 Teknik Informatika, bingung cara mulai bangun portofolio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Sedang Menganalisis..." : "Jalankan Analisis AI"}
        </button>

        {result && !result.error && (
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400 text-sm">Skor Kesiapan</span>
              <span className="text-2xl font-bold text-emerald-400">
                {result.skor_kesiapan}/100
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {result.diagnosis_singkat}
            </p>
            <div>
              <h3 className="font-semibold text-sm mb-2 text-emerald-400">
                Rekomendasi Aksi:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                {result.rekomendasi_aksi?.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
            Error: {result.error}
          </div>
        )}

      </div>
    </main>

  );

}