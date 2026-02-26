export default function SessionLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-foreground/10" />
      <div className="h-32 animate-pulse rounded-2xl bg-foreground/10" />
      <div className="h-32 animate-pulse rounded-2xl bg-foreground/10" />
    </div>
  );
}
