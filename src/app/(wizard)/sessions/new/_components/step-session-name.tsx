"use client";

import { useRef, useEffect } from "react";
import { Button, TextField, Label, Input } from "@heroui/react";

interface StepSessionNameProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export function StepSessionName({
  value,
  onChange,
  onNext,
}: StepSessionNameProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = value.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 60;

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Mau bikin bukber apa nih?
        </h2>
        <p className="text-foreground/60">Kasih nama buat bukber lu</p>

        <TextField
          value={value}
          onChange={onChange}
          aria-label="Nama bukber"
        >
          <Label className="sr-only">Nama bukber</Label>
          <Input
            ref={inputRef}
            placeholder='e.g. "Bukber SMA 45"'
            maxLength={60}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) onNext();
            }}
            className="rounded-xl border border-foreground/20 bg-white px-4 py-3 text-lg outline-none focus:border-primary"
          />
        </TextField>

        {trimmed.length > 0 && trimmed.length < 2 && (
          <p className="text-sm text-danger">Minimal 2 karakter ya</p>
        )}
      </div>

      <div className="pb-6 pt-8">
        <Button
          onPress={onNext}
          isDisabled={!isValid}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
