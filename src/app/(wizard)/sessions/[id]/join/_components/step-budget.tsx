"use client";

import { useState } from "react";
import { Button, Spinner } from "@heroui/react";

const PRESETS = [
  { label: "< 50rb", value: 50_000 },
  { label: "50–100rb", value: 100_000 },
  { label: "100–200rb", value: 200_000 },
  { label: "200rb+", value: 300_000 },
];

interface StepBudgetProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function StepBudget({
  value,
  onChange,
  onSubmit,
  isPending,
}: StepBudgetProps) {
  const [customInput, setCustomInput] = useState("");
  const isPreset = PRESETS.some((p) => p.value === value);

  function handlePreset(presetValue: number) {
    setCustomInput("");
    onChange(value === presetValue ? null : presetValue);
  }

  function handleCustomChange(raw: string) {
    setCustomInput(raw);
    const num = parseInt(raw.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    } else {
      onChange(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-heading font-semibold">Budget per orang berapa?</h2>
        <p className="text-sm text-foreground/60">
          Biar venue-nya sesuai kantong
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-5">
        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const selected = value === preset.value && isPreset;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePreset(preset.value)}
                className={[
                  "min-h-[56px] rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-foreground/15 text-foreground/70",
                ].join(" ")}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-foreground/50">Atau masukin sendiri</p>
          <div className="flex items-center gap-2 rounded-xl border border-foreground/20 px-3 focus-within:border-foreground/50">
            <span className="text-sm text-foreground/50">Rp</span>
            <input
              className="h-11 flex-1 bg-transparent text-sm outline-none"
              placeholder="150000"
              value={customInput}
              onChange={(e) => handleCustomChange(e.target.value)}
              onFocus={() => {
                if (isPreset) onChange(null);
              }}
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onPress={onSubmit}
          isDisabled={isPending}
          size="lg"
          className="w-full bg-danger font-medium text-white disabled:opacity-40"
        >
          {isPending ? <Spinner size="sm" color="current" /> : "Join Bukber!"}
        </Button>
        <Button
          onPress={() => {
            onChange(null);
            onSubmit();
          }}
          isDisabled={isPending}
          variant="ghost"
          size="lg"
          className="w-full font-medium text-foreground/50"
        >
          Flexible aja
        </Button>
      </div>
    </div>
  );
}
