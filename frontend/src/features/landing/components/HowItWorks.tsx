import { useTranslation } from "react-i18next";
import { Reveal } from "@/shared/components";
import { Section } from "./Section";
import "../i18n";

/** "How it works": three numbered steps. */
export function HowItWorks() {
  const { t } = useTranslation("landing");
  const items = t("how.items", { returnObjects: true }) as { title: string; text: string }[];
  return (
    <Reveal>
      <Section id="how" kicker={t("how.kicker")} title={t("how.title")} className="py-16">
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.title} className="border border-line bg-surface p-5">
              <div className="flex size-8 items-center justify-center rounded-full bg-gold-bg font-display font-semibold text-gold-deep">
                {i + 1}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </Reveal>
  );
}
