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
  TeamInvite,
  OpportunityVerificationResult,
  ProfileInsightResult,
} from "@/types/schema";
import {
  validateProfileInput,
  validateCreateTeamInput,
  validateOpportunityInput,
  validateTeamInviteInput,
  sanitizeText,
  sanitizeStringArray,
} from "@/lib/validation";

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
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          // Normalisasi field profiling jika masih ada data legacy
          const normalizedProfile: UserProfile = {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            username: profile.username,
            institution: profile.institution,
            birth_date: profile.birth_date,
            education_level: profile.education_level,
            province: profile.province,
            city: profile.city,
            profiling: Array.isArray(profile.profiling) ? profile.profiling : [],
            role: profile.role || "user",
          };

          if (typeof document !== "undefined") {
            document.cookie = `angkasa_role=${normalizedProfile.role}; path=/; max-age=86400; SameSite=Lax`;
          }

          return { data: { user: data.user, profile: normalizedProfile }, error: null };
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
          profiling: [],
          role: "user",
        };

        if (typeof document !== "undefined") {
          document.cookie = `angkasa_role=user; path=/; max-age=86400; SameSite=Lax`;
        }

        return { data: { user: data.user, profile: fallbackProfile }, error: null };
      }
    }

    // Fallback Mock Demo Mode jika Supabase tidak terkonfigurasi
    if (
      email === "dummy123@gmail.com" ||
      email === "demo@angkasa.id" ||
      email.includes("demo")
    ) {
      if (typeof document !== "undefined") {
        document.cookie = `angkasa_role=user; path=/; max-age=86400; SameSite=Lax`;
      }
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
      profiling: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Artificial Intelligence",
        "Web Development",
        "Creative Problem Solving",
      ],
      role: "user",
    };

    if (typeof document !== "undefined") {
      document.cookie = `angkasa_role=user; path=/; max-age=86400; SameSite=Lax`;
    }

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
          profiling: [],
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
      profiling: [],
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
 * 1-Klik Login Demo User (dummy123@gmail.com / dummy123)
 */
export async function loginDemoUser(): Promise<ApiResponse<{ user: any; profile: UserProfile }>> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: "dummy123@gmail.com",
        password: "dummy123",
      });

      if (!error && data.user) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          const loadedProfile: UserProfile = {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            username: profile.username,
            institution: profile.institution,
            birth_date: profile.birth_date,
            education_level: profile.education_level,
            province: profile.province,
            city: profile.city,
            profiling: Array.isArray(profile.profiling) ? profile.profiling : mockUserProfile.profiling,
            role: profile.role || "user",
          };

          if (typeof document !== "undefined") {
            document.cookie = `angkasa_role=${loadedProfile.role}; path=/; max-age=86400; SameSite=Lax`;
          }

          return {
            data: { user: data.user, profile: loadedProfile },
            error: null,
          };
        }
      }
    }

    if (typeof document !== "undefined") {
      document.cookie = `angkasa_role=user; path=/; max-age=86400; SameSite=Lax`;
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
    if (typeof document !== "undefined") {
      document.cookie = `angkasa_role=user; path=/; max-age=86400; SameSite=Lax`;
    }
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
    if (typeof document !== "undefined") {
      document.cookie = "angkasa_role=; path=/; max-age=0";
      document.cookie = "angkasa_admin_session=; path=/; max-age=0";
    }
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
 * Helper untuk invalidasi cache session feed saat profil diperbarui
 */
function invalidateUserFeedCache(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(`angkasa_feed_${userId}`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (e) {
    console.warn("[Cache Invalidation Warning]", e);
  }
}

/**
 * Memperbarui data profil pengguna (identitas akademik, username, avatar, atau tag profiling)
 */
export async function updateUserProfile(
  userId: string,
  updates: string[] | Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    // Normalisasi input jika berupa array tags profiling
    const updateObj: Partial<UserProfile> = Array.isArray(updates)
      ? { profiling: updates }
      : (updates as Partial<UserProfile>);

    // Validasi dan sanitasi input form profil
    const validation = validateProfileInput(updateObj);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || "Data profil tidak valid.";
      return { data: null, error: firstError };
    }

    const cleanData = validation.data;

    // Pengecekan bentrok username unik jika username diubah
    if (isSupabaseConfigured && cleanData.username) {
      try {
        const { data: existingUser } = await supabaseClient
          .from("profiles")
          .select("id, username")
          .eq("username", cleanData.username)
          .neq("id", userId)
          .maybeSingle();

        if (existingUser) {
          return {
            data: null,
            error: `Username @${cleanData.username} sudah digunakan oleh pengguna lain. Silakan pilih username lain.`,
          };
        }
      } catch (checkErr) {
        console.warn("[Username Check Warning]", checkErr);
      }
    }

    // Invalidate feed cache jika profiling minat diubah
    if (cleanData.profiling) {
      invalidateUserFeedCache(userId);
    }

    let updatedProfile: UserProfile | null = null;

    if (isSupabaseConfigured) {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (cleanData.full_name !== undefined) updatePayload.full_name = cleanData.full_name;
      if (cleanData.username !== undefined) updatePayload.username = cleanData.username;
      if (cleanData.institution !== undefined) updatePayload.institution = cleanData.institution;
      if (cleanData.education_level !== undefined) updatePayload.education_level = cleanData.education_level;
      if (cleanData.province !== undefined) updatePayload.province = cleanData.province;
      if (cleanData.city !== undefined) updatePayload.city = cleanData.city;
      if (cleanData.birth_date !== undefined) updatePayload.birth_date = cleanData.birth_date;
      if (cleanData.avatar_url !== undefined) updatePayload.avatar_url = cleanData.avatar_url;
      if (cleanData.profiling !== undefined) updatePayload.profiling = cleanData.profiling;

      const { data, error } = await supabaseClient
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: `Gagal menyimpan profil: ${error.message}` };
      }

      updatedProfile = data as UserProfile;
    }

    // Mock / Local Fallback jika Supabase belum terhubung
    if (!updatedProfile) {
      let currentMock = mockUserProfile;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("angkasa_user_profile") || localStorage.getItem("angkasa_active_session");
          if (raw) currentMock = { ...currentMock, ...JSON.parse(raw) };
        } catch {}
      }
      updatedProfile = {
        ...currentMock,
        ...cleanData,
        id: userId,
      } as UserProfile;
    }

    // Sinkronisasi ke localStorage & sessionStorage agar perubahan langsung aktif di seluruh aplikasi
    if (typeof window !== "undefined" && updatedProfile) {
      try {
        const rawSession = localStorage.getItem("angkasa_active_session");
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          localStorage.setItem("angkasa_active_session", JSON.stringify({ ...parsed, ...updatedProfile }));
        }
        localStorage.setItem("angkasa_user_profile", JSON.stringify(updatedProfile));
        sessionStorage.setItem("angkasa_user_profile", JSON.stringify(updatedProfile));
      } catch (storageErr) {
        console.warn("[Local Storage Profile Sync Warning]", storageErr);
      }
    }

    return { data: updatedProfile, error: null };
  } catch (err) {
    return { data: null, error: "Terjadi kegagalan saat menyimpan data profil." };
  }
}

