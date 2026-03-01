"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import { CalendarGrid, formatYMD } from "@/components/calendar-grid";
import { EID_2026 } from "@/lib/constants";

interface StepDateSeedingProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepDateSeeding({
  selectedDates,
  onChange,
  onNext,
  onSkip,
}: StepDateSeedingProps) {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedDates),
    [selectedDates],
  );

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Mau kasih clue tanggal?
        </h2>
        <p className="text-foreground/60">
          Pilih beberapa tanggal kandidat, atau skip biar anak-anak yang masukin
        </p>

        <CalendarGrid
          selectedDates={selectedSet}
          onDateTap={(dateStr) => {
            if (selectedSet.has(dateStr)) {
              onChange(selectedDates.filter((d) => d !== dateStr));
            } else {
              onChange([...selectedDates, dateStr]);
            }
          }}
          rangeStart={tomorrow}
          rangeEnd={EID_2026}
        />

        {selectedDates.length > 0 && (
          <p className="text-center text-sm font-medium text-primary">
            {selectedDates.length} tanggal dipilih
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-6 pt-8">
        <Button
          onPress={onNext}
          isDisabled={selectedDates.length === 0}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
        <Button
          onPress={onSkip}
          variant="ghost"
          className="w-full rounded-xl py-3 text-sm font-medium text-foreground/50"
        >
          Skip dulu, biar mereka yang pilih
        </Button>
      </div>
    </div>
  );
}
