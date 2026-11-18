import { createClient } from "@supabase/supabase-js";

/**
 * Fallback values yang valid secara format URL
 * untuk mencegah error "supabaseUrl is required" atau "Invalid URL"
 * saat tahap static compilation / `npm run build` jika file .env.local belum diset.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Supabase client instance yang aman dari crash saat build time.
 * Penamaan menggunakan `supabaseClient` (bukan variabel global `supabase`)
 * untuk menghindari name shadowing atau bentrok dengan package @supabase/supabase-js.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper boolean untuk mendeteksi apakah environment Supabase sudah valid
 * atau sedang berjalan dalam mode fallback / mock saat demo hackathon.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

export default supabaseClient;
