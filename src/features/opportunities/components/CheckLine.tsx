import type { ReactNode } from "react";

export type CheckLineStatus = "pass" | "fail" | "watch" | "unknown";

const ICON: Record<CheckLineStatus, { glyph: string; className: string }> = {
  pass: { glyph: "✓", className: "bg-green-bg text-green" },
  fail: { glyph: "✕", className: "bg-red-bg text-red" },
  watch: { glyph: "!", className: "bg-amber-bg text-amber" },
  unknown: { glyph: "?", className: "bg-slate-bg text-slate" },
};

/** One explanation line: a status glyph, the statement, and an optional "(yours: …)" note. */
export function CheckLine({ status, children, yours }: { status: CheckLineStatus; children: ReactNode; yours?: string }) {
  const icon = ICON[status];
  return (
    <li className="flex gap-2.5 text-sm">
      <span
        aria-hidden
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${icon.className}`}
      >
        {icon.glyph}
      </span>
      <div>
        {children} {yours ? <span className="text-muted">{yours}</span> : null}
      </div>
    </li>
  );
}
