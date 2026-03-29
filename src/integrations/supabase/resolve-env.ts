/**
 * Central place for Supabase URL/key so createClient() never receives "" / undefined
 * (Supabase v2 throws "supabaseUrl is required" and the app stays blank).
 * Keep this file when syncing from Lovable — do not rely only on auto-generated client stubs.
 */

const PLACEHOLDER_URL = "https://placeholder-not-configured.supabase.co";
const PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

function readEnvString(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY"): string {
  const v = import.meta.env[key] as string | undefined;
  if (typeof v !== "string") return "";
  return v.trim();
}

export function resolveSupabaseUrl(): string {
  const s = readEnvString("VITE_SUPABASE_URL");
  if (s.length > 0) return s;
  console.warn(
    "[supabase] VITE_SUPABASE_URL missing — using placeholder. Copy .env.example → .env for real data."
  );
  return PLACEHOLDER_URL;
}

export function resolveSupabaseAnonKey(): string {
  const s = readEnvString("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (s.length > 0) return s;
  console.warn(
    "[supabase] VITE_SUPABASE_PUBLISHABLE_KEY missing — using placeholder anon key. Add keys in .env."
  );
  return PLACEHOLDER_ANON_KEY;
}
