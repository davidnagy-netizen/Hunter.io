import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Reveal } from "@/shared/components";
import { Kicker } from "./Kicker";
import { landingCtaClasses } from "./landingCta";
import { Section } from "./Section";
import "../i18n";

/** The price teaser: the monthly fee framed against the funding on offer. */
export function PriceTeaser() {
  const { t } = useTranslation("landing");
  return (
    <Reveal>
      <Section className="py-12">
        <div className="flex flex-wrap items-center justify-between gap-10 border border-white/10 bg-white/[0.04] p-10">
          <div className="max-w-[420px]">
            <Kicker tone="dark">{t("price.kicker")}</Kicker>
            <h2 className="mt-3.5 text-[27px] font-bold leading-[1.2] tracking-[-0.025em] text-white">{t("price.title")}</h2>
            <p className="mt-3.5 text-sm tracking-[-0.011em] text-white/50">{t("price.note")}</p>
          </div>
          <div className="min-w-[250px] text-center">
            <div className="font-display text-[34px] font-bold tracking-[-0.03em] text-gold">{t("price.amount")}</div>
            <div className="text-[13px] text-white/50">{t("price.per")}</div>
            <div className="mt-1.5 text-xs text-white/40">{t("price.versus")}</div>
            <Link to="/assess" className={["mt-5 block", landingCtaClasses(true)].join(" ")}>
              {t("price.cta")}
            </Link>
          </div>
        </div>
      </Section>
    </Reveal>
  );
}
