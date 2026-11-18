import { NextResponse } from "next/server";
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mockTeamRequests } from "@/lib/mockData";
import { TeamRequest, TeamInvite } from "@/types/schema";

/**
 * Penyimpanan sesi lokal sementara (In-Memory) untuk simulasi demo hackathon
 * agar constraint anti-duplikasi tetap berjalan sempurna jika Supabase offline
 */
const demoInvitesCache = new Set<string>();
const demoTeamRequestsCache: TeamRequest[] = [...mockTeamRequests];

/**
 * GET: Mengambil daftar permintaan tim (team_requests) berdasarkan opportunityId
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");

    if (!opportunityId) {
      return NextResponse.json(
        { error: "Parameter opportunityId wajib disertakan pada URL query." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient
          .from("team_requests")
          .select("*")
          .eq("opportunity_id", opportunityId);

        if (!error && Array.isArray(data)) {
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("[Team API GET] Supabase query gagal, menggunakan fallback mock...", err);
      }
    }

    // Fallback Mock Data
    const fallbackResults = demoTeamRequestsCache.filter(
      (t) => t.opportunity_id === opportunityId
    );
    return NextResponse.json(fallbackResults);
  } catch (error) {
    console.error("[Team API GET Error]", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar tim kolaborasi." },
      { status: 500 }
    );
  }
}

/**
 * POST: Menangani aksi 'create' (buat tim) dan 'invite' (kirim permintaan kolaborasi)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Properti 'action' wajib disertakan ('create' atau 'invite')." },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. AKSI: CREATE TEAM REQUEST
    // ==========================================
    if (action === "create") {
      const {
        opportunity_id,
        creator_id,
        creator_name,
        team_name,
        role_needed,
      } = body as {
        opportunity_id: string;
        creator_id: string;
        creator_name: string;
        team_name: string;
        role_needed: string;
      };

      if (!opportunity_id || !creator_id || !team_name || !role_needed) {
        return NextResponse.json(
          {
            error:
              "Data pembuatan tim tidak lengkap. Pastikan ID kompetisi, identitas pembuat, nama tim, dan posisi yang dibutuhkan terisi.",
          },
          { status: 400 }
        );
      }

      const newTeamRecord: TeamRequest = {
        id: body.id || `team-${Date.now()}`,
        opportunity_id,
        creator_id,
        creator_name: creator_name || "Ketua Tim",
        team_name,
        role_needed,
        hasRequested: false,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabaseClient
          .from("team_requests")
          .insert(newTeamRecord)
          .select()
          .single();

        if (error) {
          // Tangani Unique Constraint Violation (PostgreSQL 23505)
          if (
            error.code === "23505" ||
            error.message?.toLowerCase().includes("unique") ||
            error.message?.toLowerCase().includes("duplicate")
          ) {
            return NextResponse.json(
              {
                error:
                  "Anda sudah membuat tim dengan nama atau kriteria yang sama pada kompetisi ini.",
              },
              { status: 409 }
            );
          }

          console.warn("[Team API POST Create] Supabase insert gagal:", error.message);
        } else if (data) {
          return NextResponse.json(
            { success: true, message: "Tim berhasil dibuat.", data },
            { status: 201 }
          );
        }
      }

      // Fallback Demo Mode jika Supabase belum terhubung
      demoTeamRequestsCache.unshift(newTeamRecord);
      return NextResponse.json(
        {
          success: true,
          message: "Tim berhasil dibuat (Mode Demo).",
          data: newTeamRecord,
        },
        { status: 201 }
      );
    }

    // ==========================================
    // 2. AKSI: INVITE / REQUEST COLLABORATION
    // ==========================================
    if (action === "invite") {
      const teamRequestId = body.team_request_id || body.team_id;
      const applicantId = body.applicant_id || body.user_id;
      const applicantName = body.applicant_name || "Pemohon Kolaborasi";
      const opportunityId = body.opportunity_id;
      const roleApplied = body.role_applied || "Anggota Tim";
      const message = body.message || "";

      if (!teamRequestId || !applicantId) {
        return NextResponse.json(
          {
            error:
              "Data permintaan kolaborasi tidak lengkap. ID tim dan identitas pemohon wajib disertakan.",
          },
          { status: 400 }
        );
      }

      // Kunci anti-duplikasi untuk konsistensi lokal demo
      const inviteKey = `${applicantId}_${teamRequestId}`;
      if (demoInvitesCache.has(inviteKey)) {
        return NextResponse.json(
          {
            error:
              "Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama.",
          },
          { status: 409 }
        );
      }

      const invitePayload: TeamInvite = {
        id: body.id || `inv-${Date.now()}`,
        team_request_id: teamRequestId,
        opportunity_id: opportunityId,
        applicant_id: applicantId,
        applicant_name: applicantName,
        role_applied: roleApplied,
        message,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabaseClient
          .from("team_invites")
          .insert(invitePayload)
          .select()
          .single();

        if (error) {
          // Tangani Error PostgreSQL kode 23505 (Unique Constraint Violation)
          if (
            error.code === "23505" ||
            error.message?.toLowerCase().includes("unique") ||
            error.message?.toLowerCase().includes("duplicate")
          ) {
            return NextResponse.json(
              {
                error:
                  "Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama.",
              },
              { status: 409 }
            );
          }

          console.warn("[Team API POST Invite] Supabase insert gagal:", error.message);
        } else if (data) {
          demoInvitesCache.add(inviteKey);
          return NextResponse.json(
            { success: true, message: "Permintaan kolaborasi berhasil dikirim.", data },
            { status: 201 }
          );
        }
      }

      // Catat ke cache demo lokal
      demoInvitesCache.add(inviteKey);
      return NextResponse.json(
        {
          success: true,
          message: "Permintaan kolaborasi berhasil dikirim (Mode Demo).",
          data: invitePayload,
        },
        { status: 201 }
      );
    }

    // Aksi di luar 'create' atau 'invite'
    return NextResponse.json(
      {
        error: `Aksi '${action}' tidak dikenali. Aksi yang didukung adalah 'create' atau 'invite'.`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Team API POST Error]", error);
    return NextResponse.json(
      { error: "Format request tidak valid atau terjadi kegagalan pemrosesan data tim." },
      { status: 400 }
    );
  }
}
