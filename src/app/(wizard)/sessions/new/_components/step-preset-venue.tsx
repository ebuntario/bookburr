"use client";

import { useRef, useEffect } from "react";
import { Button, TextField, Label, Input } from "@heroui/react";

interface StepPresetVenueProps {
  venueName: string;
  venueAddress: string;
  onChangeName: (name: string) => void;
  onChangeAddress: (address: string) => void;
  onNext: () => void;
}

export function StepPresetVenue({
  venueName,
  venueAddress,
  onChangeName,
  onChangeAddress,
  onNext,
}: StepPresetVenueProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Bukber-nya di mana?
          </h2>
          <p className="text-foreground/60">
            Masukin nama restonya
          </p>
        </div>

        <TextField
          value={venueName}
          onChange={onChangeName}
          aria-label="Nama venue"
        >
          <Label className="text-sm font-medium text-foreground/60">
            Nama resto/tempat
          </Label>
          <Input
            ref={inputRef}
            placeholder='e.g. "Restoran Padang Sederhana"'
            className="rounded-xl border border-foreground/20 bg-white px-4 py-3 text-lg outline-none focus:border-primary"
          />
        </TextField>

        <TextField
          value={venueAddress}
          onChange={onChangeAddress}
          aria-label="Alamat venue"
        >
          <Label className="text-sm font-medium text-foreground/60">
            Alamat (opsional)
          </Label>
          <Input
            placeholder='e.g. "Jl. Sudirman No. 10, Jakarta"'
            onKeyDown={(e) => {
              if (e.key === "Enter") onNext();
            }}
            className="rounded-xl border border-foreground/20 bg-white px-4 py-3 text-lg outline-none focus:border-primary"
          />
        </TextField>
      </div>

      <div className="pb-6 pt-8">
        <Button
          onPress={onNext}
          isDisabled={!venueName.trim()}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
