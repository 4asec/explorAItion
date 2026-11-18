/**
 * Single Source of Truth untuk Kontrak Tipe Data Aplikasi Angkasa
 * (Explor[AI]tion Hackathon)
 */

export type OpportunityCategory = 'Lomba' | 'Beasiswa' | 'Seminar';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  username: string;
  institution: string;
  birth_date: string;
  education_level: string;
  province: string;
  city: string;
  profiling: string[];
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password?: string;
  username: string;
  institution: string;
  birth_date: string;
  education_level: string;
  province: string;
  city: string;
}

export const DEFAULT_POSTER_URL =
  "https://repository-images.githubusercontent.com/20374133/737a7f00-ccb7-11e9-8665-cd8fb0842d18";

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  organizer: string;
  deadline?: string;
  caption?: string; // Sesuai kolom database Supabase
  description?: string;
  description_roadmap?: string; // Sesuai kolom database Supabase
  requirements?: string[];
  required_skills?: string[];
  registration_url: string;
  image_url?: string | null;
  is_verified: boolean;
  created_at?: string;
}

export interface PersonalizedOpportunity extends Opportunity {
  matchPercentage: number;
  recommendationReason: string; // 1–2 kalimat tajam bergaya mentor karier
}

export type ScoredOpportunity = PersonalizedOpportunity;

export interface DocumentChecklistItem {
  item: string;
  tip: string;
}

export interface RoadmapTimelineItem {
  phase: string;
  action: string;
}

export interface RoadmapResponse {
  document_checklist: DocumentChecklistItem[];
  winning_strategy: string[];
  timeline: RoadmapTimelineItem[];
  recommended_tools?: string[];
  curation_tips?: string[];
}

export interface TeamRequest {
  id: string;
  opportunity_id: string;
  creator_id: string;
  creator_name: string;
  team_name: string;
  role_needed: string;
  hasRequested?: boolean;
  created_at?: string;
}

export interface CreateTeamPayload {
  opportunity_id: string;
  creator_id: string;
  creator_name: string;
  team_name: string;
  role_needed: string;
}

export interface TeamInvite {
  id?: string;
  team_request_id: string;
  opportunity_id?: string;
  applicant_id: string;
  applicant_name: string;
  role_applied?: string;
  message?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
}

/**
 * Kontrak Ekstraksi & Verifikasi Informasi Peluang (Anti-Hoaks)
 */
export interface ExtractedOpportunity {
  title: string;
  organizer: string;
  category: OpportunityCategory;
  caption: string;
  description_roadmap: string;
  registration_url?: string;
  requirements?: string[];
  required_skills?: string[];
}

export interface OpportunityVerificationResult {
  isCredible: boolean;
  trustScore: number; // 0 - 100
  redFlags: string[];
  verdict: string;
  extractedOpportunity: ExtractedOpportunity;
  // Kompatibilitas dengan analisis lama
  skor_kesiapan?: number;
  diagnosis_singkat?: string;
  rekomendasi_aksi?: string[];
  _modelUsed?: string;
}

/**
 * Kontrak AI Career & Skill Insight (P2)
 */
export interface ProfileInsightResult {
  recommendedRole: string;
  careerInsight: string;
  extractedTags: string[];
  _modelUsed?: string;
  error?: string;
}

/**
 * Tipe tambahan untuk AI Career & Talent Analyzer (Legacy / Backward Compatibility)
 */
export interface AIAnalysisResult {
  skor_kesiapan: number;
  diagnosis_singkat: string;
  rekomendasi_aksi: string[];
  _modelUsed?: string;
  error?: string;
}
