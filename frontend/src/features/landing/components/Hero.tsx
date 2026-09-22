import { ArrowIcon } from "@/shared/components";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import "../i18n";
import { useMagneticHover } from "../hooks/useMagneticHover";
import { HeroPreviewCard } from "./HeroPreviewCard";
import { Kicker } from "./Kicker";
import { landingCtaClasses } from "./landingCta";

/**
 * The first screen a visitor sees, built around one action: the free
 * assessment. Creating an account outright is offered as a plain link, not
 * a second full-weight button — two co-equal buttons split attention and
 * work against the primary action.
 *
 * No stock photography. The argument for "why this is worth clicking" is
 * `HeroPreviewCard` — a mockup of the product actually scoring a call —
 * given real visual weight: it overlaps the text block below it rather than
 * sitting in a tidy paired column (a rigid 50/50 grid forced the headline
 * into a narrow column and made it wrap across four lines; measured the real
 * font before settling on this width — see the decisions log).
 *
 * Entrance is staggered on mount, not scroll-triggered: this is the first
 * thing a visitor sees, so it has nothing to wait for.
 */
export function Hero() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(reducedMotion);
  const ctaRef = useMagneticHover<HTMLAnchorElement>();

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(() => setShown(true), 60);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  // Static, fully literal class strings on purpose: Tailwind's JIT scanner can't see a class
  // name built by template-literal interpolation, so the delay step has to be one of these
  // pre-written options, not `` `[transition-delay:${ms}ms]` ``.
  const DELAY: Record<0 | 80 | 180 | 280, string> = {
    0: "[transition-delay:0ms]",
    80: "[transition-delay:80ms]",
    180: "[transition-delay:180ms]",
    280: "[transition-delay:280ms]",
  };
  /** Fade+rise, staggered by `delayMs` once `shown` flips. */
  const stage = (delayMs: 0 | 80 | 180 | 280) =>
    [
      "transition-[opacity,transform] duration-700 ease-out",
      DELAY[delayMs],
      shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
    ].join(" ");

  return (
    <section className="relative px-6 pb-8 pt-16 md:pt-20">
      <div className={stage(0)}>
        <Kicker tone="dark">{t("hero.kicker")}</Kicker>
      </div>

      <h1
        className={[
          "mt-5 max-w-250 font-display text-[42px] font-bold leading-[0.98] tracking-[-0.03em] md:text-[70px]",
          "transition-[clip-path] duration-1000 ease-out",
        ].join(" ")}
        style={{
          clipPath:
            shown || reducedMotion ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
        }}
      >
        {t("hero.line1")}
        <br />
        <span className="text-gold">{t("hero.line2")}</span>
      </h1>

      <div className="max-w-115">
        <p
          className={[
            "mt-7 text-[17px] tracking-[-0.011em] text-white/68",
            stage(80),
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: t("hero.lead") }}
        />
        <div
          className={[
            "mt-8 flex flex-wrap items-center gap-7",
            stage(180),
          ].join(" ")}
        >
          <Link
            ref={ctaRef}
            to="/assess"
            className={["group", landingCtaClasses()].join(" ")}
          >
            {t("hero.cta")}{" "}
            <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/register"
            className="border-b border-white/20 pb-0.5 text-sm font-medium tracking-[-0.011em] text-white/58 transition-colors hover:border-white/70 hover:text-white"
          >
            {t("hero.register")}
          </Link>
        </div>
        <p
          className={[
            "mt-4 font-mono text-[11px] tracking-[-0.01em] text-white/40",
            stage(280),
          ].join(" ")}
        >
          {t("hero.ctaNote")}
        </p>
      </div>

      {/*
        `pointer-events-none` + `-auto` on the card itself: this wrapper's `md:-mt-16` pulls it up
        over the CTA row above, and being later in the DOM, its own (invisible, full-width) box was
        winning the hit-test over the bottom half of the CTA button even though nothing is drawn there.
      */}
      <div
        className={[
          "pointer-events-none mt-10 flex justify-start md:-mt-16 md:justify-end",
          stage(180),
        ].join(" ")}
      >
        <HeroPreviewCard className="pointer-events-auto" />
      </div>
    </section>
  );
}
