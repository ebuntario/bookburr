import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-bold text-gold">BookBurr</h1>
        <p className="text-lg text-foreground/60">
          Koordinasi bukber anti ribet
        </p>
      </div>
      {error && (
        <div className="w-full max-w-sm rounded-lg bg-coral/10 px-4 py-3 text-center text-sm text-coral">
          {error === "Configuration"
            ? "Ada masalah di server, coba lagi nanti ya"
            : "Login gagal, coba lagi"}
        </div>
      )}
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
