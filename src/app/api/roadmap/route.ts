import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { Opportunity, RoadmapResponse, UserProfile } from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Normalisasi atribut peluang untuk keselarasan deadline/caption dan deskripsi
 */
function normalizeOpportunityFields(opp: any) {
  const deadline = opp.caption || opp.deadline || "Segera";
  const description = opp.description_roadmap || opp.description || "";
  return {
    ...opp,
    caption: deadline,
    deadline: deadline,
    description_roadmap: description,
    description: description,
    requirements: Array.isArray(opp.requirements) ? opp.requirements : [],
    required_skills: Array.isArray(opp.required_skills) ? opp.required_skills : [],
  };
}

/**
 * Fallback deterministik cerdas berbasis kategori & data peluang nyata
 * jika Gemini AI limit/offline, menjamin zero crash dan kualitas konten tinggi.
 */
function getCategoryFallbackRoadmap(
  user: UserProfile,
  rawOpp: Opportunity
): RoadmapResponse {
  const opp = normalizeOpportunityFields(rawOpp);
  const deadlineText = opp.deadline || "Batas Waktu Pendaftaran";
  const userProfilingList = Array.isArray(user.profiling) ? user.profiling : [];
  const topCompetencies = userProfilingList.slice(0, 3).join(", ") || "kompetensi unggulan Anda";
  const userInstitution = user.institution || "kampus/institusi Anda";

  if (opp.category === "Beasiswa") {
    return {
      document_checklist: [
        {
          item: "Esai Motivasi & Rencana Studi (Personal Statement)",
          tip: `Tekankan korelasi antara keahlian Anda (${topCompetencies}) dengan visi kebermanfaatan sosial yang diusung oleh ${opp.organizer}.`,
        },
        {
          item: "Surat Rekomendasi Akademik & Karakter",
          tip: `Mintalah surat rekomendasi dari dosen pembimbing di ${userInstitution} minimal 14 hari sebelum deadline, sertakan draf CV Anda.`,
        },
        {
          item: "Curriculum Vitae (CV) Standar ATS & Portofolio Pengabdian",
          tip: "Kuantifikasikan setiap pencapaian (misal: 'Mengoordinasi 50+ peserta') dan soroti rekam jejak kepemimpinan.",
        },
        {
          item: "Transkrip Nilai Legalisir & Dokumen Identitas Resmi",
          tip: "Pindai dokumen asli beresolusi tinggi (format PDF, ukuran < 2MB) agar terbaca jelas oleh sistem seleksi.",
        },
      ],
      winning_strategy: [
        `Tunjukkan keterhubungan kuat antara latar belakang studi di ${userInstitution} dengan target karier 5 tahun ke depan pasca-beasiswa.`,
        "Jelaskan daya juang (grit) dan solusi konkret yang pernah Anda ambil saat mengatasi tantangan akademik atau finansial terberat.",
        "Lakukan peer-review esai bersama minimal dua mentor atau awardee beasiswa serupa sebelum melakukan submisi final.",
      ],
      timeline: [
        {
          phase: "Minggu 1: Pemetaan Kriteria & Pengurusan Berkas",
          action: `Pelajari buku panduan resmi dari ${opp.organizer}, mintalah surat pengantar resmi dari ${userInstitution}, dan hubungi pemberi rekomendasi.`,
        },
        {
          phase: "Minggu 2: Penulisan Draf Esai Berbobot",
          action: `Tulis esai motivasi yang menonjolkan fokus ${topCompetencies}, pastikan struktur pembuka-inti-penutup terjalin logis tanpa retorika klise.`,
        },
        {
          phase: "Minggu 3: Proofreading & Uji Keterbacaan",
          action: "Lakukan revisi tata bahasa berdasarkan feedback mentor dan uji format CV pada pemindai ATS daring.",
        },
        {
          phase: `Finalisasi Submisi (Sebelum ${deadlineText})`,
          action: `Unggah seluruh dokumen lengkap ke portal resmi (${opp.registration_url || "portal penyelenggara"}) minimal 3 hari sebelum tenggat waktu.`,
        },
      ],
      recommended_tools: ["Grammarly / TypoOnline", "Overleaf (LaTeX CV)", "Google Docs (Review Mode)", "CamScanner HD"],
      curation_tips: [
        "Reviewer beasiswa memprioritaskan konsistensi integritas dan keaslian cerita pribadi dibanding daftar prestasi tanpa konteks.",
        "Hindari jawaban pasif; gunakan kata kerja aktif yang menunjukkan inisiatif kepemimpinan.",
      ],
    };
  }

  if (opp.category === "Seminar") {
    return {
      document_checklist: [
        {
          item: "Tiket Registrasi / E-Badge Resmi",
          tip: `Simpan berkas konfirmasi pendaftaran dari ${opp.organizer} di smartphone dan kalender Google Anda.`,
        },
        {
          item: "Curriculum Vitae Digital & Profil LinkedIn Terkini",
          tip: `Perbarui headline LinkedIn Anda dengan fokus keahlian (${topCompetencies}) dan siapkan link portofolio ringkas.`,
        },
        {
          item: "Daftar Pertanyaan Kritis Terkurasi",
          tip: `Siapkan 2-3 pertanyaan mendalam terkait studi kasus atau masa depan topik '${opp.title}' untuk diajukan ke narasumber utama.`,
        },
      ],
      winning_strategy: [
        "Lakukan riset latar belakang para narasumber dan publikasi terbaru mereka untuk membangun diskusi berbobot saat sesi Q&A.",
        "Aktiflah berjejaring dengan peserta lain di sesi breakout atau grup komunitas untuk membuka peluang kolaborasi proyek baru.",
        "Rangkum intisari wawasan utama dalam bentuk tulisan reflektif di LinkedIn dalam waktu 24 jam setelah sesi berakhir untuk memperluas jangkauan personal branding.",
      ],
      timeline: [
        {
          phase: "H-7 s.d. H-3: Pra-Acara & Riset Pembicara",
          action: `Pelajari silabus topik '${opp.title}', identifikasi narasumber dari ${opp.organizer}, dan formulasikan pertanyaan strategis.`,
        },
        {
          phase: `Hari-H: Partisipasi Aktif & Networking (${deadlineText})`,
          action: "Hadir 15 menit lebih awal, catat insight metodologis, ajukan pertanyaan di sesi interaktif, dan bertukar kontak profesional.",
        },
        {
          phase: "H+1 s.d. H+3: Pasca-Acara & Tindak Lanjut Kolaborasi",
          action: "Kirim pesan apresiasi kepada narasumber di LinkedIn, terhubung dengan rekan baru, dan dokumentasikan hasil belajar ke tim Anda.",
        },
      ],
      recommended_tools: ["Notion (Catatan Sesi)", "LinkedIn App", "Miro / Whimsical (Mindmapping Insight)"],
      curation_tips: [
        "Penyelenggara dan narasumber sangat menghargai peserta yang mengajukan pertanyaan solutif daripada sekadar menanyakan hal administratif.",
      ],
    };
  }

  // Default Kategori 'Lomba' / Kompetisi / Hackathon
  return {
    document_checklist: [
      {
        item: "Proposal Solusi Inovatif / Pitch Deck Standar Industri",
        tip: "Strukturkan dengan framework Problem-Solution-Market-Tech Stack-Roadmap. Batasi teks naratif dan tonjolkan visualisasi diagram arsitektur.",
      },
      {
        item: "Prototipe MVP Fungsional & Repositori Git Aktif",
        tip: "Pastikan alur pengguna utama (happy path) berfungsi tanpa kendala teknis dan sertakan dokumentasi README yang jelas.",
      },
      {
        item: "Video Demonstrasi Produk (Durasi 2-3 Menit)",
        tip: "Fokus 30 detik pertama pada urgensi masalah nyata di lapangan, lalu tunjukkan demonstrasi produk langsung secara interaktif.",
      },
      {
        item: "Surat Keterangan Mahasiswa Aktif & Pernyataan Orisinalitas",
        tip: `Mintalah tanda tangan pengesahan dari pihak dekanat/program studi ${userInstitution} sejak awal masa kompetisi.`,
      },
    ],
    winning_strategy: [
      `Fokus pada pembuktian validasi masalah nyata (Problem-Solution Fit) daripada menumpuk fitur rumit yang tidak menjawab esensi tantangan ${opp.title}.`,
      `Manfaatkan perpaduan kompetensi tim (${topCompetencies}) untuk membagi peran eksekusi secara disiplin: 1 Hacker (arsitektur), 1 Hipster (UX/UI), dan 1 Hustler (pitching & value proposition).`,
      "Simulasikan sesi tanya-jawab juri dengan fokus pada metrik skalabilitas sistem, keamanan data, dan dampak ekonomi atau sosial bagi masyarakat.",
    ],
    timeline: [
      {
        phase: "Fase 1: Riset Masalah, Validasi Ide & Wireframing",
        action: `Analisis petunjuk teknis (juknis) dari ${opp.organizer}, buat survei singkat kebutuhan pengguna, dan susun kerangka arsitektur solusi awal.`,
      },
      {
        phase: "Fase 2: Pengembangan MVP & Penyusunan Proposal",
        action: `Bangun prototipe fitur inti yang stabil, uji alur data utama, dan tulis proposal dengan penekanan pada kebaruan solusi tim.`,
      },
      {
        phase: `Fase 3: Pengujian Usabilitas & Finalisasi Pitching Deck`,
        action: "Lakukan pengujian antarmuka dengan 5 pengguna potensial, sempurnakan slide presentasi, dan rekam video demonstrasi yang memikat.",
      },
      {
        phase: `Fase 4: Submisi Akhir & Simulasi Tanya-Jawab (${deadlineText})`,
        action: `Submit berkas lengkap minimal 24 jam sebelum batas waktu di portal resmi (${opp.registration_url || "portal pendaftaran"}) untuk menghindari antrean server.`,
      },
    ],
    recommended_tools: ["Figma / FigJam", "GitHub / GitLab", "Vercel / Supabase", "Loom (Video Demo)", "Pitch.com"],
    curation_tips: [
      "Dewan juri hackathon menilai 4 pilar utama: Keaslian Inovasi (30%), Kelayakan Teknis (30%), Dampak Nyata (25%), dan Kualitas Penyampaian Presentasi (15%).",
      "Jangan biarkan prototipe hanya berupa gambar statis; juri ingin melihat interaksi data yang responsif.",
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

    const normOpp = normalizeOpportunityFields(opportunity);
    const profilingList = Array.isArray(userProfile.profiling)
      ? userProfile.profiling.filter((item: any) => typeof item === "string" && item.trim().length > 0)
      : [];

    // 2. Pembuatan Roadmap Personal via Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    let roadmapResult: RoadmapResponse | null = null;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah Konsultan Strategi Kompetisi, Beasiswa, dan Karir Tingkat Nasional untuk mahasiswa Indonesia di platform "Aplikasi Angkasa".
Tugas Anda adalah menyusun "AI Preparation Roadmap" yang sangat spesifik, taktis, dan terstruktur langkah demi langkah untuk membantu mahasiswa ini lolos atau memenangkan peluang target.

PROFIL MAHASISWA:
- Nama: ${userProfile.full_name || "Mahasiswa"}
- Institusi: ${userProfile.institution || "Perguruan Tinggi"}
- Jenjang: ${userProfile.education_level || "Diploma / Sarjana"}
- Profiling Terpadu (Keahlian, Minat & Bakat): ${profilingList.join(", ") || "Mahasiswa Berprestasi"}

DETAIL PELUANG TARGET:
- Judul Peluang: ${normOpp.title}
- Kategori: ${normOpp.category}
- Penyelenggara: ${normOpp.organizer}
- Batas Waktu / Tenggat: ${normOpp.caption || normOpp.deadline}
- Deskripsi: ${normOpp.description_roadmap || normOpp.description}
- Persyaratan Resmi: ${(normOpp.requirements || []).join(" | ") || "Sesuai petunjuk teknis panitia"}
- Kualifikasi Skill: ${(normOpp.required_skills || []).join(", ") || "Terbuka umum"}

PANDUAN PENYUSUNAN ROADMAP BERKUALITAS TINGGI:
1. "document_checklist": Berikan 3–4 berkas wajib spesifik untuk peluang ini dengan tips taktis penyiapannya.
2. "winning_strategy": Berikan TEPAT 3 poin strategi kelolosan/kemenangan yang tajam, realistis, dan relevan dengan profil mahasiswa.
3. "timeline": Rancang 3–4 tahapan fase waktu berjenjang dari persiapan awal hingga tenggat waktu (${normOpp.caption || normOpp.deadline}), memuat nama fase dan aksi nyata yang harus dilakukan.
4. "recommended_tools": Berikan 3–5 perangkat lunak / tools industri yang relevan untuk mengeksekusi persiapan peluang ini (misal: Figma, Overleaf, Postman, Vercel, Grammarly).
5. "curation_tips": Berikan 2 tips eksklusif mengenai hal-hal krusial yang paling dinilai oleh dewan juri / tim reviewer penilai program ini.

Bahasa: Bahasa Indonesia profesional, memotivasi, realistis, dan aplikatif bagi mahasiswa.`;

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
                    description: "Daftar berkas atau dokumen yang perlu disiapkan beserta tips taktisnya",
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
                    description: "Tahapan waktu persiapan berjenjang hingga batas waktu",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        phase: {
                          type: Type.STRING,
                          description: "Nama fase atau rentang waktu tahapan",
                        },
                        action: {
                          type: Type.STRING,
                          description: "Aksi konkret dan terukur yang harus diselesaikan pada fase ini",
                        },
                      },
                      required: ["phase", "action"],
                    },
                  },
                  recommended_tools: {
                    type: Type.ARRAY,
                    description: "Daftar perangkat lunak atau tools penunjang persiapan",
                    items: {
                      type: Type.STRING,
                    },
                  },
                  curation_tips: {
                    type: Type.ARRAY,
                    description: "Tips khusus kriteria penilaian dewan juri atau reviewer",
                    items: {
                      type: Type.STRING,
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
            roadmapResult = {
              document_checklist: parsed.document_checklist,
              winning_strategy: parsed.winning_strategy,
              timeline: parsed.timeline,
              recommended_tools: Array.isArray(parsed.recommended_tools) ? parsed.recommended_tools : undefined,
              curation_tips: Array.isArray(parsed.curation_tips) ? parsed.curation_tips : undefined,
            };
            break;
          }
        } catch (err: any) {
          console.warn(`[AI Roadmap] Model ${modelName} gagal (${err?.status || err?.message}), mencoba fallback...`);
        }
      }
    }

    // 3. Fallback Statis Cerdas jika AI Tidak Tersedia
    if (!roadmapResult) {
      roadmapResult = getCategoryFallbackRoadmap(userProfile, normOpp);
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