/**
 * Mengunggah foto profil pengguna ke Supabase Storage bucket 'avatars'
 * dengan validasi ketat MIME type dan ukuran maksimal 2 MB
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<ApiResponse<string>> {
  try {
    // 1. Validasi ketat sisi klien
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        data: null,
        error: "Format file tidak didukung. Harap unggah gambar berformat JPEG, PNG, atau WebP.",
      };
    }

    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE_BYTES) {
      return {
        data: null,
        error: "Ukuran gambar terlalu besar (maksimal 2 MB). Silakan pilih foto lain atau perkecil ukurannya.",
      };
    }

    let avatarPublicUrl = "";

    // 2. Upayakan upload ke Supabase Storage bucket 'avatars'
    if (isSupabaseConfigured) {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "image/png" ? "png" : "jpg");
        const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

        const { data, error } = await supabaseClient.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });

        if (!error && data) {
          const { data: urlData } = supabaseClient.storage
            .from("avatars")
            .getPublicUrl(data.path);

          if (urlData?.publicUrl) {
            avatarPublicUrl = urlData.publicUrl;
          }
        } else if (error) {
          console.warn("[Supabase Storage Avatar Upload Warning]", error);
        }
      } catch (storageErr) {
        console.warn("[uploadUserAvatar Storage Remote Error]", storageErr);
      }
    }

    // 3. Fallback jika Supabase storage belum terhubung: kompresi/konversi base64 Data URL
    if (!avatarPublicUrl) {
      try {
        avatarPublicUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch {
        return {
          data: null,
          error: "Gagal memproses file gambar avatar.",
        };
      }
    }

    // 4. Update kolom avatar_url di tabel profiles Supabase
    if (isSupabaseConfigured && avatarPublicUrl.startsWith("http")) {
      try {
        await supabaseClient
          .from("profiles")
          .update({
            avatar_url: avatarPublicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch (e) {
        console.warn("[Remote Profile avatar_url Update Warning]", e);
      }
    }

    // 5. Update local storage & session
    if (typeof window !== "undefined") {
      try {
        const rawSession = localStorage.getItem("angkasa_active_session");
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          parsed.avatar_url = avatarPublicUrl;
          localStorage.setItem("angkasa_active_session", JSON.stringify(parsed));
        }
        const rawProfile = localStorage.getItem("angkasa_user_profile");
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          parsed.avatar_url = avatarPublicUrl;
          localStorage.setItem("angkasa_user_profile", JSON.stringify(parsed));
          sessionStorage.setItem("angkasa_user_profile", JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn("[Local Storage Avatar Sync Warning]", e);
      }
    }

    return {
      data: avatarPublicUrl,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: "Terjadi gangguan sistem saat mengunggah foto profil.",
    };
  }
}

/**
 * Mengirim narasi cerita diri untuk dianalisis oleh AI Career & Skill Advisor (P2)
 */
export async function fetchProfileInsight(
  story: string
): Promise<ApiResponse<ProfileInsightResult>> {
  try {
    const res = await fetch("/api/profile-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: json.error || "Gagal mendapatkan insight profil dari AI.",
      };
    }

    return {
      data: json as ProfileInsightResult,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: "Terjadi gangguan koneksi saat menghubungi AI Career Advisor.",
    };
  }
}

// =================================================================
// 3. AI PERSONALIZED FEED (P3) DENGAN SESSION STORAGE CACHING
// =================================================================

/**
 * Mengambil daftar rekomendasi peluang terpersonalisasi AI via POST /api/feed
 * Dilengkapi caching sessionStorage berdasarkan ID & tag profiling
 */
export async function fetchPersonalizedFeed(
  userProfile: UserProfile
): Promise<ApiResponse<PersonalizedOpportunity[]>> {
  const profilingHash = (userProfile.profiling || []).slice().sort().join(",");
  const cacheKey = `angkasa_feed_${userProfile.id}_${profilingHash}`;

  // 1. Periksa cache sessionStorage jika tersedia
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { data: parsed as PersonalizedOpportunity[], error: null };
        }
      }
    } catch (e) {
      console.warn("[Feed Cache Read Warning]", e);
    }
  }

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

    const data = json as PersonalizedOpportunity[];

    // Gabungkan dengan peluang kurator yang sudah berstatus verified (is_verified: true)
    const manualVerified = getStoredManualOpportunities().filter((o) => o.is_verified);
    const existingIds = new Set(data.map((d) => d.id));
    const mergedData = [...data];

    for (const mo of manualVerified) {
      if (!existingIds.has(mo.id)) {
        mergedData.unshift({
          ...mo,
          matchPercentage: 92,
          recommendationReason: `Peluang kategori ${mo.category} ini telah diverifikasi kurator dan sangat selaras dengan kualifikasi profil Anda.`,
        });
      }
    }

    // Simpan ke cache sessionStorage
    if (typeof window !== "undefined" && Array.isArray(mergedData)) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(mergedData));
      } catch (e) {
        console.warn("[Feed Cache Write Warning]", e);
      }
    }

    return { data: mergedData, error: null };
  } catch (err) {
    console.warn("[fetchPersonalizedFeed Network Warning]", err);
    // Fallback darurat jika jaringan fetch putus
    const manualVerified = getStoredManualOpportunities().filter((o) => o.is_verified);
    const emergencyList: PersonalizedOpportunity[] = [
      ...manualVerified.map((o) => ({
        ...o,
        matchPercentage: 92,
        recommendationReason: `Peluang kategori ${o.category} ini telah diverifikasi kurator dan selaras dengan profil Anda.`,
      })),
      ...mockOpportunities.map((o, idx) => ({
        ...o,
        matchPercentage: 95 - idx * 2,
        recommendationReason: `Sangat selaras dengan keahlian Anda di bidang ${o.category}.`,
      })),
    ];

    return { data: emergencyList, error: null };
  }
}

// =================================================================
// 4. AI PREPARATION ROADMAP (P5) DENGAN SESSION STORAGE CACHING
// =================================================================

/**
 * Menghasilkan roadmap persiapan berstruktur via POST /api/roadmap
 * Mendukung pemanggilan fleksibel (userProfile, opportunity) maupun (opportunity, userProfile)
 * Dilengkapi caching sessionStorage berdasarkan ID user & ID peluang
 */
export async function fetchPreparationRoadmap(
  arg1: UserProfile | Opportunity,
  arg2: Opportunity | UserProfile
): Promise<ApiResponse<RoadmapResponse>> {
  let userProfile: UserProfile;
  let opportunity: Opportunity;

  if ("profiling" in arg1 || "email" in arg1) {
    userProfile = arg1 as UserProfile;
    opportunity = arg2 as Opportunity;
  } else {
    opportunity = arg1 as Opportunity;
    userProfile = arg2 as UserProfile;
  }

  const cacheKey = `angkasa_roadmap_${userProfile.id}_${opportunity.id}`;

  // 1. Periksa cache sessionStorage jika tersedia
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.timeline)) {
          return { data: parsed as RoadmapResponse, error: null };
        }
      }
    } catch (e) {
      console.warn("[Roadmap Cache Read Warning]", e);
    }
  }

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

    const data = json as RoadmapResponse;

    // Simpan ke cache sessionStorage
    if (typeof window !== "undefined" && data) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn("[Roadmap Cache Write Warning]", e);
      }
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: "Gagal terhubung ke layanan AI Roadmap. Periksa koneksi internet Anda.",
    };
  }
}

