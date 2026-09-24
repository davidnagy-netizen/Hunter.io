import type { ReactNode } from "react";

/**
 * The small monospace label used above every section title, and the hero's
 * own eyebrow. Replaces the earlier rounded pill badge — a small square dot
 * plus a technical, uppercase, tightly-tracked mono face reads as considered
 * rather than as a generic template decoration.
 */
export function Kicker({
  children,
  tone = "light",
  pulse = false,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  /** A "live" ping ring behind the dot — the hero's own kicker only, not every section's: repeated
   * everywhere it would just be noise instead of a signal. */
  pulse?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[-0.01em]",
        tone === "dark" ? "text-white/55" : "text-gold-deep",
      ].join(" ")}
    >
      <span aria-hidden className="relative flex size-1.5 shrink-0">
        {pulse ? <span className="absolute inset-0 motion-safe:animate-ping motion-safe:bg-gold/70" /> : null}
        <span className="relative size-1.5 shrink-0 bg-gold" />
      </span>
      {children}
    </span>
  );
}
