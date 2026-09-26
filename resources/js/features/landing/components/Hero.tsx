import { ArrowIcon } from "@/components";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type * as THREE from "three";
import { useMagneticHover } from "../hooks/useMagneticHover";
import { useMinWidth } from "../hooks/useMinWidth";
import "../i18n";
import { gsap } from "../lib/gsap";
import { CoinDropScene } from "./CoinDropScene";
import { COIN_LAYOUT, dropStartY } from "./coinLayout";
import { HeroPreviewCard } from "./HeroPreviewCard";
import { Kicker } from "./Kicker";
import { landingCtaClasses } from "./landingCta";

export function Hero() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useMinWidth(768);
  const [shown, setShown] = useState(reducedMotion);
  const ctaRef = useMagneticHover<HTMLAnchorElement>();
  const sectionRef = useRef<HTMLElement>(null);
  const coinsRef = useRef<(THREE.Group | null)[] | null>(null);
  const [coinsReady, setCoinsReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(() => setShown(true), 60);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  const handleCoinsReady = useCallback((coins: (THREE.Group | null)[]) => {
    coinsRef.current = coins;
    setCoinsReady(true);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const coins = coinsRef.current;
    if (!section || !coins || !isDesktop || reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=140%",
          scrub: 0.4,
          pin: true,
        },
      });

      coins.forEach((coin, i) => {
        const layout = COIN_LAYOUT[i];
        if (!coin || !layout.dropsIn) return;
        const { x, y, z, restRotationY, dropOrder } = layout;
        const at = dropOrder * 0.12;
        tl.fromTo(
          coin.position,
          { x, y: dropStartY(layout), z },
          { x, y, z, duration: 1, ease: "bounce.out" },
          at,
        )
          .to(
            coin.rotation,
            {
              x: `+=${(2 + Math.random() * 2) * Math.PI * 2}`,
              z: `+=${(1 + Math.random() * 2) * Math.PI * 2}`,
              duration: 1,
              ease: "power1.out",
            },
            at,
          )
          .to(
            coin.rotation,
            { y: restRotationY, duration: 0.5, ease: "power2.out" },
            at + 0.9,
          );
      });
    }, section);
    return () => ctx.revert();
  }, [isDesktop, reducedMotion, coinsReady]);

  const DELAY: Record<0 | 80 | 180 | 280, string> = {
    0: "[transition-delay:0ms]",
    80: "[transition-delay:80ms]",
    180: "[transition-delay:180ms]",
    280: "[transition-delay:280ms]",
  };
  const stage = (delayMs: 0 | 80 | 180 | 280) =>
    [
      "transition-[opacity,transform] duration-700 ease-out",
      DELAY[delayMs],
      shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
    ].join(" ");

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden px-6 pb-8 pt-16 md:pt-20 md:min-h-[720px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <div className={stage(0)}>
        <Kicker tone="dark" pulse>
          {t("hero.kicker")}
        </Kicker>
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

      {isDesktop ? (
        <>
          <CoinDropScene
            key="desktop"
            onCoinsReady={handleCoinsReady}
            className={[
              "pointer-events-none absolute bottom-10 right-0 -z-10 hidden h-[500px] w-[68%] md:block",
              stage(180),
            ].join(" ")}
          />
          <HeroPreviewCard
            className={[
              "absolute bottom-56 right-6 hidden md:block",
              stage(280),
            ].join(" ")}
          />
        </>
      ) : (
        <CoinDropScene
          key="mobile"
          settled
          className="relative -mx-6 mt-8 h-64"
        />
      )}
    </section>
  );
}
