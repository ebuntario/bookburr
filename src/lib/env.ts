function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  get DATABASE_URL() {
    return requireEnv("DATABASE_URL");
  },
  get AUTH_SECRET() {
    return requireEnv("AUTH_SECRET");
  },
  get AUTH_RESEND_KEY() {
    return requireEnv("AUTH_RESEND_KEY");
  },
  get AUTH_EMAIL_FROM() {
    return process.env.AUTH_EMAIL_FROM ?? "BookBurr <noreply@bookburr.com>";
  },
  get GOOGLE_PLACES_API_KEY() {
    return process.env.GOOGLE_PLACES_API_KEY ?? null;
  },
  // Supabase Realtime (optional — app works without these)
  get NEXT_PUBLIC_SUPABASE_URL() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
  },
  // Google OAuth (optional — login with Google disabled when not configured)
  get AUTH_GOOGLE_ID() {
    return process.env.AUTH_GOOGLE_ID ?? null;
  },
  get AUTH_GOOGLE_SECRET() {
    return process.env.AUTH_GOOGLE_SECRET ?? null;
  },
  // Unsplash API (optional — home page background disabled when not configured)
  get UNSPLASH_ACCESS_KEY() {
    return process.env.UNSPLASH_ACCESS_KEY ?? null;
  },
} as const;
