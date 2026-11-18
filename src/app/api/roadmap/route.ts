import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { Opportunity, RoadmapResponse, UserProfile } from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Fallback cerdas berdasarkan kategori peluang jika Gemini AI offline / limit
 */
function getCategoryFallbackRoadmap(
  user: UserProfile,
  opp: Opportunity
): RoadmapResponse {
  const deadlineText = opp.deadline || "Jelang Penutupan";
  const userProfilingList = Array.isArray(user.profiling) ? user.profiling : [];
  const topCompetencies = userProfilingList.slice(0, 3).join(", ") || "keahlian utama";

  if (opp.category === "Beasiswa") {
    return {
      document_checklist: [
        {
          item: "Esai Motivasi / Personal Statement",
          tip: "Tuliskan narasi autentik mengenai kontribusi nyata Anda bagi masyarakat dan hubungkan dengan visi penyelenggara.",
        },
        {
          item: "Transkrip Nilai Akademik & Surat Rekomendasi",
          tip: "Mintalah surat rekomendasi dari dosen pembimbing atau dekan minimal 2 minggu sebelum batas waktu pengumpulan.",
        },
        {
          item: "Curriculum Vitae (CV) ATS-Friendly & Portofolio Prestasi",
          tip: `Soroti kompetensi relevan Anda seperti ${topCompetencies} dan pengalaman kepemimpinan.`,
        },
      ],
      winning_strategy: [
        "Bangun keterhubungan yang kuat antara studi Anda saat ini dengan rencana karir pasca-lulus yang terukur.",
        "Jelaskan daya juang (grit) dan solusi yang pernah Anda tempuh saat menghadapi rintangan akademis atau finansial.",
        "Lakukan proofreading esai bersama minimal dua rekan atau awardee terdahulu untuk memastikan kejelasan argumen.",
      ],
      timeline: [
        {
          phase: "Minggu 1: Riset & Administrasi",
          action: "Pelajari kriteria penerima beasiswa dan lengkapi surat pengantar dari institusi " + (user.institution || "kampus") + ".",
        },
        {
          phase: "Minggu 2-3: Penulisan Esai & Review",
          action: "Tulis draf esai motivasi, integrasikan keahlian Anda, dan minta umpan balik dari mentor.",
        },
        {
          phase: `Finalisasi (Sebelum ${deadlineText})`,
          action: "Unggah seluruh berkas terverifikasi minimal 3 hari sebelum deadline untuk mengantisipasi server padat.",
        },
      ],
    };
  }

  if (opp.category === "Seminar") {
    return {
      document_checklist: [
        {
          item: "Bukti Pendaftaran & Identitas Mahasiswa",
          tip: "Simpan QR code atau tiket digital di smartphone untuk kemudahan check-in di hari pelaksanaan.",
        },
        {
          item: "Daftar Pertanyaan & Topik Diskusi",
          tip: "Siapkan 2-3 pertanyaan mendalam terkait tren " +
            (opp.required_skills?.slice(0, 2).join(" & ") || "industri") +
            " untuk diajukan ke narasumber.",
        },
        {
          item: "Profil LinkedIn & Portofolio Digital",
          tip: "Perbarui tautan proyek portofolio Anda agar siap dibagikan saat sesi networking dengan praktisi.",
        },
      ],
      winning_strategy: [
        "Manfaatkan sesi tanya jawab interaktif untuk membangun reputasi personal di hadapan pembicara industri.",
        "Bangun koneksi langsung dengan minimal 3 peserta lain yang memiliki minat di bidang yang serupa.",
        "Publikasikan intisari insight dan dokumentasi acara di LinkedIn dalam waktu 24 jam setelah sesi berakhir.",
      ],
      timeline: [
        {
          phase: "Pra-Acara",
          action: "Pelajari profil pembicara, ringkasan materi, dan siapkan perangkat lunak yang disyaratkan.",
        },
        {
          phase: "Hari Acara",
          action: "Hadiri sesi tepat waktu, catat poin-poin terobosan, dan aktif dalam diskusi ruang tanya-jawab.",
        },
        {
          phase: "Pasca-Acara",
          action: "Tindak lanjuti koneksi baru di platform profesional dan aplikasikan wawasan yang diperoleh pada proyek nyata.",
        },
      ],
    };
  }

  // Default untuk Kategori 'Lomba'
  return {
    document_checklist: [
      {
        item: "Proposal Solusi / Pitch Deck Komprehensif",
        tip: "Fokus pada validasi masalah nyata, keunikan solusi inovatif, dan arsitektur teknologi yang realistis.",
      },
      {
        item: "Prototipe MVP Fungsional & Repositori Git",
        tip: "Pastikan alur pengguna utama (happy path) berjalan mulus tanpa bug fatal saat demonstrasi juri.",
      },
      {
        item: "Video Demonstrasi Produk (Durasi 2-3 Menit)",
        tip: "Gunakan narasi problem-solution yang padat dengan tampilan antarmuka interaktif yang profesional.",
      },
    ],
    winning_strategy: [
      "Fokus pada penyelesaian akar masalah nyata (problem-solution fit) bukan sekadar menumpuk fitur teknologi canggih.",
      `Optimalkan keunggulan profil profiling anggota tim (${topCompetencies}) dengan pembagian tugas yang terukur.`,
      "Latih skenario tanya-jawab juri khususnya pada aspek skalabilitas, keamanan sistem, dan model keberlanjutan.",
    ],
    timeline: [
      {
        phase: "Fase 1: Riset Masalah & Desain Solusi",
        action: "Validasi kebutuhan pengguna sasaran dan buat wireframe prototipe serta rancangan sistem awal.",
      },
      {
        phase: "Fase 2: Eksekusi MVP & Penulisan Proposal",
        action: "Bangun fitur inti yang berfungsi penuh dan susun bab metodologi serta kebaruan teknologi pada proposal.",
      },
      {
        phase: `Fase 3: Simulasi Pitching & Submisi (${deadlineText})`,
        action: "Rekam video demonstrasi produk, lakukan uji coba kelayakan akhir, dan kirim berkas pendaftaran sebelum deadline.",
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userProfile, opportunity } = body as {
      userProfile: UserProfile;
      opportunity: Opportunity;
    };

    // 1. Validasi Input
    if (!userProfile || !opportunity) {
      return NextResponse.json(
        { error: "Profil pengguna dan data peluang wajib disertakan." },
        { status: 400 }
      );
    }

    if (!opportunity.id || !opportunity.title) {
      return NextResponse.json(
        { error: "Data peluang tidak lengkap atau tidak valid." },
        { status: 400 }
      );
    }

    const profilingList = Array.isArray(userProfile.profiling) ? userProfile.profiling : [];

    // 2. Upaya Pembuatan Roadmap via Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    let roadmapResult: RoadmapResponse | null = null;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah konsultan strategi karir dan kompetisi tingkat nasional untuk mahasiswa Indonesia (Aplikasi Angkasa).
Tugas Anda adalah menyusun "AI Preparation Roadmap" yang sangat spesifik, terstruktur, dan aplikatif untuk membantu mahasiswa ini lolos atau memenangkan peluang target.

PROFIL MAHASISWA:
- Nama: ${userProfile.full_name || "Mahasiswa"}
- Institusi: ${userProfile.institution || "Perguruan Tinggi"}
- Jenjang: ${userProfile.education_level || "Diploma/Sarjana"}
- Profiling (Keahlian, Minat & Bakat): ${profilingList.join(", ") || "Mahasiswa Berbakat"}

DETAIL PELUANG TARGET:
- Judul: ${opportunity.title}
- Kategori: ${opportunity.category}
- Penyelenggara: ${opportunity.organizer}
- Batas Waktu (Deadline): ${opportunity.deadline}
- Deskripsi: ${opportunity.description}
- Persyaratan: ${(opportunity.requirements || []).join(" | ")}
- Keahlian Dibutuhkan: ${(opportunity.required_skills || []).join(", ")}

INSTRUKSI PENYUSUNAN ROADMAP:
1. "document_checklist": Berisi daftar berkas/dokumen wajib dengan tip taktis penyiapannya.
2. "winning_strategy": Tepat 3 poin strategi pemenangan/kelolosan yang tajam, berbasis pengalaman praktis.
3. "timeline": Tahapan persiapan bertahap hingga tanggal deadline (${opportunity.deadline}), masing-masing memuat nama fase dan aksi konkret yang harus dilakukan.
Gunakan Bahasa Indonesia baku, bernada suportif, profesional, dan realistis untuk mahasiswa.`;

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
                  document_checklist: {
                    type: Type.ARRAY,
                    description: "Daftar berkas atau dokumen yang perlu disiapkan beserta tips",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        item: {
                          type: Type.STRING,
                          description: "Nama dokumen atau berkas",
                        },
                        tip: {
                          type: Type.STRING,
                          description: "Tips taktis penyiapan berkas tersebut",
                        },
                      },
                      required: ["item", "tip"],
                    },
                  },
                  winning_strategy: {
                    type: Type.ARRAY,
                    description: "Tepat 3 poin strategi kunci kemenangan atau kelolosan",
                    items: {
                      type: Type.STRING,
                    },
                  },
                  timeline: {
                    type: Type.ARRAY,
                    description: "Tahapan waktu persiapan berjenjang hingga deadline",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        phase: {
                          type: Type.STRING,
                          description: "Nama fase atau rentang waktu",
                        },
                        action: {
                          type: Type.STRING,
                          description: "Aksi nyata yang harus diselesaikan pada fase ini",
                        },
                      },
                      required: ["phase", "action"],
                    },
                  },
                },
                required: ["document_checklist", "winning_strategy", "timeline"],
              },
            },
          });

          const parsed = JSON.parse(response.text || "{}");
          if (
            Array.isArray(parsed.document_checklist) &&
            Array.isArray(parsed.winning_strategy) &&
            Array.isArray(parsed.timeline)
          ) {
            roadmapResult = parsed as RoadmapResponse;
            break;
          }
        } catch (err: any) {
          console.warn(`[AI Roadmap] Model ${modelName} gagal (${err?.status || err?.message}), mencoba fallback...`);
        }
      }
    }

    // 3. Fallback Statis Kaya Konteks jika AI Tidak Tersedia
    if (!roadmapResult) {
      roadmapResult = getCategoryFallbackRoadmap(userProfile, opportunity);
    }

    return NextResponse.json(roadmapResult);
  } catch (error: any) {
    console.error("[Roadmap API Error]", error);
    return NextResponse.json(
      { error: "Format request tidak valid atau gagal menghasilkan roadmap." },
      { status: 400 }
    );
  }
}
