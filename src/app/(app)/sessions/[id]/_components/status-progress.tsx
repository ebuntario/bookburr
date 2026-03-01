import { Fragment } from "react";
import type { SessionStatus } from "@/lib/constants";

const STEPS: { key: SessionStatus; activeLabel: string }[] = [
  { key: "collecting", activeLabel: "Lagi ngumpulin orang" },
  { key: "discovering", activeLabel: "Lagi nyari venue" },
  { key: "voting", activeLabel: "Lagi voting" },
  { key: "confirmed", activeLabel: "Udah fix!" },
  { key: "completed", activeLabel: "Selesai!" },
];

export function StatusProgress({ status }: { status: string }) {
  const activeIndex = STEPS.findIndex((s) => s.key === status);
  const activeStep = STEPS[Math.max(0, activeIndex)];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <Fragment key={step.key}>
            <div
              className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all ${
                i < activeIndex
                  ? "bg-success"
                  : i === activeIndex
                    ? "bg-primary ring-3 ring-primary/25"
                    : "bg-foreground/15"
              }`}
            />
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  i < activeIndex ? "bg-success/50" : "bg-foreground/10"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>
      <p className="text-xs text-foreground/60">{activeStep?.activeLabel}</p>
    </div>
  );
}
