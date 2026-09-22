import type { ReactNode } from "react";
import { Kicker } from "./Kicker";

export interface SectionProps {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Which chapter this section sits in — decides the kicker/title/subtitle colors. The page's default chapters are light. */
  tone?: "light" | "dark";
}

/**
 * The one wrapper every marketing section below the hero shares: the same
 * container width and side padding, plus the optional kicker/title/subtitle
 * header block most of them use (`PriceTeaser` opts out of the header block
 * and supplies its own) and the shared `Kicker` treatment. Exists so a
 * later pass over spacing and type scale touches this one file instead of
 * several near-identical ad hoc sections.
 *
 * Vertical padding (`py-*`) is still passed per section via `className` —
 * normalizing that rhythm site-wide is a token decision for later, not this
 * file's job.
 */
export function Section({ id, kicker, title, subtitle, children, className = "", tone = "light" }: SectionProps) {
  const dark = tone === "dark";
  return (
    <section id={id} className={["mx-auto max-w-5xl px-6", className].filter(Boolean).join(" ")}>
      {kicker ? <Kicker tone={tone}>{kicker}</Kicker> : null}
      {title ? (
        <h2
          className={[
            "font-display text-[32px] font-bold leading-[1.05] tracking-[-0.025em]",
            dark ? "text-white" : "text-ink",
            kicker ? "mt-3" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? <p className={["mt-3 text-[15.5px] tracking-[-0.011em]", dark ? "text-white/55" : "text-muted"].join(" ")}>{subtitle}</p> : null}
      {children}
    </section>
  );
}
