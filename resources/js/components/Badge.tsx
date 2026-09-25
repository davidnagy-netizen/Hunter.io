import type { ReactNode } from "react";

/**
 * Semantic tone, not a domain verdict. A feature maps its own status enum
 * (e.g. eligibility's ELIGIBLE/CONDITIONAL/...) onto one of these tones —
 * this component has no knowledge of what "eligible" means.
 */
export type BadgeTone = "green" | "amber" | "red" | "slate" | "gold" | "blue";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-green-bg text-green",
  amber: "bg-amber-bg text-amber",
  red: "bg-red-bg text-red",
  slate: "bg-slate-bg text-slate",
  gold: "bg-gold-bg text-gold-deep",
  blue: "bg-blue-bg text-blue",
};

export function Badge({ tone = "slate", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
