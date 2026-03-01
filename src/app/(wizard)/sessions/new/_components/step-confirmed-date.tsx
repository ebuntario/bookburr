"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import { CalendarGrid, formatYMD } from "@/components/calendar-grid";
import { EID_2026 } from "@/lib/constants";

interface StepConfirmedDateProps {
  value: string | null;
  onChange: (date: string | null) => void;
  onNext: () => void;
}

export function StepConfirmedDate({
  value,
  onChange,
  onNext,
}: StepConfirmedDateProps) {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  }, []);

  const selectedSet = useMemo(
    () => (value ? new Set([value]) : new Set<string>()),
    [value],
  );

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Tanggal berapa nih?
        </h2>
        <p className="text-foreground/60">Pilih satu tanggal yang udah fix</p>

        <CalendarGrid
          selectedDates={selectedSet}
          onDateTap={(dateStr) => {
            onChange(selectedSet.has(dateStr) ? null : dateStr);
          }}
          rangeStart={tomorrow}
          rangeEnd={EID_2026}
        />

        {value && (
          <p className="text-center text-sm font-medium text-primary">
            {new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        )}
      </div>

      <div className="pb-6 pt-8">
        <Button
          onPress={onNext}
          isDisabled={!value}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
