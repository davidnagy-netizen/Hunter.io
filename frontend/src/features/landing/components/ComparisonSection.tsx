import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowIcon, CircularProgress, Reveal } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { BRAND } from "@/shared/brand";
import { useRevealed } from "../hooks/useRevealed";
import { Section } from "./Section";
import type { ExampleCard, ExcludedExample, Fact } from "./landingTypes";
import "../i18n";

/**
 * The worked example that makes the pitch concrete: the same company seen
 * through a plain grant list and through Fundor. Every figure is fixed
 * example content (from the original spec's demo company), not live data.
 *
 * The two outcomes are told apart by typography and a single accent rule,
 * not by putting each in its own bordered, shadowed card — the strongest
 * proof point on the page shouldn't read as a template comparison table.
 */
export function ComparisonSection() {
  const { t } = useTranslation("landing");
  const { date } = useFormat();
  const reducedMotion = usePrefersReducedMotion();
  const facts = t("compare.facts", { returnObjects: true }) as Fact[];
  const oldSteps = t("compare.old.steps", { returnObjects: true }) as string[];
  const cards = t("compare.new.cards", { returnObjects: true }) as ExampleCard[];
  const excluded = t("compare.new.excluded", { returnObjects: true }) as ExcludedExample[];
  const { ref: excludedRef, revealed: excludedRevealed } = useRevealed<HTMLUListElement>();
  const { ref: cardsRef, revealed: cardsRevealed } = useRevealed<HTMLDivElement>();
  // Frozen once at mount: `t(..., { returnObjects: true })` hands back a fresh array identity
  // every render, which would otherwise restart this effect on every render it causes.
  const [scoreTargets] = useState(() => cards.map((c) => c.score));
  const [scores, setScores] = useState<number[]>(() => (reducedMotion ? scoreTargets : scoreTargets.map(() => 0)));

  useEffect(() => {
    if (!cardsRevealed || reducedMotion) return;
    // One `setState` per card, staggered — same as `HeroPreviewCard`'s own score reveal.
    // `CircularProgress`'s ring animates the jump itself (its own CSS transition on
    // `stroke-dashoffset`); a manually eased rAF loop here would just fight that transition,
    // re-triggering a fresh 1s ease on every intermediate frame instead of one clean sweep.
    const timers = scoreTargets.map((target, i) =>
      window.setTimeout(() => setScores((prev) => prev.map((v, j) => (j === i ? target : v))), 300 + i * 150),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [cardsRevealed, reducedMotion, scoreTargets]);

  return (
    <Reveal>
      <Section kicker={t("compare.kicker")} title={t("compare.title")} subtitle={t("compare.sub")} className="py-16">
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 bg-ink p-4 text-sm tracking-[-0.011em] text-white">
          <span className="font-mono text-xs uppercase tracking-[-0.01em] text-white/60">{t("compare.scenarioLabel")}</span>
          {facts.map((f) => (
            <span key={f.value}>
              {f.label} <b>{f.value}</b> {f.rest}
            </span>
          ))}
        </div>

        {/* `md:items-start`, not the grid default `stretch`: each panel below carries its own
         * `mt-`/rotation offset, breaking the two out of a perfectly aligned, symmetric row —
         * `stretch` would force both to the same height and cancel that stagger out. */}
        <div className="mt-13 grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-start md:gap-8">
          {/* The losing side, visually: a muted red-tinted panel rather than plain text in a bare
           * column — readable as "the option this page argues against" before a word is read.
           * Nudged down and tilted a hair the *other* way from the Fundor panel: two panels set
           * down at the same height, perfectly parallel, would read as a template two-up layout
           * despite the color difference. */}
          <div className="border border-red/20 bg-red/5 p-7 md:mt-6 md:rotate-[0.35deg] md:p-8">
            <h3 className="font-mono text-xs uppercase tracking-[-0.01em] text-muted">{t("compare.old.title")}</h3>
            <p className="mt-4">
              <span className="font-display text-[52px] font-bold tracking-[-0.03em] text-muted-2">{t("compare.old.count")}</span>{" "}
              <span className="text-sm tracking-[-0.011em] text-muted">{t("compare.old.countLabel")}</span>
            </p>
            <p className="mt-3.5 text-[13.5px] leading-relaxed tracking-[-0.011em] text-muted">
              {t("compare.old.list")} · … <b className="text-text">{t("compare.old.more")}</b>
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-sm tracking-[-0.011em]">
              {oldSteps.map((s) => (
                <li key={s}>— {s}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold tracking-[-0.011em] text-red">{t("compare.old.verdict")}</p>
          </div>

          {/* The winning side: a gold-tinted panel with its own lift, echoing the score ring's
           * gold on the hero card — the same "this is the good outcome" cue in two places.
           * Bleeds past the container's own right edge and lifts above the row (`-mr-6`/`-mt-6`
           * cancel `Section`'s padding and the grid gap) with an opposite tilt from the panel
           * beside it — the one breaking out of the aligned grid should be the answer, not the
           * problem, so this is the panel that gets the escape, not the red one. */}
          <div className="border border-gold/40 bg-gold-bg p-7 shadow-[0_32px_64px_-28px_rgba(217,154,43,0.4)] md:-mr-6 md:-mt-6 md:rotate-[-0.6deg] md:p-8">
            <h3 className="font-display text-[13px] font-semibold uppercase tracking-[-0.01em] text-gold-deep">{BRAND.name}</h3>
            <p className="mt-3 text-sm tracking-[-0.011em]">
              {t("compare.new.head")} <b>{t("compare.new.headCount")}</b> {t("compare.new.headTail")}
            </p>
            <div ref={cardsRef} className="mt-4 flex flex-col border border-gold/25 bg-surface">
              {cards.map((c, i) => (
                <div
                  key={c.program}
                  className="flex items-center gap-3.5 border-b border-line p-3.5 outline-none transition-transform duration-200 last:border-b-0 hover:z-10 hover:-translate-y-0.5 hover:shadow-card-lg"
                  // Opacity only, never `transform`, inline: the hover lift just above is a
                  // Tailwind class controlling `transform`, and an inline `transform` — even a
                  // resting `translateY(0)` — would permanently outrank it once set.
                  style={{ opacity: cardsRevealed || reducedMotion ? 1 : 0, transition: `opacity 500ms ease-out ${i * 90}ms` }}
                >
                  <CircularProgress value={scores[i]} size={46} strokeWidth={5} color="var(--color-gold)">
                    <span className="font-display text-[13px] font-bold tabular-nums">{scores[i]}</span>
                  </CircularProgress>
                  <div className="min-w-0 text-sm tracking-[-0.011em]">
                    <div className="text-xs font-medium text-muted">{c.program}</div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-muted">
                      {t("compare.new.supportLabel")} <b className="text-text">{c.support}</b> {t("compare.new.ownLabel")}{" "}
                      <b className="text-text">{c.own}</b> · <b className="text-text">{date(c.date)}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-sm">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[-0.01em] text-muted">{t("compare.new.excludedLabel")}</p>
              <ul ref={excludedRef} className="mt-2.5 flex flex-col gap-2 text-[13.5px] tracking-[-0.011em]">
                {excluded.map((x, i) => (
                  <li key={x.name}>
                    <span className="text-red">✕</span>{" "}
                    <b className="relative inline-block">
                      <span>{x.name}</span>
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-px bg-red transition-[width] duration-500 ease-out"
                        style={{
                          width: excludedRevealed ? "100%" : "0%",
                          transitionDelay: excludedRevealed ? `${350 + i * 120}ms` : undefined,
                        }}
                      />
                    </b>{" "}
                    {x.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-8">
          <p className="max-w-[460px] text-base tracking-[-0.011em]" dangerouslySetInnerHTML={{ __html: t("compare.bridge.text") }} />
          <Link to="/assess" className="group inline-flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.011em] text-gold-deep transition-colors hover:text-ink">
            {t("compare.bridge.cta")}
            <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        </div>
      </Section>
    </Reveal>
  );
}
