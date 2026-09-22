import type { ReactNode } from "react";

/**
 * The small monospace label used above every section title, and the hero's
 * own eyebrow. Replaces the earlier rounded pill badge — a small square dot
 * plus a technical, uppercase, tightly-tracked mono face reads as considered
 * rather than as a generic template decoration.
 */
export function Kicker({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[-0.01em]",
        tone === "dark" ? "text-white/55" : "text-gold-deep",
      ].join(" ")}
    >
      <span aria-hidden className="size-1.5 shrink-0 bg-gold" />
      {children}
    </span>
  );
}
