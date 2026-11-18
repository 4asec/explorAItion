"use client";

import React, { useState } from "react";
import AuthView from "@/components/AuthView";
import ProfilingView from "@/components/ProfilingView";
import FeedDashboard from "@/components/FeedDashboard";
import OpportunityDetail from "@/components/OpportunityDetail";
import { UserProfile, ScoredOpportunity } from "@/types/schema";
import { logoutUser } from "@/lib/apiClient";

type ActiveView = "auth" | "profiling" | "feed" | "detail";

export default function Home() {
  const [, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ActiveView>("auth");
  const [selectedOpportunity, setSelectedOpportunity] = useState<ScoredOpportunity | null>(null);

  // Handler Sukses Login / Register (P1)
  const handleAuthSuccess = (user: any, profile: UserProfile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);

    // Aturan Alur P2 vs P3:
    // Jika data profiling kosong, arahkan ke tahap input minat & bakat (P2)
    const hasProfiling =
      Array.isArray(profile.profiling) && profile.profiling.length > 0;

    if (hasProfiling) {
      setCurrentView("feed");
    } else {
      setCurrentView("profiling");
    }
  };

  // Handler Selesai Pengisian Profiling (P2 -> P3)
  const handleProfilingComplete = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile);
    setCurrentView("feed");
  };

  // Handler Buka Detail Peluang (P3 -> P4/P5/P6)
  const handleSelectOpportunity = (opp: ScoredOpportunity) => {
    setSelectedOpportunity(opp);
    setCurrentView("detail");
  };

  // Handler Logout (P8)
  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setCurrentUser(null);
      setCurrentProfile(null);
      setSelectedOpportunity(null);
      setCurrentView("auth");
    }
  };

  // ==========================================================
  // VIEW 1: AUTHENTICATION (P1: Login, Register, 1-Click Demo)
  // ==========================================================
  if (!currentProfile || currentView === "auth") {
    return <AuthView onSuccess={handleAuthSuccess} />;
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
          setSelectedOpportunity(null);
          setCurrentView("feed");
        }}
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
      onEditProfile={() => setCurrentView("profiling")}
      onLogout={handleLogout}
    />
  );
}
