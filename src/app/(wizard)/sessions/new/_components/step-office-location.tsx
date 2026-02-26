"use client";

import { useRef, useEffect } from "react";
import { Button, TextField, Label, Input } from "@heroui/react";

interface StepOfficeLocationProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export function StepOfficeLocation({
  value,
  onChange,
  onNext,
}: StepOfficeLocationProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Kantor-nya di mana?
        </h2>
        <p className="text-foreground/60">
          Biar kita cari resto yang deket kantor
        </p>

        <TextField
          value={value}
          onChange={onChange}
          aria-label="Alamat kantor"
        >
          <Label className="sr-only">Alamat kantor</Label>
          <Input
            ref={inputRef}
            placeholder='e.g. "Sudirman, Jakarta Selatan"'
            onKeyDown={(e) => {
              if (e.key === "Enter") onNext();
            }}
            className="rounded-xl border border-foreground/20 bg-white px-4 py-3 text-lg outline-none focus:border-gold"
          />
        </TextField>
      </div>

      <div className="flex flex-col gap-3 pb-6 pt-8">
        <Button
          onPress={onNext}
          className="w-full rounded-xl bg-coral py-3 font-semibold text-white"
        >
          Lanjut
        </Button>
        <Button
          onPress={onNext}
          variant="ghost"
          className="w-full rounded-xl py-3 text-sm font-medium text-foreground/50"
        >
          Skip dulu
        </Button>
      </div>
    </div>
  );
}
