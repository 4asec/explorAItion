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
  skills: string[];
  interests: string[];
  talents: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  organizer: string;
  deadline: string;
  description: string;
  requirements: string[];
  required_skills: string[];
  registration_url: string;
  is_verified: boolean;
}

export interface PersonalizedOpportunity extends Opportunity {
  matchPercentage: number;
  recommendationReason: string; // 1 kalimat padat berbahasa Indonesia
}

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
 * Tipe tambahan untuk AI Career & Talent Analyzer
 */
export interface AIAnalysisResult {
  skor_kesiapan: number;
  diagnosis_singkat: string;
  rekomendasi_aksi: string[];
  _modelUsed?: string;
  error?: string;
}
