export type StatTone = "default" | "green" | "amber";

const TONE: Record<StatTone, string> = { default: "text-ink", green: "text-green", amber: "text-amber" };

export function StatTile({ value, label, tone = "default" }: { value: number; label: string; tone?: StatTone }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className={["font-display text-3xl font-semibold", TONE[tone]].join(" ")}>{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>;
}
