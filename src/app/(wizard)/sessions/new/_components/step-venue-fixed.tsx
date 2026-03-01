"use client";

import { Button, Card } from "@heroui/react";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface StepVenueFixedProps {
  value: boolean | null;
  onChange: (fixed: boolean) => void;
  onNext: () => void;
}

export function StepVenueFixed({ value, onChange, onNext }: StepVenueFixedProps) {
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Tempatnya udah ada pilihan?
        </h2>
        <p className="text-foreground/60">
          Kalau belum, nanti kita bantu cariin yang cocok
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className="text-left"
          >
            <Card
              className={`rounded-2xl border-2 p-0 transition-colors ${
                value === true
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 bg-white"
              }`}
            >
              <Card.Header className="px-5 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-7 w-7 text-foreground/70" />
                  <span className="text-lg font-medium">Udah ada</span>
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5">
                <p className="text-sm text-foreground/60">
                  Gue udah tau mau di mana, tinggal cari tanggal aja
                </p>
              </Card.Content>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => onChange(false)}
            className="text-left"
          >
            <Card
              className={`rounded-2xl border-2 p-0 transition-colors ${
                value === false
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 bg-white"
              }`}
            >
              <Card.Header className="px-5 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <MagnifyingGlassIcon className="h-7 w-7 text-foreground/70" />
                  <span className="text-lg font-medium">Belum</span>
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5">
                <p className="text-sm text-foreground/60">
                  Cari bareng-bareng aja nanti
                </p>
              </Card.Content>
            </Card>
          </button>
        </div>
      </div>

      <div className="pb-6 pt-8">
        <Button
          onPress={onNext}
          isDisabled={value === null}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
