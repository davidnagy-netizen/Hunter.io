import { useTranslation } from "react-i18next";
import { Reveal } from "@/shared/components";
import { Section } from "./Section";
import "../i18n";

/** The sources the pitch cites. */
export function Sources() {
  const { t } = useTranslation("landing");
  const chips = t("sources.chips", { returnObjects: true }) as string[];
  return (
    <Reveal>
      <Section kicker={t("sources.kicker")} title={t("sources.title")} subtitle={t("sources.sub")} className="py-12">
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="flex items-center gap-2 border border-line bg-surface px-3 py-1.5 text-sm">
              <span aria-hidden className="size-2 rounded-full bg-green" />
              {chip}
            </span>
          ))}
        </div>
      </Section>
    </Reveal>
  );
}
