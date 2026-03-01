"use client";

import { Button, Card } from "@heroui/react";
import { UserGroupIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import type { SessionMode } from "@/lib/constants";

interface StepSessionModeProps {
  value: SessionMode | null;
  onChange: (mode: SessionMode) => void;
  onNext: () => void;
}

export function StepSessionMode({
  value,
  onChange,
  onNext,
}: StepSessionModeProps) {
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Tipe bukber-nya apa?
        </h2>
        <p className="text-foreground/60">
          Ini ngaruh ke cara milih lokasi nanti
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => onChange("personal")}
            className="text-left"
          >
            <Card
              className={`rounded-2xl border-2 p-0 transition-colors ${
                value === "personal"
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 bg-white"
              }`}
            >
              <Card.Header className="px-5 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-7 w-7 text-foreground/70" />
                  <span className="text-lg font-medium">Personal</span>
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5">
                <p className="text-sm text-foreground/60">
                  Bukber temen, keluarga, komunitas — lokasi ditentuin dari
                  lokasi masing-masing
                </p>
              </Card.Content>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => onChange("work")}
            className="text-left"
          >
            <Card
              className={`rounded-2xl border-2 p-0 transition-colors ${
                value === "work"
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 bg-white"
              }`}
            >
              <Card.Header className="px-5 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <BriefcaseIcon className="h-7 w-7 text-foreground/70" />
                  <span className="text-lg font-medium">Work</span>
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5">
                <p className="text-sm text-foreground/60">
                  Bukber kantor — lokasi ditentuin dari alamat kantor
                </p>
              </Card.Content>
            </Card>
          </button>
        </div>
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
