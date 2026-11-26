/**
 * Security & Input Sanitation Module for Angkasa Platform
 * Protects against OWASP Top 10 vulnerabilities (XSS, Injection, Malicious Payloads)
 */

import {
  UserProfile,
  CreateTeamPayload,
  Opportunity,
  OpportunityCategory,
  TeamInvite,
} from "@/types/schema";

/**
 * Membersihkan string dari karakter berbahaya, null bytes,
 * tag HTML/Script, event handlers (onerror, onload), dan skema berbahaya.
 */
export function sanitizeText(raw: unknown, maxLength = 1000): string {
  if (typeof raw !== "string") {
    if (raw === null || raw === undefined) return "";
    return String(raw).slice(0, maxLength);
  }

  let cleaned = raw
    // Hapus null bytes dan control characters kecuali newline/tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Hapus tag script & inline handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    // Hapus skema javascript: dan vbscript:
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    // Hapus tag HTML pembuka dan penutup
    .replace(/<[^>]*>/g, "")
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Sanitasi dan validasi format URL web yang aman.
 * Hanya mengizinkan protokol http:// atau https://
 */
export function sanitizeUrl(raw: unknown, defaultFallback = "https://angkasa.id"): string {
  if (typeof raw !== "string" || !raw.trim()) {
    return defaultFallback;
  }

  const trimmed = raw.trim();

  // Cegah serangan javascript:, data:, atau vbscript:
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return defaultFallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Jika format URL parsial tanpa protocol, tambahkan https:// jika tampak valid
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }

  return defaultFallback;
}

/**
 * Sanitasi string email
 */
export function sanitizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : "";
}

/**
 * Sanitasi daftar array string (misal: profiling skills, requirements)
 */
export function sanitizeStringArray(raw: unknown, maxItems = 25, maxItemLength = 80): string[] {
  if (!Array.isArray(raw)) return [];

  const sanitized = raw
    .map((item) => sanitizeText(item, maxItemLength))
    .filter((item) => item.length > 0);

  // Deduplikasi & batasi jumlah item
  return Array.from(new Set(sanitized)).slice(0, maxItems);
}

// =============================================================================
// SCHEMA VALIDATORS WITH DETAILED ERROR REPORTING
// =============================================================================

export interface ValidationResult<T> {
  valid: boolean;
  data: T;
  errors: Record<string, string>;
}

/**
 * Validasi dan sanitasi input form profil pengguna
 */
export function validateProfileInput(input: Partial<UserProfile>): ValidationResult<Partial<UserProfile>> {
  const errors: Record<string, string> = {};
  const sanitizedData: Partial<UserProfile> = { ...input };

  if (input.full_name !== undefined) {
    const full_name = sanitizeText(input.full_name, 100);
    if (!full_name || full_name.length < 2) {
      errors.full_name = "Nama lengkap wajib diisi minimal 2 karakter.";
    } else {
      sanitizedData.full_name = full_name;
    }
  }

  if (input.username !== undefined) {
    const username = sanitizeText(input.username, 40).replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase();
    if (!username || username.length < 3) {
      errors.username = "Username wajib diisi minimal 3 karakter alfanumerik.";
    } else {
      sanitizedData.username = username;
    }
  }

  if (input.institution !== undefined) {
    sanitizedData.institution = sanitizeText(input.institution, 150) || "Perguruan Tinggi";
  }

  if (input.education_level !== undefined) {
    sanitizedData.education_level = sanitizeText(input.education_level, 60) || "Mahasiswa D3/D4/S1";
  }

  if (input.province !== undefined) {
    sanitizedData.province = sanitizeText(input.province, 100) || "Indonesia";
  }

  if (input.city !== undefined) {
    sanitizedData.city = sanitizeText(input.city, 100) || "Indonesia";
  }

  if (input.birth_date !== undefined) {
    sanitizedData.birth_date = sanitizeText(input.birth_date, 20) || "2004-01-01";
  }

  if (input.avatar_url !== undefined) {
    sanitizedData.avatar_url = input.avatar_url ? sanitizeUrl(input.avatar_url) : null;
  }

  if (input.profiling !== undefined) {
    sanitizedData.profiling = sanitizeStringArray(input.profiling, 30, 60);
  }

  if (input.email !== undefined) {
    const email = sanitizeEmail(input.email);
    if (!email) {
      errors.email = "Format alamat email tidak valid.";
    } else {
      sanitizedData.email = email;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors,
  };
}

/**
 * Validasi dan sanitasi input form pembuatan tim kolaborasi
 */
export function validateCreateTeamInput(input: Partial<CreateTeamPayload>): ValidationResult<CreateTeamPayload> {
  const errors: Record<string, string> = {};

  const opportunity_id = sanitizeText(input.opportunity_id, 100);
  if (!opportunity_id) {
    errors.opportunity_id = "ID peluang kompetisi wajib disertakan.";
  }

  const creator_id = sanitizeText(input.creator_id, 100);
  if (!creator_id) {
    errors.creator_id = "ID pembuat tim tidak valid.";
  }

  const creator_name = sanitizeText(input.creator_name, 100) || "Inisiator Tim";

  const team_name = sanitizeText(input.team_name, 80);
  if (!team_name || team_name.length < 2) {
    errors.team_name = "Nama tim wajib diisi minimal 2 karakter.";
  }

  const role_needed = sanitizeText(input.role_needed, 100);
  if (!role_needed || role_needed.length < 2) {
    errors.role_needed = "Kebutuhan peran rekan tim wajib diisi.";
  }

  const sanitizedData: CreateTeamPayload = {
    opportunity_id,
    creator_id,
    creator_name,
    team_name,
    role_needed,
  };

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors,
  };
}

