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
  const topVenue = venues[0];
  const topDate = dates[0];

  const [selectedVenueId, setSelectedVenueId] = useState(topVenue?.id ?? "");
  const [selectedDateId, setSelectedDateId] = useState(topDate?.id ?? "");
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
    } else {
      const venue = venues.find((v) => v.id === selectedVenueId);
      const date = dates.find((d) => d.id === selectedDateId);
      const loc = venue?.location as { lat?: number; lng?: number } | null;
      const googleMapsUrl =
        loc?.lat && loc?.lng
          ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
          : undefined;
      setConfirmedInfo({
        venueName: venue?.name ?? "venue",
        dateStr: date ? formatDateShort(date.date) : "",
        sessionName,
        googleMapsUrl,
      });
    }
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
        /* ── Step 1: Bottom sheet ── */
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

          {venues.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground/50">
              Belum ada venue nih. Tambahin dulu ya! 🍛
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Venue
              </p>
              {venues.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => setSelectedVenueId(venue.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedVenueId === venue.id
                      ? "border-gold bg-gold/10"
                      : "border-foreground/15 bg-white"
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {venue.name}
                  </span>
                  {selectedVenueId === venue.id && (
                    <span className="text-gold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {dates.length === 0 ? (
            <p className="py-2 text-center text-sm text-foreground/50">
              Belum ada tanggal. Tambahin dulu ya!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Tanggal
              </p>
              {dates.map((date) => (
                <button
                  key={date.id}
                  type="button"
                  onClick={() => setSelectedDateId(date.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedDateId === date.id
                      ? "border-gold bg-gold/10"
                      : "border-foreground/15 bg-white"
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {formatDateShort(date.date)}
                  </span>
                  {selectedDateId === date.id && (
                    <span className="text-gold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-coral">{error}</p>}

          <button
            type="button"
            onClick={() => {
              if (!selectedVenueId || !selectedDateId) return;
              setStep(2);
            }}
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
      ) : (
        /* ── Step 2: Confirmation modal ── */
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 px-5"
          onClick={() => setStep(1)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#FFF8F0] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <p className="mb-2 text-2xl">📣</p>
              <h3 className="text-base font-bold text-foreground">
                Yakin nih?
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                Semua orang bakal dikabarin kalau bukber udah fix.
              </p>
            </div>

            {error && (
              <p className="text-center text-xs text-coral">{error}</p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-coral py-3.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Lagi proses..." : "Confirm 🎉"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="py-1 text-center text-sm text-foreground/50"
            >
              Eh, bentar dulu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
