"use client";

import { useState } from "react";
import { UserIcon, UsersIcon, CheckIcon } from "@heroicons/react/24/outline";
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

function OptionPills({
  items,
  selected,
  onToggle,
  colorClass,
}: {
  items: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  colorClass: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onToggle(opt.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            selected.includes(opt.value)
              ? colorClass
              : "border-foreground/15 bg-white text-foreground/60"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
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
        <label className="text-sm font-medium text-foreground" htmlFor="profile-name">
          Nama
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder=""
          className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Email (read-only) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Email</label>
        <div className="w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/50">
          {email}
        </div>
      </div>

      {/* Marital Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Status Pernikahan
        </label>
        <div className="flex gap-2">
          {[
            { value: MARITAL_STATUS.single, label: "Single", Icon: UserIcon },
            { value: MARITAL_STATUS.married, label: "Menikah", Icon: UsersIcon },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setMaritalStatus(
                  maritalStatus === opt.value ? null : opt.value,
                )
              }
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                maritalStatus === opt.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-foreground/15 bg-white text-foreground/60"
              }`}
            >
              <opt.Icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/40">
          Membantu algoritma menentukan fleksibilitas jadwal kamu
        </p>
      </div>

      {/* Dietary Preferences */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Pantangan Makanan
        </label>
        <OptionPills
          items={DIETARY_OPTIONS}
          selected={dietary}
          onToggle={(v) => setDietary(toggleItem(dietary, v))}
          colorClass="border-teal bg-teal/15 text-teal"
        />
        <p className="text-xs text-foreground/40">
          Agar venue yang tidak sesuai bisa difilter
        </p>
      </div>

      {/* Cuisine Preferences */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Preferensi Masakan
        </label>
        <OptionPills
          items={CUISINE_OPTIONS}
          selected={cuisine}
          onToggle={(v) => setCuisine(toggleItem(cuisine, v))}
          colorClass="border-danger bg-danger/15 text-danger"
        />
        <p className="text-xs text-foreground/40">
          Untuk mencocokkan venue dengan selera kamu
        </p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-medium text-background transition-opacity active:opacity-70 disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : saved ? <><CheckIcon className="h-4 w-4 inline" /> Tersimpan!</> : "Simpan"}
      </button>
    </div>
  );
}
