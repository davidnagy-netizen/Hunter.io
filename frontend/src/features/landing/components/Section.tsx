import type { ReactNode } from "react";

export interface SectionProps {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/**
 * The one wrapper every marketing section below the hero shares: the same
 * container width and side padding, plus the optional kicker/title/subtitle
 * header block most of them use (`PriceTeaser` opts out of the header block
 * and supplies its own). Exists so a later pass over spacing and type scale
 * touches this one file instead of several near-identical ad hoc sections.
 *
 * Vertical padding (`py-*`) is still passed per section via `className` —
 * normalizing that rhythm site-wide is a token decision for later, not this
 * file's job.
 */
export function Section({ id, kicker, title, subtitle, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={["mx-auto max-w-5xl px-6", className].filter(Boolean).join(" ")}>
      {kicker ? <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{kicker}</p> : null}
      {title ? (
        <h2 className={["font-display text-3xl font-semibold text-ink", kicker ? "mt-2" : ""].filter(Boolean).join(" ")}>{title}</h2>
      ) : null}
      {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
      {children}
    </section>
  );
}
