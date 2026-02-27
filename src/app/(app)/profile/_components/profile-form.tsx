"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { MARITAL_STATUS } from "@/lib/constants";

const DIETARY_OPTIONS = [
  { value: "halal", label: "Halal" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "no_pork", label: "No Babi" },
  { value: "no_seafood", label: "No Seafood" },
  { value: "no_shellfish", label: "No Kerang" },
  { value: "no_nuts", label: "No Kacang" },
  { value: "lactose_free", label: "Lactose Free" },
];

const CUISINE_OPTIONS = [
  { value: "indonesian", label: "🇮🇩 Indonesia" },
  { value: "japanese", label: "🇯🇵 Jepang" },
  { value: "korean", label: "🇰🇷 Korea" },
  { value: "chinese", label: "🇨🇳 Chinese" },
  { value: "italian", label: "🇮🇹 Italia" },
  { value: "thai", label: "🇹🇭 Thailand" },
  { value: "indian", label: "🇮🇳 India" },
  { value: "western", label: "🍔 Western" },
  { value: "seafood", label: "🦞 Seafood" },
  { value: "middle_eastern", label: "🥙 Middle East" },
];

interface ProfileFormProps {
  name: string | null;
  email: string;
  maritalStatus: string | null;
  dietaryPreferences: string[];
  defaultCuisinePreferences: string[];
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function ProfileForm({
  name: initialName,
  email,
  maritalStatus: initialMarital,
  dietaryPreferences: initialDietary,
  defaultCuisinePreferences: initialCuisine,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [maritalStatus, setMaritalStatus] = useState<string | null>(
    initialMarital,
  );
  const [dietary, setDietary] = useState<string[]>(initialDietary);
  const [cuisine, setCuisine] = useState<string[]>(initialCuisine);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateProfile({
      name,
      maritalStatus,
      dietaryPreferences: dietary,
      defaultCuisinePreferences: cuisine,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor="profile-name">
          Nama
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lu..."
          className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {/* Email (read-only) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">Email</label>
        <div className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/50">
          {email}
        </div>
      </div>

      {/* Marital Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Status
        </label>
        <div className="flex gap-2">
          {[
            { value: MARITAL_STATUS.single, label: "💙 Belum nikah" },
            { value: MARITAL_STATUS.married, label: "💛 Udah nikah" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setMaritalStatus(
                  maritalStatus === opt.value ? null : opt.value,
                )
              }
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                maritalStatus === opt.value
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-foreground/15 bg-white text-foreground/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/40">
          Biar algoritma tahu seberapa fleksibel lu
        </p>
      </div>

      {/* Dietary Preferences */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">
          Dietary Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDietary(toggleItem(dietary, opt.value))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                dietary.includes(opt.value)
                  ? "border-teal bg-teal/15 text-teal"
                  : "border-foreground/15 bg-white text-foreground/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/40">
          Biar ga ada venue yang ga cocok buat lu
        </p>
      </div>

      {/* Cuisine Preferences */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">
          Suka Masakan Apa?
        </label>
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCuisine(toggleItem(cuisine, opt.value))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                cuisine.includes(opt.value)
                  ? "border-coral bg-coral/15 text-coral"
                  : "border-foreground/15 bg-white text-foreground/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/40">
          Buat nyari venue yang sesuai selera
        </p>
      </div>

      {error && <p className="text-xs text-coral">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center rounded-xl bg-gold py-3.5 text-sm font-semibold text-background transition-opacity active:opacity-70 disabled:opacity-50"
      >
        {saving ? "Lagi nyimpen..." : saved ? "✓ Tersimpan!" : "Simpan"}
      </button>
    </div>
  );
}
