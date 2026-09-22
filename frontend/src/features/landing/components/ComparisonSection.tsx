import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowIcon, Reveal } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
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
  const facts = t("compare.facts", { returnObjects: true }) as Fact[];
  const oldSteps = t("compare.old.steps", { returnObjects: true }) as string[];
  const cards = t("compare.new.cards", { returnObjects: true }) as ExampleCard[];
  const excluded = t("compare.new.excluded", { returnObjects: true }) as ExcludedExample[];
  const { ref: excludedRef, revealed: excludedRevealed } = useRevealed<HTMLUListElement>();

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

        <div className="mt-13 grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-18">
          <div>
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

          <div className="border-l-2 border-gold pl-7">
            <h3 className="font-display text-[13px] font-semibold uppercase tracking-[-0.01em] text-gold-deep">{BRAND.name}</h3>
            <p className="mt-3 text-sm tracking-[-0.011em]">
              {t("compare.new.head")} <b>{t("compare.new.headCount")}</b> {t("compare.new.headTail")}
            </p>
            <div className="mt-4 flex flex-col">
              {cards.map((c) => (
                <div key={c.program} className="flex gap-3.5 border-b border-line py-3.5 last:border-b-0">
                  <div className="w-12 text-center">
                    <div className="font-display text-[25px] font-bold tracking-[-0.02em] text-gold-deep">{c.score}</div>
                    <div className="font-mono text-[9px] tracking-[-0.02em] text-muted">SCORE</div>
                  </div>
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
