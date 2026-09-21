export type KpiTone = "default" | "green" | "amber" | "gold";

const TONE: Record<KpiTone, string> = { default: "text-ink", green: "text-green", amber: "text-amber", gold: "text-gold-deep" };

/** A headline number with the sentence that explains where it comes from. `value` may already be formatted (money, a dash). */
export function KpiTile({ value, label, sub, tone = "default" }: { value: string | number; label: string; sub: string; tone?: KpiTone }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className={["font-display text-2xl font-semibold", TONE[tone]].join(" ")}>{value}</div>
      <div className="mt-0.5 text-sm font-medium text-text">{label}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}
