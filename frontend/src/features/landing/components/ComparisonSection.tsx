import { useTranslation } from "react-i18next";
import { Reveal } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { BRAND } from "@/shared/brand";
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

  return (
    <Reveal>
      <Section kicker={t("compare.kicker")} title={t("compare.title")} subtitle={t("compare.sub")} className="py-16">
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 bg-ink p-4 text-sm text-white">
          <span className="text-xs uppercase tracking-wide text-white/60">{t("compare.scenarioLabel")}</span>
          {facts.map((f) => (
            <span key={f.value}>
              {f.label} <b>{f.value}</b> {f.rest}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-muted">{t("compare.old.title")}</h3>
            <p className="mt-3">
              <span className="font-display text-5xl font-semibold text-muted">{t("compare.old.count")}</span>{" "}
              <span className="text-sm text-muted">{t("compare.old.countLabel")}</span>
            </p>
            <p className="mt-3 text-sm text-muted">
              {t("compare.old.list")} · … <b>{t("compare.old.more")}</b>
            </p>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm">
              {oldSteps.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium text-red">{t("compare.old.verdict")}</p>
          </div>

          <div className="border-l-2 border-gold pl-6">
            <h3 className="font-display text-sm font-semibold text-gold-deep">{BRAND.name}</h3>
            <p className="mt-2 text-sm">
              {t("compare.new.head")} <b>{t("compare.new.headCount")}</b> {t("compare.new.headTail")}
            </p>
            <div className="mt-3 flex flex-col">
              {cards.map((c) => (
                <div key={c.program} className="flex gap-3 border-b border-line py-3 last:border-b-0">
                  <div className="w-12 text-center">
                    <div className="font-display text-2xl font-semibold text-gold-deep">{c.score}</div>
                    <div className="text-[10px] text-muted">SCORE</div>
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="text-xs font-medium text-muted">{c.program}</div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted">
                      {t("compare.new.supportLabel")} <b className="text-text">{c.support}</b> {t("compare.new.ownLabel")}{" "}
                      <b className="text-text">{c.own}</b> · <b className="text-text">{date(c.date)}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("compare.new.excludedLabel")}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {excluded.map((x) => (
                  <li key={x.name}>
                    <span className="text-red">✕</span> <b>{x.name}</b> {x.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </Reveal>
  );
}
