import { useTranslation } from "react-i18next";
import { GsapReveal } from "./GsapReveal";
import { Section } from "./Section";
import "../i18n";

/** The sources the pitch cites. */
export function Sources() {
  const { t } = useTranslation("landing");
  const chips = t("sources.chips", { returnObjects: true }) as string[];
  return (
    <GsapReveal>
      <Section kicker={t("sources.kicker")} title={t("sources.title")} subtitle={t("sources.sub")} className="py-16">
        <GsapReveal className="mt-6 flex flex-wrap gap-2" stagger={0.05}>
          {chips.map((chip) => (
            <span
              key={chip}
              className="flex items-center gap-2 border border-line bg-surface px-3.5 py-2 text-[13.5px] tracking-[-0.011em] transition-colors hover:border-gold hover:bg-gold-bg"
            >
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-green" />
              {chip}
            </span>
          ))}
        </GsapReveal>
      </Section>
    </GsapReveal>
  );
}
