"use client";

import React, { useState, useEffect } from "react";
import LandingView from "@/components/LandingView";
import AuthView from "@/components/AuthView";
import ProfilingView from "@/components/ProfilingView";
import FeedDashboard from "@/components/FeedDashboard";
import OpportunityDetail from "@/components/OpportunityDetail";
import ProfileView from "@/components/ProfileView";
import { UserProfile, ScoredOpportunity } from "@/types/schema";
import { logoutUser, loginDemoUser, fetchPersonalizedFeed } from "@/lib/apiClient";
import { mockOpportunities } from "@/lib/mockData";
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

type ActiveView = "landing" | "auth" | "profiling" | "feed" | "detail" | "profile";

const ACTIVE_SESSION_STORAGE_KEY = "angkasa_active_session";
const SELECTED_OPP_STORAGE_KEY = "angkasa_selected_opportunity_id";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>("landing");
  const [selectedOpportunity, setSelectedOpportunity] = useState<ScoredOpportunity | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [focusInsightOnProfile, setFocusInsightOnProfile] = useState<boolean>(false);

  // ==========================================================
  // SESSION PERSISTENCE: Pulihkan Sesi Login Otomatis saat Refresh
  // ==========================================================
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // a. Periksa sesi aktif dari Supabase Auth
        if (isSupabaseConfigured) {
          const { data: sessionData } = await supabaseClient.auth.getSession();
          const sessionUser = sessionData?.session?.user;

          if (sessionUser && isMounted) {
            const { data: profile } = await supabaseClient
              .from("profiles")
              .select("*")
              .eq("id", sessionUser.id)
              .maybeSingle();

            if (profile && isMounted) {
              const loadedProfile: UserProfile = {
                id: profile.id,
                full_name: profile.full_name || sessionUser.email?.split("@")[0] || "Pengguna",
                email: profile.email || sessionUser.email || "",
                username: profile.username || sessionUser.email?.split("@")[0] || "",
                institution: profile.institution || "Perguruan Tinggi",
                birth_date: profile.birth_date || "2004-01-01",
                education_level: profile.education_level || "Mahasiswa",
                province: profile.province || "Indonesia",
                city: profile.city || "Indonesia",
                profiling: Array.isArray(profile.profiling) ? profile.profiling : [],
              };

              setCurrentUser(sessionUser);
              setCurrentProfile(loadedProfile);

              // Sinkronkan ke localStorage cadangan
              localStorage.setItem(
                ACTIVE_SESSION_STORAGE_KEY,
                JSON.stringify({ user: sessionUser, profile: loadedProfile })
              );

              // Periksa persistensi halaman detail peluang saat refresh
              const storedOppId =
                typeof window !== "undefined"
                  ? sessionStorage.getItem(SELECTED_OPP_STORAGE_KEY)
                  : null;

              if (storedOppId) {
                try {
                  const feedRes = await fetchPersonalizedFeed(loadedProfile);
                  const oppList = feedRes.data || mockOpportunities;
                  const foundOpp = oppList.find((o) => o.id === storedOppId);
                  if (foundOpp && isMounted) {
                    const scored: ScoredOpportunity = {
                      ...foundOpp,
                      matchPercentage: (foundOpp as any).matchPercentage || 95,
                      recommendationReason:
                        (foundOpp as any).recommendationReason ||
                        "Peluang ini sangat selaras dengan minat dan kualifikasi profil Anda.",
                    };
                    setSelectedOpportunity(scored);
                    setCurrentView("detail");
                    setIsRestoringSession(false);
                    return;
                  }
                } catch (e) {
                  console.warn("[Restore Selected Opp Error]", e);
                }
              }

              const hasProfiling =
                Array.isArray(loadedProfile.profiling) && loadedProfile.profiling.length > 0;
              setCurrentView(hasProfiling ? "feed" : "profile");
              setIsRestoringSession(false);
              return;
            }
          }
        }

        // b. Lapisan Cadangan: Periksa localStorage (angkasa_active_session)
        // Termasuk untuk mode Demo 1-Klik / offline fallback
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
          if (stored && isMounted) {
            const parsed = JSON.parse(stored);
            if (parsed?.profile) {
              const fallbackUser =
                parsed.user || { id: parsed.profile.id, email: parsed.profile.email };
              setCurrentUser(fallbackUser);
              setCurrentProfile(parsed.profile);

              // Periksa persistensi halaman detail peluang saat refresh
              const storedOppId =
                typeof window !== "undefined"
                  ? sessionStorage.getItem(SELECTED_OPP_STORAGE_KEY)
                  : null;

              if (storedOppId) {
                try {
                  const feedRes = await fetchPersonalizedFeed(parsed.profile);
                  const oppList = feedRes.data || mockOpportunities;
                  const foundOpp = oppList.find((o) => o.id === storedOppId);
                  if (foundOpp && isMounted) {
                    const scored: ScoredOpportunity = {
                      ...foundOpp,
                      matchPercentage: (foundOpp as any).matchPercentage || 95,
                      recommendationReason:
                        (foundOpp as any).recommendationReason ||
                        "Peluang ini sangat selaras dengan minat dan kualifikasi profil Anda.",
                    };
                    setSelectedOpportunity(scored);
                    setCurrentView("detail");
                    setIsRestoringSession(false);
                    return;
                  }
                } catch (e) {
                  console.warn("[Restore Selected Opp Error]", e);
                }
              }

              const hasProfiling =
                Array.isArray(parsed.profile.profiling) &&
                parsed.profile.profiling.length > 0;
              setCurrentView(hasProfiling ? "feed" : "profile");
              setIsRestoringSession(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("[Session Restore Warning]", err);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    // Dengarkan perubahan status otentikasi Supabase
    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (event) => {
          if (event === "SIGNED_OUT") {
            if (isMounted) {
              localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
              setCurrentUser(null);
              setCurrentProfile(null);
              setCurrentView("landing");
            }
          }
        }
      );
      subscription = authListener?.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Handler Sukses Login / Register (P1)
  const handleAuthSuccess = (
    user: any,
    profile: UserProfile,
    authMode?: "login" | "register" | "demo"
  ) => {
    setCurrentUser(user);
    setCurrentProfile(profile);

    // Simpan ke localStorage cadangan anti-logout saat refresh
    try {
      localStorage.setItem(
        ACTIVE_SESSION_STORAGE_KEY,
        JSON.stringify({ user, profile })
      );
    } catch (e) {
      console.warn("[Session Save Error]", e);
    }

    const isDemo =
      authMode === "demo" ||
      profile.email === "dummy123@gmail.com" ||
      profile.email === "demo@angkasa.id" ||
      profile.email.includes("demo");

    // Alur Wajib: Akun demo, registrasi baru, atau profil belum memiliki profiling
    // diarahkan langsung ke halaman Profile (Personalisasi AI) terlebih dahulu
    const hasProfiling =
      Array.isArray(profile.profiling) && profile.profiling.length > 0;

    if (authMode === "register" || isDemo || !hasProfiling) {
      setFocusInsightOnProfile(true);
      setCurrentView("profile");
      return;
    }

    setCurrentView("feed");
  };

  // Handler Login Demo 1-Klik Langsung dari LandingView
  const handleDirectDemoLogin = async () => {
    setIsRestoringSession(true);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("angkasa_ai_career_insight");
          localStorage.removeItem("angkasa_profile_career_story");
          sessionStorage.removeItem(SELECTED_OPP_STORAGE_KEY);
        } catch {}
      }
      const res = await loginDemoUser();
      if (res.data) {
        handleAuthSuccess(res.data.user, res.data.profile, "demo");
      } else {
        setCurrentView("auth");
      }
    } catch {
      setCurrentView("auth");
    } finally {
      setIsRestoringSession(false);
    }
  };

  // Handler Selesai Pengisian Profiling (P2 -> P3)
  const handleProfilingComplete = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile);
    setCurrentView("feed");

    // Perbarui profil pada sesi tersimpan di localStorage
    try {
      const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        ACTIVE_SESSION_STORAGE_KEY,
        JSON.stringify({
          user: parsed.user || currentUser || { id: updatedProfile.id, email: updatedProfile.email },
          profile: updatedProfile,
        })
      );
    } catch (e) {
      console.warn("[Session Update Error]", e);
    }
  };

  // Handler Buka Detail Peluang (P3 -> P4/P5/P6)
  const handleSelectOpportunity = (opp: ScoredOpportunity) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SELECTED_OPP_STORAGE_KEY, opp.id);
      } catch (e) {
        console.warn("[Save Selected Opp Error]", e);
      }
    }
    setSelectedOpportunity(opp);
    setCurrentView("detail");
  };

  // Handler Logout (P8)
  const handleLogout = async () => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(SELECTED_OPP_STORAGE_KEY);
        } catch {}
      }
      await logoutUser();
    } finally {
      setCurrentUser(null);
      setCurrentProfile(null);
      setSelectedOpportunity(null);
      setCurrentView("landing");
    }
  };

  // ==========================================================
  // LOADING SCREEN HALUS SAAT MEMULIHKAN SESI (ANTI-FLICKER)
  // ==========================================================
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-400/30 selection:text-amber-200">
        <div className="flex flex-col items-center gap-3 animate-fade-slide-up p-6 rounded-2xl bg-white/[0.10] backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin" />
          <div className="flex items-center gap-2 text-xs font-mono text-white/90 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Memulihkan Sesi Angkasa...</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW 0: LANDING PAGE (Saat Tidak Ada Sesi Login Aktif)
  // ==========================================================
  if (!currentProfile && currentView === "landing") {
    return (
      <LandingView
        onStartAuth={() => setCurrentView("auth")}
        onDemoLogin={handleDirectDemoLogin}
      />
    );
  }

  // ==========================================================
  // VIEW 1: AUTHENTICATION (P1: Login, Register, 1-Click Demo)
  // ==========================================================
  if (!currentProfile || currentView === "auth") {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-[#004aad] via-[#003d91] to-[#002b66] text-white">
        {/* Tombol Kembali ke Landing Page */}
        <div className="absolute top-4 left-4 z-50">
          <button
            type="button"
            onClick={() => setCurrentView("landing")}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-xs font-medium text-white transition flex items-center gap-2 cursor-pointer shadow-md active:scale-[0.98] backdrop-blur-md"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
        <AuthView onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // ==========================================================
  // VIEW 2: PROFILING VIEW (P2: Input Minat, Bakat & Keahlian)
  // ==========================================================
  if (currentView === "profiling") {
    return (
      <ProfilingView
        userProfile={currentProfile}
        onComplete={handleProfilingComplete}
        onCancel={
          currentProfile.profiling && currentProfile.profiling.length > 0
            ? () => setCurrentView("feed")
            : undefined
        }
      />
    );
  }

  // ==========================================================
  // VIEW 4: OPPORTUNITY DETAIL (P4 Katalog, P5 Roadmap, P6 Team)
  // ==========================================================
  if (currentView === "detail" && selectedOpportunity) {
    return (
      <OpportunityDetail
        opportunity={selectedOpportunity}
        userProfile={currentProfile}
        onBack={() => {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem(SELECTED_OPP_STORAGE_KEY);
            } catch (e) {
              console.warn("[Remove Selected Opp Error]", e);
            }
          }
          setSelectedOpportunity(null);
          setCurrentView("feed");
        }}
      />
    );
  }

  // ==========================================================
  // VIEW 5: USER PROFILE VIEW (Identitas, Kelola Minat, dsb)
  // ==========================================================
  if (currentView === "profile" && currentProfile) {
    return (
      <ProfileView
        userProfile={currentProfile}
        initialFocusInsight={focusInsightOnProfile}
        onBack={() => {
          setFocusInsightOnProfile(false);
          setCurrentView("feed");
        }}
        onUpdateProfile={(updated) => {
          setCurrentProfile(updated);
          try {
            const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem(
              ACTIVE_SESSION_STORAGE_KEY,
              JSON.stringify({
                user: parsed.user || currentUser || { id: updated.id, email: updated.email },
                profile: updated,
              })
            );
          } catch (e) {
            console.warn("[Session Profile Update Error]", e);
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================================
  // VIEW 3: AI PERSONALIZED FEED (P3: Feed Peluang Utama)
  // ==========================================================
  return (
    <FeedDashboard
      userProfile={currentProfile}
      onSelectOpportunity={handleSelectOpportunity}
      onEditProfile={() => setCurrentView("profile")}
      onOpenProfile={() => setCurrentView("profile")}
      onLogout={handleLogout}
    />
  );
}
