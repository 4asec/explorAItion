import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { mockOpportunities } from "@/lib/mockData";
import { Opportunity, PersonalizedOpportunity, UserProfile } from "@/types/schema";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

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

  // Sintesis narasi rekomendasi bergaya Career Mentor (tepat 1 kalimat ringkas <= 15 kata)
  const primaryCompetency = matchedSkills[0] || userProfiling[0] || "keahlian Anda";

  let reason = "";

  if (opp.category === "Lomba") {
    reason = `Keahlian ${primaryCompetency} Anda menjadi modal kompetitif utama untuk meraih juara.`;
  } else if (opp.category === "Beasiswa") {
    reason = `Fokus ${primaryCompetency} Anda sangat selaras dengan kriteria penerima beasiswa ini.`;
  } else {
    // Seminar / Webinar / Workshop
    reason = `Sangat strategis memperdalam pemahaman ${primaryCompetency} langsung bersama praktisi industri.`;
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
          .or("status.eq.verified,is_verified.eq.true")
          .order("created_at", { ascending: false });

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

      const prompt = `Anda adalah Senior Career Mentor terkemuka untuk mahasiswa Indonesia di platform "Aplikasi Angkasa".
Tugas Anda adalah mengevaluasi relevansi profil mahasiswa terhadap setiap peluang yang tersedia.

PROFIL MAHASISWA:
- Nama: ${userProfile.full_name || "Mahasiswa"}
- Jenjang: ${userProfile.education_level || "Perguruan Tinggi"}
- Profiling Keahlian: ${profilingList.join(", ")}

DAFTAR PELUANG:
${JSON.stringify(oppContext, null, 2)}

ATURAN WAJIB (P3 COMPLIANCE):
1. matchPercentage: Bilangan bulat integer (0 - 100) berdasarkan relevansi profil.
2. recommendationReason: WAJIB TEPAT 1 kalimat ringkas berbahasa Indonesia (maksimal 15 kata) yang langsung menyebutkan korelasi keahlian spesifik user terhadap peluang tanpa basa-basi atau kata klise.`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.2,
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
                        "Tepat 1 kalimat ringkas (maksimal 15 kata) alasan kecocokan keahlian",
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
