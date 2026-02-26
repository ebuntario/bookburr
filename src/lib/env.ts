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
    return process.env.AUTH_SECRET ?? "";
  },
  get AUTH_RESEND_KEY() {
    return process.env.AUTH_RESEND_KEY ?? "";
  },
  get AUTH_EMAIL_FROM() {
    return process.env.AUTH_EMAIL_FROM ?? "BookBurr <noreply@bookburr.com>";
  },
} as const;
