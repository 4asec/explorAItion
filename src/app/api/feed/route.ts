import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { mockOpportunities } from "@/lib/mockData";
import { Opportunity, PersonalizedOpportunity, UserProfile } from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Normalisasi objek peluang agar selaras dengan skema database Supabase
 * (caption sebagai deadline, description_roadmap sebagai deskripsi)
 */
function normalizeOpportunity(opp: any): Opportunity {
  const deadlineVal = opp.caption || opp.deadline || "Segera";
  const descVal = opp.description_roadmap || opp.description || "";
  return {
    ...opp,
    caption: deadlineVal,
    deadline: deadlineVal,
    description_roadmap: descVal,
    description: descVal,
    requirements: Array.isArray(opp.requirements) ? opp.requirements : [],
    required_skills: Array.isArray(opp.required_skills) ? opp.required_skills : [],
    is_verified: opp.is_verified ?? true,
  };
}

/**
 * Fallback algoritma heuristik & mentor cerdas lokal jika Gemini AI offline / kena rate limit.
 * Menghasilkan alasan tajam bergaya mentor karier (anti AI-slop) yang langsung mengaitkan
 * profiling user dengan peluang yang ditargetkan.
 */
function calculateLocalMatch(
  user: UserProfile,
  opp: Opportunity
): { matchPercentage: number; recommendationReason: string } {
  const userProfiling = (user.profiling || []).map((p) => p.trim());
  const userProfilingLower = userProfiling.map((p) => p.toLowerCase());
  const oppSkills = (opp.required_skills || []).map((s) => s.trim());
  const oppSkillsLower = oppSkills.map((s) => s.toLowerCase());

  const oppText = `${opp.title} ${opp.description_roadmap || opp.description || ""} ${opp.category}`.toLowerCase();

  // Hitung kecocokan skill eksplisit
  const matchedSkills: string[] = [];
  for (const s of oppSkills) {
    const sLower = s.toLowerCase();
    if (userProfilingLower.some((up) => up.includes(sLower) || sLower.includes(up))) {
      matchedSkills.push(s);
    }
  }

  // Hitung kecocokan kata kunci minat/bakat terhadap deskripsi peluang
  const matchedInterests: string[] = [];
  for (const p of userProfiling) {
    const pLower = p.toLowerCase();
    if (oppText.includes(pLower) && !matchedSkills.some((ms) => ms.toLowerCase() === pLower)) {
      matchedInterests.push(p);
    }
  }

  // Pembobotan skor terkalibrasi
  let score = 62;
  score += Math.min(matchedSkills.length * 14, 24);
  score += Math.min(matchedInterests.length * 8, 12);

  // Bonus relevansi jenjang pendidikan
  if (user.education_level && oppText.includes(user.education_level.toLowerCase())) {
    score += 4;
  }

  const finalScore = Math.min(Math.max(score, 65), 98);

  // Sintesis narasi rekomendasi bergaya Career Mentor (tajam, spesifik, bernilai portofolio)
  const primaryCompetency = matchedSkills[0] || userProfiling[0] || "keahlian Anda";
  const secondaryInterest = matchedInterests[0] || userProfiling[1] || "pengembangan karir";

  let reason = "";

  if (opp.category === "Lomba") {
    if (matchedSkills.length > 0) {
      reason = `Penguasaan ${primaryCompetency} Anda merupakan amunisi krusial untuk mengeksekusi solusi kompetitif di ${opp.title} dan mendongkrak reputasi portofolio teknis Anda.`;
    } else {
      reason = `Ajang ${opp.title} ini memberikan ruang pembuktian strategis untuk menguji ketangkasan ${primaryCompetency} Anda langsung di hadapan dewan juri industri.`;
    }
  } else if (opp.category === "Beasiswa") {
    if (matchedSkills.length > 0 || matchedInterests.length > 0) {
      reason = `Fokus Anda pada bidang ${primaryCompetency} dan ${secondaryInterest} sangat selaras dengan visi kontribusi penerima beasiswa yang dicari oleh ${opp.organizer}.`;
    } else {
      reason = `Program beasiswa dari ${opp.organizer} ini akan mengakselerasi rekam jejak akademik sekaligus membuka pendanaan dan jejaring mentor bagi ${primaryCompetency} Anda.`;
    }
  } else {
    // Seminar / Webinar / Workshop
    if (matchedSkills.length > 0) {
      reason = `Wawasan mendalam di sesi ${opp.title} ini tepat untuk mempertajam pemahaman praktis Anda seputar ${primaryCompetency} bersama pakar industri dari ${opp.organizer}.`;
    } else {
      reason = `Kesempatan emas untuk memperluas jejaring profesional dan menyelaraskan pemahaman Anda tentang ${secondaryInterest} dengan standar kebutuhan industri terkini.`;
    }
  }

  return { matchPercentage: finalScore, recommendationReason: reason };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userProfile, opportunities: rawOpportunities } = body;

    // 1. Validasi Profil Pengguna & Profiling (Single Array)
    if (!userProfile) {
      return NextResponse.json(
        { error: "Data profil pengguna tidak valid atau tidak ditemukan." },
        { status: 400 }
      );
    }

    const profilingList = Array.isArray(userProfile.profiling)
      ? userProfile.profiling.filter((item: any) => typeof item === "string" && item.trim().length > 0)
      : [];

    if (profilingList.length === 0) {
      return NextResponse.json(
        {
          error:
            "Silakan lengkapi profil minat dan bakat terlebih dahulu sebelum melihat rekomendasi AI.",
        },
        { status: 400 }
      );
    }

    // 2. Ambil Sumber Peluang (Client -> Supabase -> Fallback Mock)
    let oppPool: Opportunity[] = [];

    if (Array.isArray(rawOpportunities) && rawOpportunities.length > 0) {
      oppPool = rawOpportunities.map(normalizeOpportunity);
    } else {
      try {
        const { data, error } = await supabaseClient
          .from("opportunities")
          .select("*")
          .eq("is_verified", true);

        if (!error && Array.isArray(data) && data.length > 0) {
          oppPool = data.map(normalizeOpportunity);
        } else {
          oppPool = mockOpportunities.map(normalizeOpportunity);
        }
      } catch {
        oppPool = mockOpportunities.map(normalizeOpportunity);
      }
    }

    if (oppPool.length === 0) {
      oppPool = mockOpportunities.map(normalizeOpportunity);
    }

    // 3. Penilaian Berbasis Gemini AI dengan Fallback Berantai & Prompt Mentor Anti-Slop
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResults: Array<{
      opportunityId: string;
      matchPercentage: number;
      recommendationReason: string;
    }> | null = null;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const oppContext = oppPool.map((o) => ({
        id: o.id,
        title: o.title,
        category: o.category,
        organizer: o.organizer,
        deadline: o.caption || o.deadline,
        required_skills: o.required_skills,
        description: o.description_roadmap || o.description,
      }));

      const prompt = `Anda adalah Senior Career Mentor & Opportunity Strategist terkemuka untuk mahasiswa Indonesia di platform "Aplikasi Angkasa".
Tugas Anda adalah mengevaluasi relevansi mendalam antara profil mahasiswa terhadap setiap peluang yang tersedia (Lomba, Beasiswa, Seminar).

PROFIL MAHASISWA:
- Nama: ${userProfile.full_name || "Mahasiswa"}
- Institusi: ${userProfile.institution || "Perguruan Tinggi"}
- Jenjang: ${userProfile.education_level || "Diploma / Sarjana"}
- Profiling Terpadu (Skills, Minat, dan Bakat): ${profilingList.join(", ")}

DAFTAR PELUANG UNTUK DINILAI:
${JSON.stringify(oppContext, null, 2)}

ATURAN WAJIB PENILAIAN (KUALITAS TINGGI):
1. Berikan matchPercentage berupa bilangan bulat integer realistis (0 - 100) berdasarkan seberapa relevan peluang tersebut dengan data profiling mahasiswa.
2. Gaya Bahasa recommendationReason:
   - DILARANG menggunakan kalimat generik/klise ("AI slop") seperti: "Peluang yang bagus untuk meningkatkan kemampuan Anda", "Sangat cocok untuk masa depan Anda", atau "Peluang ini menarik untuk dicoba".
   - WAJIB 1–2 kalimat bernas dan tajam berbahasa Indonesia yang bersuara layaknya mentor karier berpengalaman.
   - WAJIB menyebutkan secara spesifik keahlian, minat, atau bakat yang dimiliki mahasiswa (dari daftar profiling) dan bagaimana peluang ini mengonversinya menjadi keunggulan portofolio, kompetensi teknis, atau peluang menang/lolos.`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "Daftar penilaian kecocokan setiap peluang terhadap mahasiswa",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    opportunityId: {
                      type: Type.STRING,
                      description: "ID unik peluang yang dinilai",
                    },
                    matchPercentage: {
                      type: Type.INTEGER,
                      description: "Skor persentase kecocokan 0-100",
                    },
                    recommendationReason: {
                      type: Type.STRING,
                      description:
                        "1-2 kalimat tajam bernuansa mentor karier menyebut keahlian spesifik user dan nilai portofolionya",
                    },
                  },
                  required: ["opportunityId", "matchPercentage", "recommendationReason"],
                },
              },
            },
          });

          const parsed = JSON.parse(response.text || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            aiResults = parsed;
            break;
          }
        } catch (err: any) {
          console.warn(`[AI Feed] Model ${modelName} gagal (${err?.status || err?.message}), beralih ke model berikutnya...`);
        }
      }
    }

    // 4. Gabungkan Hasil (AI atau Heuristik Mentor Lokal)
    const aiResultMap = new Map<string, { matchPercentage: number; recommendationReason: string }>();
    if (aiResults) {
      for (const item of aiResults) {
        if (item.opportunityId) {
          aiResultMap.set(item.opportunityId, {
            matchPercentage: Math.min(Math.max(item.matchPercentage || 70, 0), 100),
            recommendationReason: item.recommendationReason || "Peluang strategis untuk memperkuat rekam jejak portofolio dan kompetensi Anda.",
          });
        }
      }
    }

    const personalizedList: PersonalizedOpportunity[] = oppPool.map((opp) => {
      const aiMatch = aiResultMap.get(opp.id);
      if (aiMatch) {
        return {
          ...opp,
          matchPercentage: aiMatch.matchPercentage,
          recommendationReason: aiMatch.recommendationReason,
        };
      }
      const localMatch = calculateLocalMatch(userProfile, opp);
      return {
        ...opp,
        matchPercentage: localMatch.matchPercentage,
        recommendationReason: localMatch.recommendationReason,
      };
    });

    // 5. Urutkan secara ketat dari matchPercentage tertinggi ke terendah
    personalizedList.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json(personalizedList);
  } catch (error: any) {
    console.error("[AI Feed Error]", error);
    return NextResponse.json(
      { error: "Format request tidak valid atau terjadi kegagalan pemrosesan data." },
      { status: 400 }
    );
  }
}
