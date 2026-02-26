import { LoginButton } from "./login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-bold text-gold">BookBurr</h1>
        <p className="text-lg text-foreground/60">
          Koordinasi bukber anti ribet
        </p>
      </div>
      <LoginButton />
    </main>
  );
}
