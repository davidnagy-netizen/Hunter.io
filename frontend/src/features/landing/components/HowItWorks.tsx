import { useTranslation } from "react-i18next";
import { GsapReveal } from "./GsapReveal";
import { Section } from "./Section";
import "../i18n";

/**
 * "How it works": three steps as a numbered editorial list — huge, low-
 * opacity numerals bleeding into the margin, full-width rows — rather than
 * three equal boxed cards, which is the single most common SaaS-template
 * pattern there is and repeats a treatment nowhere else on the page uses.
 */
export function HowItWorks() {
  const { t } = useTranslation("landing");
  const items = t("how.items", { returnObjects: true }) as { title: string; text: string }[];
  return (
    <GsapReveal>
      <Section id="how" kicker={t("how.kicker")} title={t("how.title")} className="py-16" tone="dark">
        <GsapReveal className="mt-6" stagger={0.12}>
          {items.map((item, i) => (
            <div key={item.title} className="grid grid-cols-[110px_1fr] gap-8 border-t py-10 last:border-b md:grid-cols-[170px_1fr]" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="-ml-1.5 font-display text-[64px] font-bold leading-none tracking-[-0.04em] text-white/14 md:text-[132px]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                <p className="mt-2.5 max-w-[520px] text-[15px] tracking-[-0.011em] text-white/55">{item.text}</p>
              </div>
            </div>
          ))}
        </GsapReveal>
      </Section>
    </GsapReveal>
  );
}
