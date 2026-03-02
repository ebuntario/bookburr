import { SparklesIcon } from "@heroicons/react/24/solid";

interface DateScoreBadgeProps {
  provisional?: boolean;
}

export function DateScoreBadge({ provisional = false }: DateScoreBadgeProps) {
  return (
    <span className="flex items-center gap-1 shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
      <SparklesIcon className="h-3 w-3" /> {provisional ? "Lagi Unggul" : "Pilihan Terbaik"}
    </span>
  );
}