/**
 * Validasi dan sanitasi input form upload / kurasi peluang Admin
 */
export function validateOpportunityInput(input: Partial<Opportunity>): ValidationResult<Partial<Opportunity>> {
  const errors: Record<string, string> = {};

  const title = sanitizeText(input.title, 200);
  if (!title || title.length < 3) {
    errors.title = "Judul peluang wajib diisi minimal 3 karakter.";
  }

  const organizer = sanitizeText(input.organizer, 150);
  if (!organizer || organizer.length < 2) {
    errors.organizer = "Nama penyelenggara wajib diisi minimal 2 karakter.";
  }

  let category: OpportunityCategory = "Lomba";
  if (input.category === "Beasiswa" || input.category === "Seminar") {
    category = input.category;
  }

  const caption = sanitizeText(input.caption || input.deadline, 80) || "Segera";
  const deadline = sanitizeText(input.deadline || input.caption, 80) || "Segera";
  const description = sanitizeText(input.description || input.description_roadmap, 4000) || "Peluang terkurasi oleh tim kurator Angkasa.";
  const description_roadmap = sanitizeText(input.description_roadmap || input.description, 4000) || description;
  const registration_url = sanitizeUrl(input.registration_url);
  const requirements = sanitizeStringArray(input.requirements, 20, 150);
  const required_skills = sanitizeStringArray(input.required_skills, 15, 60);

  const sanitizedData: Partial<Opportunity> = {
    ...input,
    title,
    organizer,
    category,
    caption,
    deadline,
    description,
    description_roadmap,
    registration_url,
    requirements: requirements.length > 0 ? requirements : ["Mahasiswa aktif perguruan tinggi", "Memenuhi kriteria teknis panitia"],
    required_skills: required_skills.length > 0 ? required_skills : [category, "Kolaborasi Tim", "Problem Solving"],
    is_verified: input.is_verified ?? true,
    status: input.status || "verified",
  };

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors,
  };
}

/**
 * Validasi dan sanitasi input pengajuan bergabung tim (team invite)
 */
export function validateTeamInviteInput(input: Partial<TeamInvite>): ValidationResult<Partial<TeamInvite>> {
  const errors: Record<string, string> = {};

  const team_request_id = sanitizeText(input.team_request_id, 100);
  if (!team_request_id) {
    errors.team_request_id = "ID tim target wajib disertakan.";
  }

  const sender_id = sanitizeText(input.sender_id || input.applicant_id, 100);
  if (!sender_id) {
    errors.sender_id = "ID pengaju kolaborasi tidak valid.";
  }

  const applicant_name = sanitizeText(input.applicant_name, 100) || "Peserta Angkasa";
  const role_applied = sanitizeText(input.role_applied, 80) || "Anggota Tim";
  const message = sanitizeText(input.message, 500) || "Halo! Saya tertarik bergabung dan berkontribusi di tim ini.";

  const sanitizedData: Partial<TeamInvite> = {
    ...input,
    team_request_id,
    sender_id,
    applicant_id: sender_id,
    applicant_name,
    role_applied,
    message,
    status: input.status || "pending",
  };

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors,
  };
}
