import { Suspense } from "react";
import { SessionWizard } from "./_components/session-wizard";

export const metadata = {
  title: "Bikin Bukber — BookBurr",
};

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-foreground/40">Loading...</p>
        </div>
      }
    >
      <SessionWizard />
    </Suspense>
  );
}
