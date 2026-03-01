"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { backdropFade, sheetSlideUp, springs } from "@/lib/motion-variants";
import {
  CheckCircleIcon,
  CheckIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { confirmSession } from "@/lib/actions/session-status";
import { CelebrationOverlay } from "./celebration-overlay";
import { formatDateShort } from "@/lib/format-utils";
import type { ConfirmableVenue, ConfirmableDateOption } from "./types";

// ── SelectableList sub-component ───────────────────────────────────────────

function SelectableList<T extends { id: string }>({
  label,
  emptyMessage,
  items,
  selectedId,
  onSelect,
  renderLabel,
  bestId,
}: {
  label: string;
  emptyMessage: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderLabel: (item: T) => React.ReactNode;
  bestId?: string;
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
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            {renderLabel(item)}
            {bestId === item.id && (
              <span className="inline-block w-fit rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                Pilihan Terbaik
              </span>
            )}
          </div>
          {selectedId === item.id && <CheckIcon className="h-5 w-5 text-gold shrink-0 ml-2" />}
        </button>
      ))}
    </div>
  );
}

// ── ConsensusWarning sub-component ─────────────────────────────────────────

function ConsensusWarning({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-xl bg-gold/10 px-3 py-2 text-xs text-foreground/70">
      Eh ini bukan yang paling banyak dipilih loh — yakin mau?
    </p>
  );
}

// ── SelectionStep sub-component ────────────────────────────────────────────

function SelectionStep({
  venues,
  dates,
  selectedVenueId,
  selectedDateId,
  bestVenueId,
  bestDateId,
  error,
  onSelectVenue,
  onSelectDate,
  onNext,
  onClose,
}: {
  venues: ConfirmableVenue[];
  dates: ConfirmableDateOption[];
  selectedVenueId: string;
  selectedDateId: string;
  bestVenueId: string;
  bestDateId: string;
  error: string | null;
  onSelectVenue: (id: string) => void;
  onSelectDate: (id: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const venueNotBest = selectedVenueId && selectedVenueId !== bestVenueId;
  const dateNotBest = selectedDateId && selectedDateId !== bestDateId;

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
        emptyMessage="Belum ada venue nih. Tambahin dulu ya!"
        items={venues}
        selectedId={selectedVenueId}
        onSelect={onSelectVenue}
        bestId={bestVenueId}
        renderLabel={(v) => (
          <>
            <span className="text-sm font-medium text-foreground truncate">
              {v.name}
            </span>
            <span className="text-xs text-foreground/50">
              {v.voteCount} vote{v.voteCount !== 1 ? "s" : ""}
              {v.compositeScore > 0 && <> · <SparklesIcon className="h-3 w-3 inline text-gold" /> {v.compositeScore.toFixed(1)}</>}
            </span>
          </>
        )}
      />

      <ConsensusWarning show={!!venueNotBest} />

      <SelectableList
        label="Tanggal"
        emptyMessage="Belum ada tanggal. Tambahin dulu ya!"
        items={dates}
        selectedId={selectedDateId}
        onSelect={onSelectDate}
        bestId={bestDateId}
        renderLabel={(d) => (
          <>
            <span className="text-sm font-medium text-foreground">
              {formatDateShort(d.date)}
            </span>
            <span className="text-xs">
              <span className="text-gold">{d.stronglyPrefer} bisa banget</span>
              {" · "}
              <span className="text-teal">{d.canDo} bisa</span>
              {" · "}
              <span className="text-coral">{d.unavailable} gabisa</span>
            </span>
          </>
        )}
      />

      <ConsensusWarning show={!!dateNotBest} />

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
        <CheckCircleIcon className="h-5 w-5 inline" /> Ya, confirm ini!
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
          <MegaphoneIcon className="mx-auto mb-2 h-8 w-8 text-coral" />
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
          {loading ? "Lagi proses..." : <><CheckCircleIcon className="h-5 w-5 inline" /> Confirm</>}
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

function buildGoogleMapsUrl(venue: ConfirmableVenue | undefined): string | undefined {
  const loc = venue?.location as { lat?: number; lng?: number } | null;
  return loc?.lat && loc?.lng
    ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
    : undefined;
}

interface ConfirmSessionSheetProps {
  sessionId: string;
  sessionName: string;
  venues: ConfirmableVenue[];
  dates: ConfirmableDateOption[];
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
  const sortedVenues = [...venues].sort(
    (a, b) => b.compositeScore - a.compositeScore,
  );
  const sortedDates = [...dates].sort((a, b) => b.dateScore - a.dateScore);

  const bestVenueId = sortedVenues[0]?.id ?? "";
  const bestDateId = sortedDates[0]?.id ?? "";

  const [selectedVenueId, setSelectedVenueId] = useState(bestVenueId);
  const [selectedDateId, setSelectedDateId] = useState(bestDateId);
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
    const venue = sortedVenues.find((v) => v.id === selectedVenueId);
    const date = sortedDates.find((d) => d.id === selectedDateId);
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
    <motion.div
      {...backdropFade}
      className="fixed inset-0 z-50 flex items-end bg-foreground/30"
      onClick={step === 1 ? onClose : undefined}
    >
      {step === 1 ? (
        <motion.div
          {...sheetSlideUp}
          transition={springs.sheet}
          className="w-full"
        >
        <SelectionStep
          venues={sortedVenues}
          dates={sortedDates}
          selectedVenueId={selectedVenueId}
          selectedDateId={selectedDateId}
          bestVenueId={bestVenueId}
          bestDateId={bestDateId}
          error={error}
          onSelectVenue={setSelectedVenueId}
          onSelectDate={setSelectedDateId}
          onNext={() => setStep(2)}
          onClose={onClose}
        />
        </motion.div>
      ) : (
        <ConfirmationDialog
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
          onBack={() => setStep(1)}
        />
      )}
    </motion.div>
  );
}
