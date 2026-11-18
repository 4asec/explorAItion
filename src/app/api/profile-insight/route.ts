import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { ProfileInsightResult } from "@/types/schema";

const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];

/**
 * Fallback deterministik cerdas berbasis ekstraksi kata kunci jika API Gemini offline / kuota habis.
 */
function heuristicProfileInsight(story: string): ProfileInsightResult {
  const lower = story.toLowerCase();

  // 1. Domain Keamanan Siber / Cyber Security
  if (
    lower.includes("cyber") ||
    lower.includes("security") ||
    lower.includes("keamanan") ||
    lower.includes("hacker") ||
    lower.includes("pentest") ||
    lower.includes("ctf") ||
    lower.includes("jaringan")
  ) {
    return {
      recommendedRole: "AI Security & Full-Stack Builder",
      careerInsight:
        "Profil Anda memiliki pemahaman teknis yang solid pada fondasi sistem dan ketahanan siber. Sangat disarankan untuk memprioritaskan kompetisi Capture The Flag (CTF) dan hackathon keamanan digital untuk memperkuat portofolio kompetisi Anda.",
      extractedTags: [
        "Cybersecurity",
        "Python",
        "Penetration Testing",
        "Network Security",
        "AI Engineering",
      ],
      _modelUsed: "heuristic-deterministic",
    };
  }

  // 2. Domain Kecerdasan Buatan / Data Science
  if (
    lower.includes("ai") ||
    lower.includes("machine learning") ||
    lower.includes("data") ||
    lower.includes("deep learning") ||
    lower.includes("llm") ||
    lower.includes("kecerdasan")
  ) {
    return {
      recommendedRole: "AI Engineer & Data Innovator",
      careerInsight:
        "Ketertarikan Anda pada kecerdasan buatan memberikan nilai tawar tinggi dalam memecahkan masalah kompleks. Fokuskan langkah Anda pada hackathon berbasis solusi GenAI dan kompetisi data analytics tingkat nasional.",
      extractedTags: [
        "Artificial Intelligence",
        "Machine Learning",
        "Python",
        "AI Engineering",
        "Data Analysis",
      ],
      _modelUsed: "heuristic-deterministic",
    };
  }

  // 3. Domain Frontend / Desain Produk / UI/UX
  if (
    lower.includes("ui") ||
    lower.includes("ux") ||
    lower.includes("desain") ||
    lower.includes("design") ||
    lower.includes("figma") ||
    lower.includes("frontend") ||
    lower.includes("react") ||
    lower.includes("next.js")
  ) {
    return {
      recommendedRole: "Creative UI/UX & Frontend Architect",
      careerInsight:
        "Sensitivitas estetika dan keahlian rekayasa visual Anda merupakan aset krusial dalam menciptakan produk yang dicintai pengguna. Targetkan ajang inovasi desain interaksi, UI/UX challenge, serta hackathon produk digital.",
      extractedTags: [
        "UI/UX Design",
        "Next.js",
        "React",
        "Design Thinking",
        "Frontend Architecture",
      ],
      _modelUsed: "heuristic-deterministic",
    };
  }

  // 4. Domain Bisnis / Strategi / Pitching / KTI
  if (
    lower.includes("bisnis") ||
    lower.includes("business") ||
    lower.includes("marketing") ||
    lower.includes("pitch") ||
    lower.includes("kti") ||
    lower.includes("riset") ||
    lower.includes("manajemen") ||
    lower.includes("startup")
  ) {
    return {
      recommendedRole: "Product Strategist & Pitch Lead",
      careerInsight:
        "Kemampuan komunikasi, perumusan ide, dan validasi pasar Anda sangat esensial dalam memimpin arah sebuah tim inovasi. Ambil peran komando dalam kompetisi Business Plan, ajang KTI, dan program inkubasi startup mahasiswa.",
      extractedTags: [
        "Business Strategy",
        "Public Speaking",
        "Karya Tulis Ilmiah (KTI)",
        "Market Validation",
        "Pitching",
      ],
      _modelUsed: "heuristic-deterministic",
    };
  }

  // 5. Default General Software Builder
  return {
    recommendedRole: "Agile Software Engineer & Team Innovator",
    careerInsight:
      "Latar belakang Anda menunjukkan fleksibilitas dan motivasi tinggi untuk bertumbuh. Padukan kemampuan pengembangan perangkat lunak dengan kolaborasi tim multidisiplin untuk bersaing di hackathon dan program beasiswa kepemimpinan.",
    extractedTags: [
      "Web Development",
      "Next.js",
      "Python",
      "Hackathon",
      "Problem Solving",
    ],
    _modelUsed: "heuristic-deterministic",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawStory = body?.story;

    if (!rawStory || typeof rawStory !== "string" || !rawStory.trim()) {
      return NextResponse.json(
        { error: "Cerita diri, minat, atau pengalaman belum diisi." },
        { status: 400 }
      );
    }

    const story = rawStory.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Jalankan via Google GenAI jika API Key tersedia
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah AI Career & Skill Advisor resmi untuk platform "Aplikasi Angkasa" (Platform kurasi peluang lomba, beasiswa, dan seminar untuk mahasiswa).
Analisis cerita diri, minat, pengalaman, dan latar belakang pengguna berikut secara profesional, tajam, dan memotivasi:

NARASI PENGGUNA:
"""
${story}
"""

Tugas Anda:
1. "recommendedRole": Berikan 1 nama peran kompetisi atau fokus karier spesifik yang paling pas (contoh: "AI Security & Full-Stack Builder", "Product Strategist & Pitch Lead", "Data Science & ML Specialist", dll).
2. "careerInsight": Tulis 2 hingga 3 kalimat arahan konkret, memotivasi, dan bernas mengenai keunggulan kompetitif pengguna serta strategi peluang (lomba/beasiswa) yang paling tepat untuk diikuti.
3. "extractedTags": Ekstraksi 4 hingga 6 tag keahlian atau topik minat inti yang paling relevan (misal: ["Cybersecurity", "Python", "Next.js", "AI Engineering", "Hackathon"]).

ATURAN KETAT:
- DILARANG menggunakan emoji apapun dalam output teks.
- Gunakan bahasa Indonesia baku dan terstruktur rapi.`;

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
                  recommendedRole: {
                    type: Type.STRING,
                    description: "Rekomendasi nama peran atau fokus karier kompetisi",
                  },
                  careerInsight: {
                    type: Type.STRING,
                    description: "2-3 kalimat arahan strategis mengenai kekuatan dan peluang yang cocok",
                  },
                  extractedTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4-6 tag keahlian/topik minat terdeteksi",
                  },
                },
                required: ["recommendedRole", "careerInsight", "extractedTags"],
              },
            },
          });

          const rawText = response.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (
              parsed.recommendedRole &&
              parsed.careerInsight &&
              Array.isArray(parsed.extractedTags) &&
              parsed.extractedTags.length > 0
            ) {
              const result: ProfileInsightResult = {
                recommendedRole: String(parsed.recommendedRole).trim(),
                careerInsight: String(parsed.careerInsight).trim(),
                extractedTags: parsed.extractedTags.map((t: any) => String(t).trim()),
                _modelUsed: modelName,
              };
              return NextResponse.json(result);
            }
          }
        } catch (geminiErr: any) {
          console.warn(`[ProfileInsight] Model ${modelName} error:`, geminiErr?.message || geminiErr);
          // Lanjut ke model fallback berikutnya
        }
      }
    }

    // 2. Fallback deterministik cerdas jika offline / timeout / tanpa API key
    const fallbackResult = heuristicProfileInsight(story);
    return NextResponse.json(fallbackResult);
  } catch (err: any) {
    console.error("[ProfileInsight Route Error]", err);
    return NextResponse.json(
      { error: "Gagal memproses insight profil. Silakan coba kembali." },
      { status: 500 }
    );
  }
}
