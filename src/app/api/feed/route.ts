import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabaseClient";
import { mockOpportunities } from "@/lib/mockData";
import { Opportunity, PersonalizedOpportunity, UserProfile } from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Fallback algoritma heuristik lokal jika AI offline atau terkena rate limit
 */
function calculateLocalMatch(
  user: UserProfile,
  opp: Opportunity
): { matchPercentage: number; recommendationReason: string } {
  const userSkills = (user.skills || []).map((s) => s.toLowerCase());
  const userInterests = (user.interests || []).map((i) => i.toLowerCase());
  const oppSkills = (opp.required_skills || []).map((s) => s.toLowerCase());
  const oppText = `${opp.title} ${opp.description} ${opp.category}`.toLowerCase();

  const matchedSkills = (opp.required_skills || []).filter((s) =>
    userSkills.some((us) => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
  );

  const matchedInterests = (user.interests || []).filter((i) =>
    oppText.includes(i.toLowerCase())
  );

  let score = 55;
  score += Math.min(matchedSkills.length * 15, 30);
  score += Math.min(matchedInterests.length * 10, 15);

  if (opp.category === "Lomba" && user.talents) {
    score += 5;
  }

  const finalScore = Math.min(Math.max(score, 60), 98);

  let reason = `Peluang kategori ${opp.category} ini sangat strategis untuk memperkuat rekam jejak portofolio Anda.`;
  if (matchedSkills.length > 0 && matchedInterests.length > 0) {
    reason = `Peluang ini sangat cocok karena membutuhkan keahlian ${matchedSkills[0]} serta selaras dengan minat Anda pada ${matchedInterests[0]}.`;
  } else if (matchedSkills.length > 0) {
    reason = `Profil keahlian Anda di bidang ${matchedSkills[0]} memenuhi kualifikasi utama yang dibutuhkan penyelenggara.`;
  } else if (matchedInterests.length > 0) {
    reason = `Program ini sangat relevan untuk memperdalam fokus minat Anda di bidang ${matchedInterests[0]}.`;
  }

  return { matchPercentage: finalScore, recommendationReason: reason };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userProfile, opportunities: rawOpportunities } = body;

    // 1. Validasi Profil Pengguna
    if (!userProfile) {
      return NextResponse.json(
        { error: "Data profil pengguna tidak valid atau tidak ditemukan." },
        { status: 400 }
      );
    }

    const hasSkills = Array.isArray(userProfile.skills) && userProfile.skills.length > 0;
    const hasInterests = Array.isArray(userProfile.interests) && userProfile.interests.length > 0;

    if (!hasSkills && !hasInterests) {
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
      oppPool = rawOpportunities;
    } else {
      try {
        const { data, error } = await supabaseClient
          .from("opportunities")
          .select("*")
          .eq("is_verified", true);

        if (!error && Array.isArray(data) && data.length > 0) {
          oppPool = data as Opportunity[];
        } else {
          oppPool = mockOpportunities;
        }
      } catch {
        oppPool = mockOpportunities;
      }
    }

    if (oppPool.length === 0) {
      oppPool = mockOpportunities;
    }

    // 3. Penilaian Berbasis Gemini AI dengan Fallback Berantai
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
        required_skills: o.required_skills,
        description: o.description,
      }));

      const prompt = `Anda adalah sistem rekomendasi karir & kompetensi pintar untuk mahasiswa Indonesia (Aplikasi Angkasa).
Tugas Anda adalah menilai kecocokan profil pengguna terhadap masing-masing peluang yang tersedia.

PROFIL PENGGUNA:
- Nama: ${userProfile.full_name || "Mahasiswa"}
- Jenjang: ${userProfile.education_level || "Perguruan Tinggi"}
- Keahlian (Skills): ${(userProfile.skills || []).join(", ") || "Belum diisi"}
- Minat (Interests): ${(userProfile.interests || []).join(", ") || "Belum diisi"}
- Bakat/Potensi: ${userProfile.talents || "Belum diisi"}

DAFTAR PELUANG:
${JSON.stringify(oppContext, null, 2)}

ATURAN PENILAIAN:
1. Berikan matchPercentage (angka integer 0-100) berdasarkan seberapa relevan peluang tersebut terhadap keahlian, minat, dan bakat pengguna.
2. Berikan recommendationReason tepat 1 kalimat padat berbahasa Indonesia yang jelas, persuasif, dan menyebutkan relevansi keahlian atau minat pengguna secara spesifik.`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "Daftar penilaian kecocokan setiap peluang terhadap user",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    opportunityId: {
                      type: Type.STRING,
                      description: "ID peluang yang sesuai",
                    },
                    matchPercentage: {
                      type: Type.INTEGER,
                      description: "Persentase kecocokan 0-100",
                    },
                    recommendationReason: {
                      type: Type.STRING,
                      description:
                        "1 kalimat padat berbahasa Indonesia mengapa peluang ini cocok untuk user",
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
          console.warn(`[AI Feed] Model ${modelName} gagal (${err?.status || err?.message}), mencoba model berikutnya...`);
        }
      }
    }

    // 4. Gabungkan Hasil (AI atau Heuristik Lokal)
    const aiResultMap = new Map<string, { matchPercentage: number; recommendationReason: string }>();
    if (aiResults) {
      for (const item of aiResults) {
        if (item.opportunityId) {
          aiResultMap.set(item.opportunityId, {
            matchPercentage: Math.min(Math.max(item.matchPercentage || 70, 0), 100),
            recommendationReason: item.recommendationReason || "Peluang yang sangat direkomendasikan untuk pengembangan kompetensi Anda.",
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

    // 5. Urutkan dari matchPercentage tertinggi ke terendah
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
