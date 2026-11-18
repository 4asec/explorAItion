import { supabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mockUserProfile, mockOpportunities, mockTeamRequests } from "@/lib/mockData";
import {
  UserProfile,
  RegisterPayload,
  Opportunity,
  PersonalizedOpportunity,
  RoadmapResponse,
  TeamRequest,
  CreateTeamPayload,
} from "@/types/schema";

/**
 * Cache in-memory lokal untuk bookmark (fallback jika Supabase belum terhubung saat demo)
 */
const localBookmarksCache = new Set<string>();

/**
 * Helper internal untuk format error seragam
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

// =================================================================
// 1. AUTENTIKASI: LOGIN & REGISTER (P1)
// =================================================================

/**
 * Login pengguna dengan Email dan Password via Supabase Auth
 */
export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<{ user: any; profile: UserProfile }>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = "Email atau kata sandi tidak sesuai. Silakan periksa kembali.";
        if (error.message.toLowerCase().includes("email not confirmed")) {
          msg = "Email belum dikonfirmasi. Silakan periksa inbox email Anda.";
        }
        return { data: null, error: msg };
      }

      if (data.user) {
        const { data: profile, error: profileErr } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          return { data: { user: data.user, profile: profile as UserProfile }, error: null };
        }

        // Jika profile row belum ada, buatkan draf dasar
        const fallbackProfile: UserProfile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || email.split("@")[0],
          email: data.user.email || email,
          username: email.split("@")[0],
          institution: "Perguruan Tinggi",
          birth_date: "2004-01-01",
          education_level: "Mahasiswa",
          province: "Indonesia",
          city: "Indonesia",
          skills: [],
          interests: [],
          talents: "",
        };

        return { data: { user: data.user, profile: fallbackProfile }, error: null };
      }
    }

    // Fallback Mock Demo Mode jika Supabase tidak terkonfigurasi
    if (email === "demo@angkasa.id" || email.includes("demo")) {
      return {
        data: {
          user: { id: mockUserProfile.id, email: mockUserProfile.email },
          profile: mockUserProfile,
        },
        error: null,
      };
    }

    const demoProfile: UserProfile = {
      id: `user-sim-${Date.now()}`,
      full_name: email.split("@")[0],
      email,
      username: email.split("@")[0],
      institution: "Politeknik Negeri Malang",
      birth_date: "2004-05-12",
      education_level: "D4 Teknik Informatika",
      province: "Jawa Timur",
      city: "Kota Malang",
      skills: ["React", "TypeScript", "Tailwind CSS"],
      interests: ["Artificial Intelligence", "Web Development"],
      talents: "Creative Problem Solving",
    };

    return {
      data: {
        user: { id: demoProfile.id, email: demoProfile.email },
        profile: demoProfile,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: "Terjadi gangguan koneksi saat proses login." };
  }
}

/**
 * Pendaftaran akun baru + otomatis insert ke tabel `profiles`
 */
export async function registerUser(
  payload: RegisterPayload
): Promise<ApiResponse<{ user: any; profile: UserProfile }>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: payload.email,
        password: payload.password || "angkasa2026",
      });

      if (error) {
        let msg = `Gagal mendaftar: ${error.message}`;
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("duplicate")
        ) {
          msg = "Email ini sudah terdaftar. Silakan langsung login.";
        }
        return { data: null, error: msg };
      }

      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          full_name: payload.full_name,
          email: payload.email,
          username: payload.username,
          institution: payload.institution,
          birth_date: payload.birth_date,
          education_level: payload.education_level,
          province: payload.province,
          city: payload.city,
          skills: [],
          interests: [],
          talents: "",
        };

        const { error: profileErr } = await supabaseClient
          .from("profiles")
          .insert(newProfile);

        if (profileErr) {
          console.warn("[Register Profile Insert Warning]", profileErr.message);
        }

        return { data: { user: data.user, profile: newProfile }, error: null };
      }
    }

    // Fallback Mock Mode
    const mockCreatedProfile: UserProfile = {
      id: `user-${Date.now()}`,
      full_name: payload.full_name,
      email: payload.email,
      username: payload.username,
      institution: payload.institution,
      birth_date: payload.birth_date,
      education_level: payload.education_level,
      province: payload.province,
      city: payload.city,
      skills: [],
      interests: [],
      talents: "",
    };

    return {
      data: {
        user: { id: mockCreatedProfile.id, email: mockCreatedProfile.email },
        profile: mockCreatedProfile,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: "Terjadi gangguan koneksi saat proses registrasi." };
  }
}

