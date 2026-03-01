"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Spinner } from "@heroui/react";

interface StepDatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  onSubmit: () => void;
  isPending: boolean;
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function StepDatePicker({
  selectedDates,
  onChange,
  onSubmit,
  isPending,
}: StepDatePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const toggleDate = useCallback(
    (dateStr: string) => {
      if (selectedSet.has(dateStr)) {
        onChange(selectedDates.filter((d) => d !== dateStr));
      } else {
        onChange([...selectedDates, dateStr]);
      }
    },
    [selectedDates, selectedSet, onChange],
  );

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Don't allow navigating to months before current
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Kapan aja bisa bukber?
        </h2>
        <p className="text-foreground/60">
          Tap tanggal buat pilih, tap lagi buat batal
        </p>

        {/* Month navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/60 disabled:opacity-30"
            aria-label="Bulan sebelumnya"
          >
            ←
          </button>
          <span className="font-medium text-foreground">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/60"
            aria-label="Bulan berikutnya"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center" role="grid">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="py-1 text-xs font-medium text-foreground/40"
              role="columnheader"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }

            const date = new Date(viewYear, viewMonth, day);
            const dateStr = formatYMD(date);
            const isPast = date < today;
            const isSelected = selectedSet.has(dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                disabled={isPast}
                onClick={() => !isPast && toggleDate(dateStr)}
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isPast
                    ? "cursor-default text-foreground/20"
                    : isSelected
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-foreground/5"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        {selectedDates.length > 0 && (
          <p className="text-center text-sm font-medium text-primary">
            {selectedDates.length} tanggal dipilih
          </p>
        )}
      </div>

      <div className="pb-6 pt-8">
        <Button
          onPress={onSubmit}
          isDisabled={selectedDates.length === 0 || isPending}
          className="w-full rounded-xl bg-danger py-3 font-medium text-white disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-white" />
              Lagi bikin...
            </span>
          ) : (
            "Bikin Bukber!"
          )}
        </Button>
      </div>
    </div>
  );
}