// =================================================================
// 5. BOOKMARKS (P7) DENGAN PERSISTENSI SUPABASE & LOCALSTORAGE
// =================================================================

/**
 * Helper penyimpanan bookmark per-user di localStorage
 */
function getStorageBookmarks(userId: string): string[] {
  if (typeof window === "undefined") return Array.from(localBookmarksCache);
  try {
    const stored = localStorage.getItem(`angkasa_bookmarks_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("[Storage Bookmarks Read Error]", e);
  }
  return Array.from(localBookmarksCache);
}

function setStorageBookmarks(userId: string, ids: string[]): void {
  ids.forEach((id) => localBookmarksCache.add(id));
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`angkasa_bookmarks_${userId}`, JSON.stringify(ids));
  } catch (e) {
    console.warn("[Storage Bookmarks Write Error]", e);
  }
}

/**
 * Mengambil daftar opportunityId yang dibookmark oleh pengguna
 */
export async function getUserBookmarks(userId: string): Promise<ApiResponse<string[]>> {
  const localList = getStorageBookmarks(userId);

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from("bookmarks")
        .select("opportunity_id")
        .eq("user_id", userId);

      if (!error && Array.isArray(data)) {
        const ids = data.map((b: { opportunity_id: string }) => b.opportunity_id);
        setStorageBookmarks(userId, ids);
        return { data: ids, error: null };
      }
    }

    return { data: localList, error: null };
  } catch (err) {
    return { data: localList, error: null };
  }
}

/**
 * Menyimpan atau menghapus bookmark (Toggle)
 */
export async function toggleBookmark(
  userId: string,
  opportunityId: string
): Promise<{ isBookmarked: boolean; error: string | null }> {
  const currentList = getStorageBookmarks(userId);
  const alreadyBookmarked = currentList.includes(opportunityId);

  try {
    if (isSupabaseConfigured) {
      const { data: existing } = await supabaseClient
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
          console.warn("[Bookmark Delete Remote Warning]", delErr.message);
        }

        const nextList = currentList.filter((id) => id !== opportunityId);
        setStorageBookmarks(userId, nextList);
        localBookmarksCache.delete(opportunityId);
        return { isBookmarked: false, error: null };
      } else {
        // Tambahkan bookmark
        const { error: insErr } = await supabaseClient
          .from("bookmarks")
          .insert({ user_id: userId, opportunity_id: opportunityId });

        if (insErr) {
          console.warn("[Bookmark Insert Remote Warning]", insErr.message);
        }

        const nextList = Array.from(new Set([...currentList, opportunityId]));
        setStorageBookmarks(userId, nextList);
        localBookmarksCache.add(opportunityId);
        return { isBookmarked: true, error: null };
      }
    }

    // Fallback mode menggunakan localStorage per-user
    if (alreadyBookmarked) {
      const nextList = currentList.filter((id) => id !== opportunityId);
      setStorageBookmarks(userId, nextList);
      localBookmarksCache.delete(opportunityId);
      return { isBookmarked: false, error: null };
    } else {
      const nextList = Array.from(new Set([...currentList, opportunityId]));
      setStorageBookmarks(userId, nextList);
      localBookmarksCache.add(opportunityId);
      return { isBookmarked: true, error: null };
    }
  } catch (err: any) {
    // Tangani offline fallback agar UI tidak pernah crash
    const nextList = alreadyBookmarked
      ? currentList.filter((id) => id !== opportunityId)
      : Array.from(new Set([...currentList, opportunityId]));
    setStorageBookmarks(userId, nextList);
    return { isBookmarked: !alreadyBookmarked, error: null };
  }
}

// =================================================================
// 6. TEAM FINDING ANTI-DUPLIKASI (P6)
// =================================================================

const CUSTOM_TEAMS_STORAGE_KEY = "angkasa_custom_team_requests";

/**
 * Helper penyimpanan tim lokal kustom
 */
export function getStoredCustomTeamRequests(): TeamRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEAMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("[Stored Custom Teams Read Error]", e);
  }
  return [];
}

export function saveStoredCustomTeamRequests(teams: TeamRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_TEAMS_STORAGE_KEY, JSON.stringify(teams));
  } catch (e) {
    console.warn("[Stored Custom Teams Write Error]", e);
  }
}

/**
 * Mengambil daftar lowongan tim kolaborasi pada kompetisi tertentu
 */
export async function getTeamRequests(
  opportunityId: string
): Promise<ApiResponse<TeamRequest[]>> {
  try {
    const customTeams = getStoredCustomTeamRequests().filter(
      (t) => t.opportunity_id === opportunityId
    );
    const mockTeams = mockTeamRequests.filter((t) => t.opportunity_id === opportunityId);

    if (isSupabaseConfigured) {
      // 1. Ambil data team_requests secara langsung tanpa nested join profiles(...)
      const { data, error } = await supabaseClient
        .from("team_requests")
        .select("*")
        .eq("opportunity_id", opportunityId);

      if (!error && Array.isArray(data)) {
        // 2. Ambil profiles secara terpisah untuk userIds (creator_id) dengan .in('id', userIds)
        const userIds = Array.from(
          new Set(data.map((t: any) => t.creator_id).filter(Boolean))
        );

        const profileMap = new Map<string, { full_name: string; username: string }>();
        if (userIds.length > 0) {
          try {
            const { data: profileList } = await supabaseClient
              .from("profiles")
              .select("id, full_name, username")
              .in("id", userIds);

            if (profileList && Array.isArray(profileList)) {
              profileList.forEach((p: any) => {
                profileMap.set(p.id, {
                  full_name: p.full_name,
                  username: p.username,
                });
              });
            }
          } catch (profErr) {
            console.warn("[Profiles Fetch in getTeamRequests Warning]", profErr);
          }
        }

        const teamMap = new Map<string, TeamRequest>();

        // 3. Masukkan data Supabase dengan pemetaan nama profil dan fallback "Peserta Angkasa"
        data.forEach((t: any) => {
          const prof = profileMap.get(t.creator_id);
          const creatorName =
            prof?.full_name?.trim() ||
            t.creator_name?.trim() ||
            "Peserta Angkasa";

          teamMap.set(t.id, {
            ...t,
            creator_name: creatorName,
          });
        });

        // 4. Masukkan tim buatan lokal
        customTeams.forEach((t) => {
          teamMap.set(t.id, {
            ...t,
            creator_name: t.creator_name?.trim() || "Peserta Angkasa",
          });
        });

        // 5. Masukkan mock jika belum ada
        mockTeams.forEach((t) => {
          if (!teamMap.has(t.id)) {
            teamMap.set(t.id, {
              ...t,
              creator_name: t.creator_name?.trim() || "Peserta Angkasa",
            });
          }
        });

        return { data: Array.from(teamMap.values()), error: null };
      } else if (error) {
        console.warn("[getTeamRequests Supabase Warning]", error.message);
      }
    }

    // Fallback: Gabungkan custom teams dan mock
    const teamMap = new Map<string, TeamRequest>();
    mockTeams.forEach((t) =>
      teamMap.set(t.id, {
        ...t,
        creator_name: t.creator_name?.trim() || "Peserta Angkasa",
      })
    );
    customTeams.forEach((t) =>
      teamMap.set(t.id, {
        ...t,
        creator_name: t.creator_name?.trim() || "Peserta Angkasa",
      })
    );

    return { data: Array.from(teamMap.values()), error: null };
  } catch (err) {
    const fallbackList = mockTeamRequests.filter((t) => t.opportunity_id === opportunityId);
    return { data: fallbackList, error: null };
  }
}

export const fetchTeamRequestsByOpportunity = getTeamRequests;

/**
 * Membuat pendaftaran tim baru untuk kompetisi tertentu
 */
export async function createTeamRequest(
  payload: CreateTeamPayload
): Promise<ApiResponse<TeamRequest>> {
  try {
    const validation = validateCreateTeamInput(payload);
    if (!validation.valid) {
      return {
        data: null,
        error: Object.values(validation.errors)[0] || "Data pendaftaran tim tidak valid.",
      };
    }
    const clean = validation.data;

    let creatorId = clean.creator_id?.trim();
    let creatorName = clean.creator_name?.trim();

    if (!creatorId && isSupabaseConfigured) {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        if (authData?.user?.id) {
          creatorId = authData.user.id;
        }
      } catch (authErr) {
        console.warn("[createTeamRequest auth.getUser Warning]", authErr);
      }
    }

    if (!creatorId && typeof window !== "undefined") {
      try {
        const raw =
          sessionStorage.getItem("angkasa_user_profile") ||
          localStorage.getItem("angkasa_user_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id) creatorId = parsed.id;
        }
      } catch {}
    }

    if (!creatorId) {
      creatorId = `user-${Date.now()}`;
    }

    if (!creatorName || creatorName === "Pemohon Kolaborasi") {
      creatorName = "Peserta Angkasa";
    }

    const newTeam: TeamRequest = {
      id: `team-${Date.now()}`,
      opportunity_id: clean.opportunity_id,
      creator_id: creatorId,
      creator_name: creatorName,
      team_name: clean.team_name,
      role_needed: clean.role_needed,
      hasRequested: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      // Pastikan baris minimal ada di profiles agar foreign key tidak memblokir
      try {
        await supabaseClient.from("profiles").upsert(
          {
            id: creatorId,
            full_name: creatorName,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      } catch {}

      const { data, error } = await supabaseClient
        .from("team_requests")
        .insert(newTeam)
        .select()
        .single();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.toLowerCase().includes("unique") ||
          error.message?.toLowerCase().includes("duplicate")
        ) {
          return {
            data: null,
            error: "Anda sudah membuat tim dengan nama atau kriteria yang sama pada kompetisi ini.",
          };
        }
        console.warn("[createTeamRequest Supabase Warning]", error.message);
      } else if (data) {
        newTeam.id = data.id;
      }
    }

    // Simpan ke storage lokal
    const existingCustom = getStoredCustomTeamRequests();
    saveStoredCustomTeamRequests([newTeam, ...existingCustom]);

    // Kirim juga ke API route
    try {
      await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...newTeam,
        }),
      });
    } catch {}

    return {
      data: newTeam,
      message: "Tim berhasil dibuat.",
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err?.message || "Terjadi kesalahan koneksi saat membuat tim baru." };
  }
}

/**
 * Menghapus pendaftaran tim beserta seluruh permohonan tim terkait (Delete Group)
 */
export async function deleteTeamRequest(
  teamRequestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Hapus dari Supabase jika aktif
    if (isSupabaseConfigured) {
      try {
        await supabaseClient
          .from("team_invites")
          .delete()
          .eq("team_request_id", teamRequestId);

        await supabaseClient
          .from("team_requests")
          .delete()
          .eq("id", teamRequestId);
      } catch (err) {
        console.warn("[deleteTeamRequest Supabase Warning]", err);
      }
    }

    // 2. Hapus dari storage lokal tim
    const customTeams = getStoredCustomTeamRequests().filter((t) => t.id !== teamRequestId);
    saveStoredCustomTeamRequests(customTeams);

    // 3. Hapus seluruh invites terkait tim ini dari storage lokal
    const allInvites = getStoredTeamInvites().filter((inv) => inv.team_request_id !== teamRequestId);
    saveStoredTeamInvites(allInvites);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghapus tim." };
  }
}

// =================================================================
// 6.5. TEAM INVITES & MEMBERS (PERSETUJUAN & NOTIFIKASI)
// =================================================================

const TEAM_INVITES_STORAGE_KEY = "angkasa_team_invites";

const INITIAL_TEAM_INVITES: TeamInvite[] = [
  {
    id: "inv-demo-001",
    team_request_id: "team-req-001",
    opportunity_id: "opp-002",
    opportunity_title: "National Business Plan & Fintech Challenge 2026",
    team_name: "Garuda ExplorAI",
    applicant_id: "user-revaldo-003",
    sender_id: "user-revaldo-003",
    receiver_id: "user-iqbal-002",
    applicant_name: "Revaldo Putra",
    role_applied: "Pitch Lead & Business Strategist",
    message: "Tertarik berkolaborasi untuk finalisasi business case dan pitching.",
    status: "accepted",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "inv-demo-002",
    team_request_id: "team-req-002",
    opportunity_id: "opp-001",
    opportunity_title: "Gemini AI Innovation Hackathon 2026",
    team_name: "Nusantara Innovate",
    applicant_id: "a9559a6d-f025-47b0-8203-662f58418699",
    sender_id: "a9559a6d-f025-47b0-8203-662f58418699",
    receiver_id: "user-revaldo-003",
    applicant_name: "Raffa Danendra",
    role_applied: "AI Engineer & Full-Stack",
    message: "Tertarik bergabung untuk mengerjakan integrasi Gemini API & backend.",
    status: "accepted",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "inv-demo-003",
    team_request_id: "team-req-003",
    opportunity_id: "opp-001",
    opportunity_title: "Gemini AI Innovation Hackathon 2026",
    team_name: "CyberAI Guardians",
    applicant_id: "user-fadhil-005",
    sender_id: "user-fadhil-005",
    receiver_id: "a9559a6d-f025-47b0-8203-662f58418699",
    applicant_name: "Ahmad Fadhil",
    role_applied: "Security Researcher & ML Analyst",
    message: "Halo, saya berpengalaman dalam machine learning & deteksi ancaman. Ingin bergabung di tim ini!",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "inv-demo-004",
    team_request_id: "team-req-003",
    opportunity_id: "opp-001",
    opportunity_title: "Gemini AI Innovation Hackathon 2026",
    team_name: "CyberAI Guardians",
    applicant_id: "user-sarah-006",
    sender_id: "user-sarah-006",
    receiver_id: "a9559a6d-f025-47b0-8203-662f58418699",
    applicant_name: "Sarah Alifah",
    role_applied: "UI/UX & Product Design",
    message: "Saya mahasiswi desain grafis, siap bantu wireframe dan prototype interaktif.",
    status: "accepted",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

/**
 * Mengambil seluruh data team invites dari localStorage (dengan seed awal)
 */
export function getStoredTeamInvites(): TeamInvite[] {
  if (typeof window === "undefined") return INITIAL_TEAM_INVITES;
  try {
    const raw = localStorage.getItem(TEAM_INVITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(TEAM_INVITES_STORAGE_KEY, JSON.stringify(INITIAL_TEAM_INVITES));
    return INITIAL_TEAM_INVITES;
  } catch (e) {
    console.warn("[Stored Team Invites Read Error]", e);
    return INITIAL_TEAM_INVITES;
  }
}

/**
 * Menyimpan daftar team invites ke localStorage
 */
export function saveStoredTeamInvites(invites: TeamInvite[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEAM_INVITES_STORAGE_KEY, JSON.stringify(invites));
  } catch (e) {
    console.warn("[Stored Team Invites Write Error]", e);
  }
}

/**
 * Mengambil daftar invite untuk kompetisi tertentu dengan pemetaan nama profil pengirim
 */
export async function getTeamInvitesForOpportunity(opportunityId: string): Promise<TeamInvite[]> {
  const localInvites = getStoredTeamInvites().filter((inv) => inv.opportunity_id === opportunityId);

  if (isSupabaseConfigured) {
    try {
      // 1. Ambil seluruh team_id pada opportunity ini
      const { data: teamList } = await supabaseClient
        .from("team_requests")
        .select("id")
        .eq("opportunity_id", opportunityId);

      const teamIds = (teamList || []).map((t: any) => t.id);

      // 2. Query team_invites yang opportunity_id-nya cocok ATAU team_request_id-nya ada di daftar tim lomba ini
      let query = supabaseClient.from("team_invites").select("*");
      if (teamIds.length > 0) {
        query = query.or(`opportunity_id.eq.${opportunityId},team_request_id.in.(${teamIds.join(",")})`);
      } else {
        query = query.eq("opportunity_id", opportunityId);
      }

      const { data: inviteData, error } = await query;

      if (!error && Array.isArray(inviteData)) {
        // 3. Kumpulkan sender_id yang unik untuk lookup nama ke tabel profiles
        const senderIds = Array.from(
          new Set(
            inviteData
              .map((inv: any) => inv.sender_id || inv.applicant_id)
              .filter(Boolean)
          )
        );

        const profileMap = new Map<string, { full_name: string; username: string }>();
        if (senderIds.length > 0) {
          try {
            const { data: profileList } = await supabaseClient
              .from("profiles")
              .select("id, full_name, username")
              .in("id", senderIds);

            if (profileList) {
              profileList.forEach((p: any) => {
                profileMap.set(p.id, { full_name: p.full_name, username: p.username });
              });
            }
          } catch (profErr) {
            console.warn("[Profiles Fetch Warning]", profErr);
          }
        }

        // 4. Petakan sender_name / applicant_name manual di JavaScript
        const map = new Map<string, TeamInvite>();
        inviteData.forEach((item: any) => {
          const sId = item.sender_id || item.applicant_id;
          const prof = profileMap.get(sId);
          const mappedName =
            prof?.full_name?.trim() ||
            item.applicant_name?.trim() ||
            item.sender_name?.trim() ||
            "Peserta Angkasa";

          map.set(item.id, {
            ...item,
            sender_id: sId,
            applicant_id: sId,
            applicant_name: mappedName,
          });
        });

        // Gabungkan juga dengan localInvites
        localInvites.forEach((item) => {
          if (item.id) map.set(item.id, item);
        });

        return Array.from(map.values());
      }
    } catch (err) {
      console.warn("[getTeamInvitesForOpportunity Supabase Warning]", err);
    }
  }

  return localInvites;
}

/**
 * Merespons permintaan kolaborasi ('accepted' atau 'rejected')
 */
export async function respondToTeamInvite(
  inviteId: string,
  newStatus: "accepted" | "rejected"
): Promise<{ success: boolean; data?: TeamInvite; error?: string }> {
  try {
    const allInvites = getStoredTeamInvites();
    const targetIdx = allInvites.findIndex((inv) => inv.id === inviteId);

    let updated: TeamInvite | undefined;
    if (targetIdx !== -1) {
      updated = { ...allInvites[targetIdx], status: newStatus };
      allInvites[targetIdx] = updated;
      saveStoredTeamInvites(allInvites);
    }

    // Sinkronisasi Supabase jika aktif
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabaseClient
          .from("team_invites")
          .update({ status: newStatus })
          .eq("id", inviteId)
          .select()
          .single();

        if (data && !updated) {
          updated = data as TeamInvite;
        }
      } catch (err) {
        console.warn("[respondToTeamInvite Supabase Warning]", err);
      }
    }

    if (!updated) {
      return { success: false, error: "Permintaan kolaborasi tidak ditemukan." };
    }

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal memperbarui status permintaan tim." };
  }
}

export const updateTeamInviteStatus = respondToTeamInvite;

/**
 * Membatalkan permintaan kolaborasi bagi pelamar (Cancel Request)
 */
export async function cancelTeamInvite(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Hapus dari Supabase jika aktif
    if (isSupabaseConfigured) {
      try {
        await supabaseClient
          .from("team_invites")
          .delete()
          .eq("id", inviteId);
      } catch (err) {
        console.warn("[cancelTeamInvite Supabase Warning]", err);
      }
    }

    // 2. Hapus dari storage lokal
    const allInvites = getStoredTeamInvites().filter((inv) => inv.id !== inviteId);
    saveStoredTeamInvites(allInvites);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal membatalkan permohonan tim." };
  }
}

/**
 * Mengeluarkan anggota tim (Kick Member)
 */
export async function kickTeamMember(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Hapus dari Supabase jika aktif
    if (isSupabaseConfigured) {
      try {
        await supabaseClient
          .from("team_invites")
          .delete()
          .eq("id", inviteId);
      } catch (err) {
        console.warn("[kickTeamMember Supabase Warning]", err);
      }
    }

    // 2. Hapus dari storage lokal
    const allInvites = getStoredTeamInvites().filter((inv) => inv.id !== inviteId);
    saveStoredTeamInvites(allInvites);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal mengeluarkan anggota tim." };
  }
}

/**
 * Mengambil seluruh permintaan tim masuk berstatus 'pending' yang ditujukan kepada tim milik user
 */
export async function getPendingTeamInvitesForCreator(
  creatorId: string,
  knownTeamIds?: string[]
): Promise<TeamInvite[]> {
  try {
    const localInvites = getStoredTeamInvites();
    const customTeams = getStoredCustomTeamRequests().filter((t) => t.creator_id === creatorId);

    // Kumpulkan seluruh team ID milik creator ini
    let creatorTeamIds = knownTeamIds ? [...knownTeamIds] : [];
    if (!creatorTeamIds.length) {
      const allMock = mockTeamRequests.filter((t) => t.creator_id === creatorId);
      creatorTeamIds = [
        ...allMock.map((t) => t.id),
        ...customTeams.map((t) => t.id),
      ];
    }

    if (isSupabaseConfigured) {
      try {
        // Ambil juga tim milik creator dari Supabase jika ada
        const { data: supTeams } = await supabaseClient
          .from("team_requests")
          .select("id")
          .eq("creator_id", creatorId);

        if (supTeams) {
          supTeams.forEach((st: any) => {
            if (!creatorTeamIds.includes(st.id)) creatorTeamIds.push(st.id);
          });
        }

        // Query invites pending yang receiver_id = creatorId ATAU team_request_id ada di tim creator
        let invQuery = supabaseClient
          .from("team_invites")
          .select("*")
          .eq("status", "pending");

        if (creatorTeamIds.length > 0) {
          invQuery = invQuery.or(
            `receiver_id.eq.${creatorId},team_request_id.in.(${creatorTeamIds.join(",")})`
          );
        } else {
          invQuery = invQuery.eq("receiver_id", creatorId);
        }

        const { data: supInvites } = await invQuery;

        if (supInvites && Array.isArray(supInvites)) {
          // Ambil profil pengirim
          const senderIds = Array.from(
            new Set(
              supInvites
                .map((inv: any) => inv.sender_id || inv.applicant_id)
                .filter(Boolean)
            )
          );

          const profileMap = new Map<string, { full_name: string; username: string }>();
          if (senderIds.length > 0) {
            try {
              const { data: profileList } = await supabaseClient
                .from("profiles")
                .select("id, full_name, username")
                .in("id", senderIds);

              if (profileList) {
                profileList.forEach((p: any) => {
                  profileMap.set(p.id, { full_name: p.full_name, username: p.username });
                });
              }
            } catch (profErr) {
              console.warn("[Profiles Fetch Warning]", profErr);
            }
          }

          const map = new Map<string, TeamInvite>();
          supInvites.forEach((item: any) => {
            const sId = item.sender_id || item.applicant_id;
            const prof = profileMap.get(sId);
            const mappedName =
              prof?.full_name?.trim() ||
              item.applicant_name?.trim() ||
              item.sender_name?.trim() ||
              "Peserta Angkasa";

            map.set(item.id, {
              ...item,
              sender_id: sId,
              applicant_id: sId,
              applicant_name: mappedName,
            });
          });

          // Overlay local invites yang cocok
          localInvites.forEach((item) => {
            if (
              item.status === "pending" &&
              (item.receiver_id === creatorId || creatorTeamIds.includes(item.team_request_id))
            ) {
              if (item.id) map.set(item.id, item);
            }
          });

          return Array.from(map.values());
        }
      } catch (err) {
        console.warn("[getPendingTeamInvitesForCreator Supabase Warning]", err);
      }
    }

    // Fallback lokal
    return localInvites.filter((inv) => {
      if (inv.status !== "pending") return false;
      if (inv.receiver_id && inv.receiver_id === creatorId) return true;
      return creatorTeamIds.includes(inv.team_request_id);
    });
  } catch {
    return [];
  }
}

export const fetchIncomingTeamInvites = getPendingTeamInvitesForCreator;

/**
 * Mengirim permintaan kolaborasi/ajakan tim dengan proteksi anti-duplikasi eksplisit
 */
export async function sendTeamInvite(
  opportunityId: string,
  teamRequestId: string,
  senderId?: string,
  options?: {
    applicant_name?: string;
    role_applied?: string;
    message?: string;
    opportunity_title?: string;
    team_name?: string;
    receiver_id?: string;
  }
): Promise<{ success: boolean; message: string; error: string | null }> {
  try {
    const inviteId = `inv-${Date.now()}`;

    // Pastikan sender_id diambil langsung dari sesi supabase.auth.getUser() jika senderId kosong
    let activeSenderId = senderId?.trim();
    if (!activeSenderId && isSupabaseConfigured) {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        if (authData?.user?.id) {
          activeSenderId = authData.user.id;
        }
      } catch (authErr) {
        console.warn("[sendTeamInvite auth.getUser Warning]", authErr);
      }
    }

    if (!activeSenderId && typeof window !== "undefined") {
      try {
        const raw =
          sessionStorage.getItem("angkasa_user_profile") ||
          localStorage.getItem("angkasa_user_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id) activeSenderId = parsed.id;
        }
      } catch {}
    }

    if (!activeSenderId) {
      activeSenderId = `user-${Date.now()}`;
    }

    // Pastikan applicant_name memiliki nilai dengan fallback "Peserta Angkasa"
    let applicantName = options?.applicant_name?.trim();
    if (!applicantName || applicantName === "Pemohon Kolaborasi") {
      if (isSupabaseConfigured && activeSenderId) {
        try {
          const { data: prof } = await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", activeSenderId)
            .maybeSingle();
          if (prof?.full_name?.trim()) {
            applicantName = prof.full_name.trim();
          }
        } catch {}
      }
    }
    if (!applicantName || applicantName === "Pemohon Kolaborasi") {
      applicantName = "Peserta Angkasa";
    }

    // Sanitasi dan validasi ketat input pengajuan bergabung tim
    const inviteValidation = validateTeamInviteInput({
      team_request_id: teamRequestId,
      opportunity_id: opportunityId,
      opportunity_title: options?.opportunity_title,
      team_name: options?.team_name,
      applicant_id: activeSenderId,
      sender_id: activeSenderId,
      receiver_id: options?.receiver_id,
      applicant_name: applicantName,
      role_applied: options?.role_applied,
      message: options?.message,
    });

    if (!inviteValidation.valid) {
      return {
        success: false,
        message: "",
        error: Object.values(inviteValidation.errors)[0] || "Data pengajuan bergabung tidak valid.",
      };
    }

    const cleanInvite = inviteValidation.data;

    const newInvite: TeamInvite = {
      id: inviteId,
      team_request_id: cleanInvite.team_request_id!,
      opportunity_id: opportunityId,
      opportunity_title: cleanInvite.opportunity_title,
      team_name: cleanInvite.team_name,
      applicant_id: cleanInvite.applicant_id || activeSenderId,
      sender_id: cleanInvite.sender_id || activeSenderId,
      receiver_id: cleanInvite.receiver_id,
      applicant_name: cleanInvite.applicant_name || applicantName,
      role_applied: cleanInvite.role_applied || "Anggota Tim",
      message: cleanInvite.message || "",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // 1. Cek duplikasi di penyimpanan lokal (per opportunity & team)
    const currentInvites = getStoredTeamInvites();
    const hasDuplicate = currentInvites.some(
      (inv) =>
        inv.team_request_id === teamRequestId &&
        (inv.sender_id === activeSenderId || inv.applicant_id === activeSenderId) &&
        inv.status === "pending"
    );

    if (hasDuplicate) {
      return {
        success: false,
        message: "",
        error: "Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama.",
      };
    }

    // 2. Insert ke Supabase jika aktif (tidak boleh gagal meskipun baris profiles pengirim belum lengkap)
    if (isSupabaseConfigured) {
      // Pastikan baris profiles minimal ada agar foreign key constraint tidak gagal
      try {
        await supabaseClient.from("profiles").upsert(
          {
            id: activeSenderId,
            full_name: applicantName,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      } catch (upsertErr) {
        console.warn("[sendTeamInvite Profile Upsert Warning]", upsertErr);
      }

      const { data, error } = await supabaseClient
        .from("team_invites")
        .insert({
          id: inviteId,
          team_request_id: teamRequestId,
          opportunity_id: opportunityId,
          sender_id: activeSenderId,
          applicant_id: activeSenderId,
          receiver_id: options?.receiver_id,
          applicant_name: applicantName,
          role_applied: options?.role_applied || "Anggota Tim",
          message: options?.message || "",
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.toLowerCase().includes("unique") ||
          error.message?.toLowerCase().includes("duplicate")
        ) {
          return {
            success: false,
            message: "",
            error: "Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama.",
          };
        }
        // Jika error database terjadi (karena RLS/FK), jangan gagalkan flow pengguna
        console.warn("[sendTeamInvite Supabase Insert Warning]", error.message);
      } else if (data?.id) {
        newInvite.id = data.id;
      }
    }

    // 3. Simpan ke localStorage agar langsung sinkron di UI
    saveStoredTeamInvites([newInvite, ...currentInvites]);

    // Tandai juga ke API route jika sedang berjalan
    try {
      await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          id: newInvite.id,
          opportunity_id: opportunityId,
          team_request_id: teamRequestId,
          applicant_id: activeSenderId,
          sender_id: activeSenderId,
          receiver_id: options?.receiver_id,
          applicant_name: applicantName,
          role_applied: options?.role_applied || "Anggota Tim",
          message: options?.message || "",
        }),
      });
    } catch {}

    return {
      success: true,
      message: "Permintaan kolaborasi berhasil dikirimkan.",
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "",
      error: err?.message || "Terjadi gangguan koneksi saat mengirim permintaan kolaborasi.",
    };
  }
}

// =================================================================
// 7. KURATOR & VERIFIKATOR PELUANG (MANUAL & VERIFIKASI)
// =================================================================

const MANUAL_OPP_STORAGE_KEY = "angkasa_curator_opportunities";

export const DEFAULT_POSTER_URL =
  "https://repository-images.githubusercontent.com/20374133/737a7f00-ccb7-11e9-8665-cd8fb0842d18";

/**
 * Membersihkan cache sesi rekomendasi feed (invalidation)
 */
export function invalidateFeedCache(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("angkasa_feed_")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (e) {
    console.warn("[Cache Invalidation Error]", e);
  }
}

/**
 * Mengunggah file poster peluang ke Supabase Storage bucket 'posters'
 * dengan fallback kompresi Data URL (FileReader/Canvas) atau DEFAULT_POSTER_URL
 */
export async function uploadOpportunityPoster(file: File): Promise<string> {
  if (!file) return DEFAULT_POSTER_URL;

  // 1. Upayakan upload ke Supabase Storage bucket 'posters'
  try {
    if (isSupabaseConfigured) {
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `poster_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `curator/${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from("posters")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabaseClient.storage
          .from("posters")
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn("[Poster Upload Remote Warning]", err);
  }

  // 2. Fallback: Kompresi gambar menjadi Data URL menggunakan Canvas di browser
  try {
    if (typeof window !== "undefined") {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result) return resolve(DEFAULT_POSTER_URL);
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxW = 800;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            } else {
              resolve(result);
            }
          };
          img.onerror = () => resolve(DEFAULT_POSTER_URL);
          img.src = result;
        };
        reader.onerror = () => resolve(DEFAULT_POSTER_URL);
        reader.readAsDataURL(file);
      });
      return dataUrl || DEFAULT_POSTER_URL;
    }
  } catch {
    return DEFAULT_POSTER_URL;
  }

  return DEFAULT_POSTER_URL;
}

/**
 * Mengambil total bookmark yang tersimpan di sistem
 */
export async function getTotalBookmarksCount(): Promise<number> {
  try {
    if (isSupabaseConfigured) {
      const { count, error } = await supabaseClient
        .from("bookmarks")
        .select("id", { count: "exact", head: true });
      if (!error && typeof count === "number" && count > 0) {
        return count;
      }
    }
  } catch {}

  // Fallback lokal
  if (typeof window !== "undefined") {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("angkasa_bookmarks_")) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) count += parsed.length;
          }
        }
      }
      return count > 0 ? count : 48;
    } catch {}
  }
  return 48;
}

/**
 * Antrean draf awal untuk demo Mode Kurator kepada juri
 */
export const INITIAL_CURATOR_DRAFT: Opportunity = {
  id: "draft-opp-101",
  title: "National Cyber Defense Competition 2026",
  category: "Lomba",
  organizer: "Badan Siber dan Sandi Negara (BSSN)",
  caption: "30 Desember 2026",
  deadline: "30 Desember 2026",
  description_roadmap:
    "Kompetisi simulasi pertahanan jaringan komputer dan insiden keamanan siber berskala nasional untuk perguruan tinggi.",
  description:
    "Kompetisi simulasi pertahanan jaringan komputer dan insiden keamanan siber berskala nasional untuk perguruan tinggi.",
  requirements: [
    "Mahasiswa aktif program diploma atau sarjana",
    "Memiliki tim beranggotakan 3 orang",
    "Menguasai dasar jaringan dan analisis log sistem",
  ],
  required_skills: ["Cybersecurity", "Network Defense", "Linux", "Penetration Testing"],
  registration_url: "https://bssn.go.id/kompetisi-siber",
  image_url: DEFAULT_POSTER_URL,
  is_verified: false,
};

/**
 * Helper penyimpanan draf peluang kurator di localStorage
 */
function getStoredManualOpportunities(): Opportunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANUAL_OPP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Draf awal untuk antrean verifikasi kurator saat demo
    localStorage.setItem(MANUAL_OPP_STORAGE_KEY, JSON.stringify([INITIAL_CURATOR_DRAFT]));
    return [INITIAL_CURATOR_DRAFT];
  } catch (e) {
    console.warn("[Stored Opportunities Read Error]", e);
  }
  return [INITIAL_CURATOR_DRAFT];
}

function saveStoredManualOpportunities(items: Opportunity[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MANUAL_OPP_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("[Stored Opportunities Write Error]", e);
  }
}

/**
 * Mengambil seluruh peluang (baik is_verified = true maupun false) untuk Panel Kurator
 */
export async function fetchAllOpportunitiesForCurator(): Promise<ApiResponse<Opportunity[]>> {
  const manualList = getStoredManualOpportunities();
  let baseList: Opportunity[] = [];

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        baseList = data.map((o: any) => ({
          ...o,
          caption: o.caption || o.deadline || "Segera",
          deadline: o.caption || o.deadline || "Segera",
          description_roadmap: o.description_roadmap || o.description || "",
          description: o.description_roadmap || o.description || "",
          image_url: o.image_url || undefined,
        }));
      } else {
        baseList = mockOpportunities;
      }
    } else {
      baseList = mockOpportunities;
    }
  } catch {
    baseList = mockOpportunities;
  }

  // Gabungkan dengan peluang manual dari storage lokal (prioritaskan item terbaru, hindari duplikasi ID)
  const idMap = new Map<string, Opportunity>();
  manualList.forEach((item) => idMap.set(item.id, item));
  baseList.forEach((item) => {
    if (!idMap.has(item.id)) {
      idMap.set(item.id, item);
    }
  });

  const merged = Array.from(idMap.values());
  return { data: merged, error: null };
}

/**
 * Menyimpan peluang baru hasil input manual kurator/admin langsung ke tabel opportunities dengan status: 'verified'
 */
export async function createManualOpportunity(
  payload: Partial<Opportunity>
): Promise<ApiResponse<Opportunity>> {
  const validation = validateOpportunityInput(payload);
  if (!validation.valid) {
    return {
      data: null,
      error: Object.values(validation.errors)[0] || "Data peluang tidak valid.",
    };
  }
  const clean = validation.data;

  let activeCreatorId: string | null = null;
  if (isSupabaseConfigured) {
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      if (authData?.user?.id) {
        activeCreatorId = authData.user.id;
      }
    } catch {}
  }

  // Parse deadline aman: jika format tanggal valid maka jadikan ISO timestamptz
  let parsedDeadline: string | null = null;
  if (clean.deadline && clean.deadline !== "Segera") {
    const d = new Date(clean.deadline);
    if (!isNaN(d.getTime())) {
      parsedDeadline = d.toISOString();
    }
  }

  const newOpp: Opportunity = {
    id: clean.id || `opp-manual-${Date.now()}`,
    title: clean.title || "Peluang Baru",
    category: clean.category || "Lomba",
    organizer: clean.organizer || "Penyelenggara",
    caption: clean.caption || clean.deadline || "Segera",
    deadline: clean.caption || clean.deadline || "Segera",
    description_roadmap: clean.description_roadmap || clean.description || "",
    description: clean.description_roadmap || clean.description || "",
    registration_url: clean.registration_url || "https://angkasa.id",
    image_url: clean.image_url || DEFAULT_POSTER_URL,
    requirements: clean.requirements || [
      "Mahasiswa aktif diploma/sarjana perguruan tinggi",
      "Memenuhi kriteria teknis yang disyaratkan panitia",
    ],
    required_skills: clean.required_skills || [],
    is_verified: true,
    status: "verified",
    created_by: activeCreatorId || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Simpan ke localStorage agar offline/demo fallback lancar
  const currentStored = getStoredManualOpportunities();
  saveStoredManualOpportunities([newOpp, ...currentStored]);

  // 2. Hubungkan form langsung ke tabel opportunities Supabase dengan status: 'verified'
  if (isSupabaseConfigured) {
    try {
      await supabaseClient.from("opportunities").insert({
        id: newOpp.id,
        title: newOpp.title,
        category: newOpp.category,
        organizer: newOpp.organizer,
        caption: newOpp.caption,
        deadline: parsedDeadline,
        description: newOpp.description,
        description_roadmap: newOpp.description_roadmap,
        registration_url: newOpp.registration_url,
        requirements: newOpp.requirements,
        required_skills: newOpp.required_skills,
        image_url: newOpp.image_url,
        is_verified: true,
        status: "verified",
        created_by: activeCreatorId,
        created_at: newOpp.created_at,
        updated_at: newOpp.updated_at,
      });
    } catch (e) {
      console.warn("[Remote Insert Warning]", e);
    }
  }

  // 3. Bersihkan cache session feed
  invalidateFeedCache();

  return { data: newOpp, error: null };
}

/**
 * Mengubah status peluang menjadi is_verified: true dan status: 'verified'
 * Sekaligus mendukung verifikasi teks anti-hoaks jika dipanggil dengan teks siaran panjang
 */
export async function verifyOpportunity(
  idOrText: string
): Promise<any> {
  // Jika argumen berupa teks siaran panjang / materi broadcast (memuat spasi banyak / baris baru)
  if (idOrText.length > 60 || idOrText.includes("\n")) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: idOrText }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { data: null, error: json.error || "Gagal melakukan verifikasi peluang." };
      }
      return { data: json as OpportunityVerificationResult, error: null };
    } catch {
      return { data: null, error: "Gagal terhubung ke layanan verifikasi peluang." };
    }
  }

  // Jika argumen berupa ID peluang (Verifikasi status kurator: is_verified = true, status = 'verified')
  const oppId = idOrText.trim();
  const stored = getStoredManualOpportunities();
  const existingIdx = stored.findIndex((o) => o.id === oppId);
  let verifiedItem: Opportunity;

  if (existingIdx !== -1) {
    stored[existingIdx].is_verified = true;
    stored[existingIdx].status = "verified";
    stored[existingIdx].updated_at = new Date().toISOString();
    verifiedItem = stored[existingIdx];
    saveStoredManualOpportunities(stored);
  } else {
    // Jika tidak ditemukan di localStorage, buat entri verifikasi aktif
    verifiedItem = {
      id: oppId,
      title: "Peluang Terverifikasi",
      category: "Lomba",
      organizer: "Penyelenggara Terverifikasi",
      caption: "Segera",
      registration_url: "https://angkasa.id",
      is_verified: true,
      status: "verified",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveStoredManualOpportunities([verifiedItem, ...stored]);
  }

  // Upayakan update di Supabase
  if (isSupabaseConfigured) {
    try {
      await supabaseClient
        .from("opportunities")
        .update({
          is_verified: true,
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", oppId);
    } catch (e) {
      console.warn("[Remote Update Status Ignored due to RLS]", e);
    }
  }

  // Invalidate feed cache agar peluang langsung tayang di feed
  invalidateFeedCache();

  return { data: verifiedItem, error: null };
}

export const verifyOpportunityStatus = verifyOpportunity;
export const analyzeOpportunity = verifyOpportunity;

/**
 * Mengambil daftar peluang terverifikasi (status = 'verified') dari Supabase sebagai sumber data utama
 */
export async function fetchVerifiedOpportunities(): Promise<ApiResponse<Opportunity[]>> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseClient
        .from("opportunities")
        .select("*")
        .or("status.eq.verified,is_verified.eq.true")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized: Opportunity[] = data.map((o: any) => ({
          id: o.id,
          title: o.title,
          category: o.category,
          organizer: o.organizer,
          caption: o.caption || o.deadline || "Segera",
          deadline: o.caption || o.deadline || "Segera",
          description: o.description || o.description_roadmap || "",
          description_roadmap: o.description_roadmap || o.description || "",
          requirements: Array.isArray(o.requirements) ? o.requirements : [],
          required_skills: Array.isArray(o.required_skills) ? o.required_skills : [],
          registration_url: o.registration_url || "https://angkasa.id",
          image_url: o.image_url || undefined,
          is_verified: true,
          status: "verified",
          created_by: o.created_by,
          created_at: o.created_at,
          updated_at: o.updated_at,
        }));
        return { data: normalized, error: null };
      }
    } catch (err) {
      console.warn("[fetchVerifiedOpportunities Supabase Warning]", err);
    }
  }

  const manualVerified = getStoredManualOpportunities().filter(
    (o) => o.is_verified || o.status === "verified"
  );
  const combined = [...manualVerified, ...mockOpportunities];
  const seen = new Set<string>();
  const deduped: Opportunity[] = [];
  for (const opp of combined) {
    if (!seen.has(opp.id)) {
      seen.add(opp.id);
      deduped.push(opp);
    }
  }
  return { data: deduped, error: null };
}

// =================================================================
// 8. ALIAS KONSISTENSI PENAMAAN FUNGSI
// =================================================================
export const loginWithDemo = loginDemoUser;
export const updateProfile = updateUserProfile;
export const getPersonalizedFeed = fetchPersonalizedFeed;
export const getPreparationRoadmap = fetchPreparationRoadmap;
export const login = loginUser;
export const register = registerUser;
export const logout = logoutUser;
export const fetchTeamRequests = getTeamRequests;

