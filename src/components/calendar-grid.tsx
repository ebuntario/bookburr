"use client";

import { useState, useCallback, useMemo } from "react";

export function formatYMD(date: Date): string {
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

interface CalendarGridProps {
  /** Selected dates (YYYY-MM-DD strings) */
  selectedDates: Set<string>;
  /** Called when a date cell is tapped */
  onDateTap: (dateStr: string) => void;
  /** Optional: dates that are highlighted but not selected (e.g. seeded by host) */
  highlightedDates?: Set<string>;
  /** Optional: only these dates are tappable (when dates are locked) */
  tappableDates?: Set<string> | null;
  /** Optional: lower bound for the calendar (YYYY-MM-DD) */
  rangeStart?: string | null;
  /** Optional: upper bound for the calendar (YYYY-MM-DD) */
  rangeEnd?: string | null;
  /** Whether to allow selecting multiple dates (default true) */
  multiSelect?: boolean;
  /** Optional: custom cell renderer for additional badges/indicators */
  renderCellExtra?: (dateStr: string) => React.ReactNode;
  /** Optional: custom class for selected cells */
  selectedClass?: string;
}

export function CalendarGrid({
  selectedDates,
  onDateTap,
  highlightedDates,
  tappableDates,
  rangeStart,
  rangeEnd,
  renderCellExtra,
  selectedClass = "bg-primary text-white",
}: CalendarGridProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Parse range bounds
  const startBound = useMemo(
    () => (rangeStart ? new Date(rangeStart + "T00:00:00") : null),
    [rangeStart],
  );
  const endBound = useMemo(
    () => (rangeEnd ? new Date(rangeEnd + "T00:00:00") : null),
    [rangeEnd],
  );

  // Default initial view to rangeStart month or today
  const initialDate = startBound ?? today;
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  // Navigation bounds
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const canGoNext = endBound
    ? viewYear < endBound.getFullYear() ||
      (viewYear === endBound.getFullYear() &&
        viewMonth < endBound.getMonth())
    : true;

  // Calendar grid cells
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
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
          disabled={!canGoNext}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/60 disabled:opacity-30"
          aria-label="Bulan berikutnya"
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center" role="grid">
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
          const isBeforeRange = startBound ? date < startBound : false;
          const isAfterRange = endBound ? date > endBound : false;
          const isOutOfRange = isBeforeRange || isAfterRange;

          // If tappableDates is specified, only those dates are tappable
          const isLocked =
            tappableDates !== null &&
            tappableDates !== undefined &&
            !tappableDates.has(dateStr);

          const isDisabled = isPast || isOutOfRange || isLocked;
          const isSelected = selectedDates.has(dateStr);
          const isHighlighted = highlightedDates?.has(dateStr) ?? false;

          return (
            <div key={dateStr} className="relative flex items-center justify-center">
              <button
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                disabled={isDisabled}
                onClick={() => !isDisabled && onDateTap(dateStr)}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isDisabled
                    ? "cursor-default text-foreground/20"
                    : isSelected
                      ? selectedClass
                      : isHighlighted
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-foreground/5"
                }`}
              >
                {day}
              </button>
              {renderCellExtra?.(dateStr)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
