"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";

interface StepLocationProps {
  value: string;
  lat?: number;
  lng?: number;
  onChange: (location: string, lat?: number, lng?: number) => void;
  onNext: () => void;
}

export function StepLocation({
  value,
  lat,
  lng,
  onChange,
  onNext,
}: StepLocationProps) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setGeoError("Browser lu nggak support GPS nih");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        onChange("Lokasi lu sekarang", pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoLoading(false);
        setGeoError("Gabisa akses lokasi, ketik aja manual");
      },
    );
  }

  const canContinue = !!value.trim() || (lat != null && lng != null);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">
          Bukber deket mana enaknya buat lu?
        </h2>
        <p className="text-sm text-foreground/60">
          Biar venue-nya pas buat semua
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground/60">
            Area atau nama tempat
          </label>
          <Input
            placeholder="cth: Sudirman, Kemang, Depok..."
            value={value}
            onChange={(e) => {
              onChange(e.target.value, undefined, undefined);
            }}
            fullWidth
          />
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={geoLoading}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-foreground/20 px-4 py-3 text-sm font-medium text-foreground/70 transition-opacity disabled:opacity-50"
        >
          {geoLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground/70" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
          {geoLoading ? "Lagi ambil lokasi..." : "Pakai lokasi gue"}
        </button>

        {geoError && (
          <p className="text-sm text-coral">{geoError}</p>
        )}

        {lat != null && lng != null && value === "Lokasi lu sekarang" && (
          <p className="text-sm text-teal">Lokasi berhasil diambil ✓</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onPress={onNext}
          isDisabled={!canContinue}
          size="lg"
          className="w-full bg-coral font-semibold text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
        <Button
          onPress={() => {
            onChange("", undefined, undefined);
            onNext();
          }}
          variant="ghost"
          size="lg"
          className="w-full font-medium text-foreground/50"
        >
          Skip dulu
        </Button>
      </div>
    </div>
  );
}