/**
 * 1-Klik Login Demo User (demo@angkasa.id / angkasa2026)
 */
export async function loginDemoUser(): Promise<ApiResponse<{ user: any; profile: UserProfile }>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: "demo@angkasa.id",
        password: "angkasa2026",
      });

      if (!error && data.user) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          return {
            data: { user: data.user, profile: profile as UserProfile },
            error: null,
          };
        }
      }
    }

    // Jika akun demo belum ada di auth Supabase atau sedang offline, gunakan mockUserProfile
    return {
      data: {
        user: { id: mockUserProfile.id, email: mockUserProfile.email },
        profile: mockUserProfile,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: {
        user: { id: mockUserProfile.id, email: mockUserProfile.email },
        profile: mockUserProfile,
      },
      error: null,
    };
  }
}

/**
 * Logout pengguna
 */
export async function logoutUser(): Promise<{ success: boolean; error: string | null }> {
  try {
    if (isSupabaseConfigured) {
      await supabaseClient.auth.signOut();
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal mengakhiri sesi pengguna." };
  }
}

// =================================================================
// 2. PROFILING MINAT & BAKAT (P2)
// =================================================================

/**
 * Memperbarui data keahlian, minat, dan bakat pengguna
 */
export async function updateUserProfile(
  userId: string,
  updates: { skills: string[]; interests: string[]; talents: string }
): Promise<ApiResponse<UserProfile>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from("profiles")
        .update({
          skills: updates.skills,
          interests: updates.interests,
          talents: updates.talents,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: `Gagal menyimpan profil: ${error.message}` };
      }

      return { data: data as UserProfile, error: null };
    }

    // Mock fallback
    const updatedMock: UserProfile = {
      ...mockUserProfile,
      id: userId,
      skills: updates.skills,
      interests: updates.interests,
      talents: updates.talents,
    };

    return { data: updatedMock, error: null };
  } catch (err) {
    return { data: null, error: "Terjadi kegagalan saat menyimpan data profil." };
  }
}

// =================================================================
// 3. AI PERSONALIZED FEED (P3)
// =================================================================

/**
 * Mengambil daftar rekomendasi peluang terpersonalisasi AI via POST /api/feed
 */
export async function fetchPersonalizedFeed(
  userProfile: UserProfile
): Promise<ApiResponse<PersonalizedOpportunity[]>> {
  try {
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Gagal memuat rekomendasi peluang dari sistem AI.",
      };
    }

    return { data: json as PersonalizedOpportunity[], error: null };
  } catch (err) {
    console.warn("[fetchPersonalizedFeed Network Warning]", err);
    // Fallback darurat jika jaringan fetch putus
    const emergencyList: PersonalizedOpportunity[] = mockOpportunities.map((o, idx) => ({
      ...o,
      matchPercentage: 95 - idx * 2,
      recommendationReason: `Peluang kategori ${o.category} ini relevan dengan latar belakang pendidikan dan keahlian Anda.`,
    }));

    return { data: emergencyList, error: null };
  }
}

// =================================================================
// 4. AI PREPARATION ROADMAP (P5)
// =================================================================

/**
 * Menghasilkan roadmap persiapan berstruktur via POST /api/roadmap
 */
export async function fetchPreparationRoadmap(
  userProfile: UserProfile,
  opportunity: Opportunity
): Promise<ApiResponse<RoadmapResponse>> {
  try {
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile, opportunity }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Gagal menyusun panduan roadmap persiapan.",
      };
    }

    return { data: json as RoadmapResponse, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Gagal terhubung ke layanan AI Roadmap. Periksa koneksi internet Anda.",
    };
  }
}

// =================================================================
// 5. BOOKMARKS (P7)
// =================================================================

/**
 * Mengambil daftar opportunityId yang dibookmark oleh pengguna
 */
