import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import {
  ExtractedOpportunity,
  OpportunityCategory,
  OpportunityVerificationResult,
} from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Heuristik offline cerdas untuk verifikasi peluang & anti-hoaks
 * jika Gemini AI mengalami limit/offline.
 */
function heuristicVerifyOpportunity(
  text: string
): OpportunityVerificationResult {
  const lower = text.toLowerCase();
  const redFlags: string[] = [];

  // 1. Deteksi sinyal penipuan / indikator kecurigaan (Red Flags)
  if (
    lower.includes("transfer ke rekening") ||
    lower.includes("rekening pribadi") ||
    lower.includes("atas nama pribadi") ||
    /rek(ening)?\s*:\s*\d+/i.test(text)
  ) {
    redFlags.push(
      "Ditemukan instruksi transfer biaya ke rekening bank atas nama perorangan/pribadi."
    );
  }

  if (
    lower.includes(".blogspot.") ||
    lower.includes(".wordpress.") ||
    lower.includes(".wixsite.")
  ) {
    redFlags.push(
      "Penyelenggara menggunakan situs web gratisan tak berbayar yang tidak mencerminkan domain resmi institusi."
    );
  }

  if (
    (lower.includes("bumn") || lower.includes("kementerian") || lower.includes("kemendikbud")) &&
    (lower.includes("@gmail.com") || lower.includes("@yahoo.com"))
  ) {
    redFlags.push(
      "Klaim instansi pemerintah/BUMN namun menggunakan kontak email gratisan publik (@gmail/@yahoo)."
    );
  }

  if (
    lower.includes("tanpa seleksi langsung lolos") ||
    lower.includes("pasti menang") ||
    lower.includes("dijamin lolos 100%")
  ) {
    redFlags.push(
      "Tawaran jaminan kelolosan instan tanpa proses seleksi kompetitif yang lazim."
    );
  }

  // 2. Deteksi Kategori
  let category: OpportunityCategory = "Lomba";
  if (
    lower.includes("beasiswa") ||
    lower.includes("scholarship") ||
    lower.includes("bantuan dana pendidikan") ||
    lower.includes("bantuan biaya kuliah")
  ) {
    category = "Beasiswa";
  } else if (
    lower.includes("seminar") ||
    lower.includes("webinar") ||
    lower.includes("workshop") ||
    lower.includes("talkshow") ||
    lower.includes("kuliah umum")
  ) {
    category = "Seminar";
  }

  // 3. Ekstraksi Tautan (URL)
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  const registrationUrl = urlMatch ? urlMatch[0].replace(/[.,)]+$/, "") : "";

  // 4. Ekstraksi Tanggal / Deadline
  const datePatterns = [
    /deadline\s*:\s*([^\n\r.]+)/i,
    /batas waktu\s*:\s*([^\n\r.]+)/i,
    /pendaftaran\s*(?:hingga|sampai|s\/d)\s*:\s*([^\n\r.]+)/i,
    /tanggal\s*:\s*([^\n\r.]+)/i,
    /\b\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b/i,
  ];
  let extractedDeadline = "Segera (Lihat Informasi Panitia)";
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedDeadline = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // 5. Ekstraksi Penyelenggara & Judul secara Heuristik
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let title = lines[0]?.slice(0, 80) || "Peluang Pengembangan Mahasiswa";
  if (lines.length > 1 && lines[0].length < 15) {
    title = `${lines[0]} - ${lines[1]}`.slice(0, 80);
  }

  let organizer = "Komunitas / Panitia Penyelenggara";
  const orgMatch = text.match(/(?:oleh|penyelenggara|diselenggarakan oleh|host|organizer)\s*:\s*([^\n\r.]+)/i);
  if (orgMatch && orgMatch[1]) {
    organizer = orgMatch[1].trim().slice(0, 60);
  }

  // 6. Penentuan Skor Kredibilitas
  let trustScore = 88;
  if (redFlags.length > 0) {
    trustScore = Math.max(30, 85 - redFlags.length * 28);
  } else if (!registrationUrl) {
    trustScore -= 10;
  }

  const isCredible = trustScore >= 65 && redFlags.length === 0;

  let verdict = isCredible
    ? "Informasi peluang terindikasi kredibel dengan struktur informasi yang wajar dan tidak terdeteksi indikator pungutan mencurigakan."
    : `Peringatan: Ditemukan ${redFlags.length} indikator risiko tinggi. Disarankan melakukan konfirmasi langsung ke kanal resmi institusi terkait.`;

  const extractedOpportunity: ExtractedOpportunity = {
    title,
    organizer,
    category,
    caption: extractedDeadline,
    description_roadmap: text.slice(0, 300) + (text.length > 300 ? "..." : ""),
    registration_url: registrationUrl || undefined,
    requirements: [
      "Pelajar atau Mahasiswa aktif di seluruh Indonesia",
      "Menyiapkan berkas identitas dan portofolio terkait",
    ],
    required_skills: ["Komunikasi", "Problem Solving", "Kolaborasi"],
  };

  return {
    isCredible,
    trustScore,
    redFlags,
    verdict,
    extractedOpportunity,
    skor_kesiapan: trustScore,
    diagnosis_singkat: verdict,
    rekomendasi_aksi:
      redFlags.length > 0
        ? redFlags
        : [
            "Kunjungi portal resmi dan baca petunjuk teknis dengan seksama.",
            "Lengkapi dokumen pendaftaran sebelum batas akhir.",
            "Gunakan AI Preparation Roadmap di Angkasa untuk merencanakan persiapan.",
          ],
    _modelUsed: "heuristic-offline",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInput =
      body.text ||
      body.broadcastText ||
      body.caption ||
      body.userInput ||
      "";

    if (typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: "Teks siaran atau materi peluang tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanedInput = rawInput.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Eksekusi via Gemini AI jika API Key Tersedia
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah Mesin Verifikasi Peluang & Deteksi Anti-Hoaks untuk pelajar dan mahasiswa di platform "Aplikasi Angkasa".
Tugas Anda adalah:
1. Menganalisis teks siaran (broadcast WhatsApp/Telegram/Instagram/Flyer) berikut untuk mendeteksi apakah peluang ini kredibel atau berpotensi penipuan (scam/hoaks).
2. Mengekstraksi data peluang terstruktur (judul, kategori 'Lomba'|'Beasiswa'|'Seminar', penyelenggara, tenggat waktu/caption, deskripsi, persyaratan, skills relevan, dan tautan pendaftaran).

TEKS SIARAN PELUANG:
"""
${cleanedInput}
"""

INDIKATOR PENIPUAN (RED FLAGS) YANG HARUS DIWASPADAI:
- Meminta transfer uang pendaftaran ke rekening bank atas nama pribadi (bukan rekening resmi yayasan/perusahaan/kampus).
- Menjanjikan kelolosan 100% atau hadiah ratusan juta rupiah tanpa penyelenggara yang jelas.
- Mengklaim sebagai institusi resmi pemerintah/BUMN namun memakai email publik tak resmi (@gmail.com/@yahoo.com).
- Menggunakan situs gratisan blogspot/wordpress/wix untuk pendaftaran program berskala nasional.
- Tautan pendaftaran yang mengarah ke phishing atau shortlink mencurigakan tanpa landing page jelas.

INSTRUKSI OUTPUT:
- isCredible: boolean (true jika aman & kredibel, false jika ada redFlags mencurigakan atau jelas penipuan).
- trustScore: integer 0 - 100.
- redFlags: array of string (kosongkan jika tidak ada tanda penipuan).
- verdict: 1-2 kalimat ringkasan penilaian verifikasi dan saran tindakan bagi mahasiswa.
- extractedOpportunity: objek memuat title, organizer, category ('Lomba'|'Beasiswa'|'Seminar'), caption (deadline/tanggal acara), description_roadmap (ringkasan 2-3 kalimat mengenai peluang), requirements (array string), required_skills (array string), registration_url (string atau null).`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isCredible: {
                    type: Type.BOOLEAN,
                    description: "Apakah peluang terverifikasi aman dan kredibel",
                  },
                  trustScore: {
                    type: Type.INTEGER,
                    description: "Skor kepercayaan 0 sampai 100",
                  },
                  redFlags: {
                    type: Type.ARRAY,
                    description: "Daftar indikasi penipuan atau kejanggalan yang ditemukan",
                    items: { type: Type.STRING },
                  },
                  verdict: {
                    type: Type.STRING,
                    description: "Analisis ringkas dan rekomendasi tindak lanjut bagi mahasiswa",
                  },
                  extractedOpportunity: {
                    type: Type.OBJECT,
                    description: "Data peluang terstruktur hasil ekstraksi",
                    properties: {
                      title: { type: Type.STRING },
                      organizer: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        description: "'Lomba' | 'Beasiswa' | 'Seminar'",
                      },
                      caption: {
                        type: Type.STRING,
                        description: "Deadline pendaftaran atau tanggal acara",
                      },
                      description_roadmap: { type: Type.STRING },
                      registration_url: { type: Type.STRING },
                      requirements: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      required_skills: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: [
                      "title",
                      "organizer",
                      "category",
                      "caption",
                      "description_roadmap",
                    ],
                  },
                },
                required: [
                  "isCredible",
                  "trustScore",
                  "redFlags",
                  "verdict",
                  "extractedOpportunity",
                ],
              },
            },
          });

          const parsed = JSON.parse(response.text || "{}");
          if (typeof parsed.trustScore === "number" && parsed.extractedOpportunity) {
            // Validasi kategori
            const rawCat = parsed.extractedOpportunity.category;
            let validCategory: OpportunityCategory = "Lomba";
            if (rawCat === "Beasiswa" || rawCat === "Seminar") {
              validCategory = rawCat;
            }
            parsed.extractedOpportunity.category = validCategory;

            const result: OpportunityVerificationResult = {
              isCredible: Boolean(parsed.isCredible),
              trustScore: Math.min(Math.max(parsed.trustScore, 0), 100),
              redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
              verdict: parsed.verdict || "Hasil verifikasi selesai.",
              extractedOpportunity: parsed.extractedOpportunity,
              // Backward compatibility
              skor_kesiapan: parsed.trustScore,
              diagnosis_singkat: parsed.verdict,
              rekomendasi_aksi:
                parsed.redFlags && parsed.redFlags.length > 0
                  ? parsed.redFlags
                  : [
                      "Pastikan memeriksa syarat teknis di portal resmi.",
                      "Persiapkan portofolio dan dokumen pendukung.",
                      "Bentuk tim kerja untuk memaksimalkan peluang lolos.",
                    ],
              _modelUsed: modelName,
            };

            return NextResponse.json(result);
          }
        } catch (err: any) {
          console.warn(`[AI Analyze] Model ${modelName} gagal (${err?.status || err?.message}), beralih ke model berikutnya...`);
        }
      }
    }

    // 2. Cadangan Heuristik Offline jika AI Offline / Kuota Terlampaui
    const fallbackResult = heuristicVerifyOpportunity(cleanedInput);
    return NextResponse.json(fallbackResult);
  } catch (error: any) {
    console.error("[Analyze API Error]", error);
    return NextResponse.json(
      { error: "Format request tidak valid atau gagal menganalisis teks." },
      { status: 400 }
    );
  }
}
