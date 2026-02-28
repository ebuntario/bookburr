"use client";

import { useState } from "react";
import { confirmSession } from "@/lib/actions/session-status";
import { CelebrationOverlay } from "./celebration-overlay";
import { formatDateShort } from "@/lib/format-utils";

interface Venue {
  id: string;
  name: string;
  compositeScore: number;
  location?: unknown;
}

interface DateOption {
  id: string;
  date: string;
}

// ── SelectableList sub-component ───────────────────────────────────────────

function SelectableList<T extends { id: string }>({
  label,
  emptyMessage,
  items,
  selectedId,
  onSelect,
  renderLabel,
}: {
  label: string;
  emptyMessage: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderLabel: (item: T) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-foreground/50">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
            selectedId === item.id
              ? "border-gold bg-gold/10"
              : "border-foreground/15 bg-white"
          }`}
        >
          <span className="text-sm font-medium text-foreground">
            {renderLabel(item)}
          </span>
          {selectedId === item.id && <span className="text-gold">✓</span>}
        </button>
      ))}
    </div>
  );
}

// ── SelectionStep sub-component ────────────────────────────────────────────

function SelectionStep({
  venues,
  dates,
  selectedVenueId,
  selectedDateId,
  error,
  onSelectVenue,
  onSelectDate,
  onNext,
  onClose,
}: {
  venues: Venue[];
  dates: DateOption[];
  selectedVenueId: string;
  selectedDateId: string;
  error: string | null;
  onSelectVenue: (id: string) => void;
  onSelectDate: (id: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="w-full rounded-t-2xl bg-[#FFF8F0] px-5 pb-8 pt-5 shadow-xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          Pilih Venue &amp; Tanggal
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-foreground/40"
        >
          Batal
        </button>
      </div>

      <SelectableList
        label="Venue"
        emptyMessage="Belum ada venue nih. Tambahin dulu ya! 🍛"
        items={venues}
        selectedId={selectedVenueId}
        onSelect={onSelectVenue}
        renderLabel={(v) => v.name}
      />

      <SelectableList
        label="Tanggal"
        emptyMessage="Belum ada tanggal. Tambahin dulu ya!"
        items={dates}
        selectedId={selectedDateId}
        onSelect={onSelectDate}
        renderLabel={(d) => formatDateShort(d.date)}
      />

      {error && <p className="text-xs text-coral">{error}</p>}

      <button
        type="button"
        onClick={onNext}
        disabled={
          !selectedVenueId ||
          !selectedDateId ||
          venues.length === 0 ||
          dates.length === 0
        }
        className="flex w-full items-center justify-center rounded-xl bg-gold py-3.5 text-sm font-semibold text-background disabled:opacity-40"
      >
        Ya, confirm ini! 🎉
      </button>
    </div>
  );
}

// ── ConfirmationDialog sub-component ───────────────────────────────────────

function ConfirmationDialog({
  loading,
  error,
  onConfirm,
  onBack,
}: {
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 px-5"
      onClick={onBack}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#FFF8F0] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="mb-2 text-2xl">📣</p>
          <h3 className="text-base font-bold text-foreground">Yakin nih?</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Semua orang bakal dikabarin kalau bukber udah fix.
          </p>
        </div>

        {error && <p className="text-center text-xs text-coral">{error}</p>}

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-coral py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Lagi proses..." : "Confirm 🎉"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="py-1 text-center text-sm text-foreground/50"
        >
          Eh, bentar dulu
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function buildGoogleMapsUrl(venue: Venue | undefined): string | undefined {
  const loc = venue?.location as { lat?: number; lng?: number } | null;
  return loc?.lat && loc?.lng
    ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
    : undefined;
}

interface ConfirmSessionSheetProps {
  sessionId: string;
  sessionName: string;
  venues: Venue[];
  dates: DateOption[];
  onClose: () => void;
  onConfirmed: () => void;
}

export function ConfirmSessionSheet({
  sessionId,
  sessionName,
  venues,
  dates,
  onClose,
  onConfirmed,
}: ConfirmSessionSheetProps) {
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id ?? "");
  const [selectedDateId, setSelectedDateId] = useState(dates[0]?.id ?? "");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedInfo, setConfirmedInfo] = useState<{
    venueName: string;
    dateStr: string;
    sessionName: string;
    googleMapsUrl?: string;
  } | null>(null);

  const handleConfirm = async () => {
    if (!selectedVenueId || !selectedDateId) return;
    setLoading(true);
    setError(null);
    const result = await confirmSession({
      sessionId,
      venueId: selectedVenueId,
      dateOptionId: selectedDateId,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setStep(1);
      return;
    }
    const venue = venues.find((v) => v.id === selectedVenueId);
    const date = dates.find((d) => d.id === selectedDateId);
    setConfirmedInfo({
      venueName: venue?.name ?? "venue",
      dateStr: date ? formatDateShort(date.date) : "",
      sessionName,
      googleMapsUrl: buildGoogleMapsUrl(venue),
    });
  };

  if (confirmedInfo) {
    return (
      <CelebrationOverlay
        venueName={confirmedInfo.venueName}
        dateStr={confirmedInfo.dateStr}
        sessionName={confirmedInfo.sessionName}
        googleMapsUrl={confirmedInfo.googleMapsUrl}
        onClose={() => {
          setConfirmedInfo(null);
          onConfirmed();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={step === 1 ? onClose : undefined}
    >
      {step === 1 ? (
        <SelectionStep
          venues={venues}
          dates={dates}
          selectedVenueId={selectedVenueId}
          selectedDateId={selectedDateId}
          error={error}
          onSelectVenue={setSelectedVenueId}
          onSelectDate={setSelectedDateId}
          onNext={() => setStep(2)}
          onClose={onClose}
        />
      ) : (
        <ConfirmationDialog
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
}