export async function getUserBookmarks(userId: string): Promise<ApiResponse<string[]>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from("bookmarks")
        .select("opportunity_id")
        .eq("user_id", userId);

      if (!error && Array.isArray(data)) {
        const ids = data.map((b: { opportunity_id: string }) => b.opportunity_id);
        return { data: ids, error: null };
      }
    }

    // Fallback local memory
    return { data: Array.from(localBookmarksCache), error: null };
  } catch (err) {
    return { data: Array.from(localBookmarksCache), error: null };
  }
}

/**
 * Menyimpan atau menghapus bookmark (Toggle)
 */
export async function toggleBookmark(
  userId: string,
  opportunityId: string
): Promise<{ isBookmarked: boolean; error: string | null }> {
  try {
    if (isSupabaseConfigured) {
      // Periksa apakah bookmark sudah ada
      const { data: existing, error: checkErr } = await supabaseClient
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

      if (existing) {
        // Hapus bookmark
        const { error: delErr } = await supabaseClient
          .from("bookmarks")
          .delete()
          .eq("id", existing.id);

        if (delErr) {
          return { isBookmarked: true, error: "Gagal mencabut bookmark." };
        }
        localBookmarksCache.delete(opportunityId);
        return { isBookmarked: false, error: null };
      } else {
        // Tambahkan bookmark
        const { error: insErr } = await supabaseClient
          .from("bookmarks")
          .insert({ user_id: userId, opportunity_id: opportunityId });

        if (insErr) {
          return { isBookmarked: false, error: "Gagal menyimpan bookmark." };
        }
        localBookmarksCache.add(opportunityId);
        return { isBookmarked: true, error: null };
      }
    }

    // Toggle Fallback Mode
    if (localBookmarksCache.has(opportunityId)) {
      localBookmarksCache.delete(opportunityId);
      return { isBookmarked: false, error: null };
    } else {
      localBookmarksCache.add(opportunityId);
      return { isBookmarked: true, error: null };
    }
  } catch (err: any) {
    return { isBookmarked: false, error: "Terjadi kesalahan saat memproses bookmark." };
  }
}

// =================================================================
// 6. TEAM FINDING ANTI-DUPLIKASI (P6)
// =================================================================

/**
 * Mengambil daftar lowongan tim kolaborasi pada kompetisi tertentu
 */
export async function getTeamRequests(
  opportunityId: string
): Promise<ApiResponse<TeamRequest[]>> {
  try {
    const res = await fetch(`/api/team?opportunityId=${encodeURIComponent(opportunityId)}`);
    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Gagal mengambil daftar tim kolaborasi.",
      };
    }

    return { data: json as TeamRequest[], error: null };
  } catch (err) {
    const fallbackList = mockTeamRequests.filter((t) => t.opportunity_id === opportunityId);
    return { data: fallbackList, error: null };
  }
}

/**
 * Membuat pendaftaran tim baru untuk kompetisi tertentu
 */
export async function createTeamRequest(
  payload: CreateTeamPayload
): Promise<ApiResponse<TeamRequest>> {
  try {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        ...payload,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Gagal membuat tim baru.",
      };
    }

    return {
      data: json.data as TeamRequest,
      message: json.message || "Tim berhasil dibuat.",
      error: null,
    };
  } catch (err) {
    return { data: null, error: "Terjadi kesalahan koneksi saat membuat tim baru." };
  }
}

/**
 * Mengirim permintaan kolaborasi/ajakan tim dengan proteksi anti-duplikasi (Error 409)
 */
export async function sendTeamInvite(
  opportunityId: string,
  teamRequestId: string,
  senderId: string,
  options?: {
    applicant_name?: string;
    role_applied?: string;
    message?: string;
  }
): Promise<{ success: boolean; message: string; error: string | null }> {
  try {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite",
        opportunity_id: opportunityId,
        team_request_id: teamRequestId,
        applicant_id: senderId,
        applicant_name: options?.applicant_name || "Pemohon Kolaborasi",
        role_applied: options?.role_applied || "Anggota Tim",
        message: options?.message || "",
      }),
    });

    const json = await res.json();

    if (res.status === 409) {
      return {
        success: false,
        message: "",
        error:
          json.error ||
          "Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: "",
        error: json.error || "Gagal mengirimkan permintaan kolaborasi.",
      };
    }

    return {
      success: true,
      message: json.message || "Permintaan kolaborasi berhasil dikirimkan.",
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      message: "",
      error: "Terjadi gangguan koneksi saat mengirim permintaan kolaborasi.",
    };
  }
}
