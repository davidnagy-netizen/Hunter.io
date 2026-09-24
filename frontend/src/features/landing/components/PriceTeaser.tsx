import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { GsapReveal } from "./GsapReveal";
import { Kicker } from "./Kicker";
import { landingCtaClasses } from "./landingCta";
import { Section } from "./Section";
import { useMagneticHover } from "../hooks/useMagneticHover";
import { useRevealed } from "../hooks/useRevealed";
import "../i18n";

/** The price teaser: the monthly fee framed against the funding on offer. */
export function PriceTeaser() {
  const { t } = useTranslation("landing");
  const ctaRef = useMagneticHover<HTMLAnchorElement>();
  const { ref: cardRef, revealed } = useRevealed<HTMLDivElement>();
  return (
    <GsapReveal>
      <Section className="py-12">
        <div ref={cardRef} className="relative isolate flex flex-wrap items-center justify-between gap-10 overflow-hidden border border-white/10 bg-white/[0.04] p-10">
          {/* The same faint blueprint grid the hero opens with — a closing echo of it, bookending
           * the two dark chapters rather than introducing a fourth background treatment. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]"
          />
          {/* A single light sweep once the card is in view — `useRevealed` fires once and stays
           * true, so this never re-plays on re-scroll. Skewed and blurred so it reads as a sheen,
           * not a moving bar. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md transition-transform duration-[1100ms] ease-out"
            style={{ transform: revealed ? "translateX(420%)" : "translateX(-120%)" }}
          />
          <div className="max-w-[420px]">
            <Kicker tone="dark">{t("price.kicker")}</Kicker>
            <h2 className="mt-3.5 text-[27px] font-bold leading-[1.2] tracking-[-0.025em] text-white">{t("price.title")}</h2>
            <p className="mt-3.5 text-sm tracking-[-0.011em] text-white/50">{t("price.note")}</p>
          </div>
          <div className="min-w-[250px] text-center">
            <div className="font-display text-[34px] font-bold tracking-[-0.03em] text-gold">{t("price.amount")}</div>
            <div className="text-[13px] text-white/50">{t("price.per")}</div>
            <div className="mt-1.5 text-xs text-white/40">{t("price.versus")}</div>
            <Link ref={ctaRef} to="/assess" className={["mt-5 block", landingCtaClasses(true)].join(" ")}>
              {t("price.cta")}
            </Link>
          </div>
        </div>
      </Section>
    </GsapReveal>
  );
}
