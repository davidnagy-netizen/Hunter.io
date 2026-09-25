import { ArrowIcon } from "@/components";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import "../i18n";
import heroImage from "../assets/hero-manufacturing.jpg";
import { useMagneticHover } from "../hooks/useMagneticHover";
import { gsap } from "../lib/gsap";
import { HeroPreviewCard } from "./HeroPreviewCard";
import { Kicker } from "./Kicker";
import { landingCtaClasses } from "./landingCta";
import type { Fact } from "./landingTypes";

/**
 * A constant scale, always present, so the parallax translate below never runs out of image at
 * the panel's edge — a fixed buffer independent of the photo's own Ken Burns breathing (which
 * ranges 1.0–1.07 and would otherwise leave zero overscan at its low point).
 */
const PHOTO_REST_TRANSFORM = "scale(1.08)";

/**
 * The first screen a visitor sees, built around one action: the free
 * assessment. Creating an account outright is offered as a plain link, not
 * a second full-weight button — two co-equal buttons split attention and
 * work against the primary action.
 *
 * The argument for "why this is worth clicking" is `HeroPreviewCard` — a
 * mockup of the product actually scoring a call — given real visual weight:
 * it overlaps a photo panel behind it rather than sitting in a tidy paired
 * column. The headline itself stays outside that column (a rigid 50/50 grid
 * forced it into a narrow width and made it wrap across four lines; measured
 * the real font before settling on `max-w-250` — see the decisions log), so
 * the photo only occupies the row below it, never competing with the
 * headline's own width.
 *
 * The photo (`hero-manufacturing.jpg`) is a placeholder — Pexels, not a
 * commissioned shot — standing in until real photography exists. Swap the
 * import when it does; the gradient treatment around it doesn't depend on
 * the specific image.
 *
 * Entrance is staggered on mount, not scroll-triggered: this is the first
 * thing a visitor sees, so it has nothing to wait for.
 */
export function Hero() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState(reducedMotion);
  const ctaRef = useMagneticHover<HTMLAnchorElement>();
  const photoRef = useRef<HTMLDivElement>(null);
  const scrollParallaxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // The same worked-example facts `ComparisonSection` shows in full further down the page — reused
  // here, not invented for the hero, so the tags below are a real preview of that example rather
  // than a second, disconnected claim.
  const facts = (t("compare.facts", { returnObjects: true }) as Fact[]).slice(0, 3);

  /**
   * A few px of parallax on the backdrop photo, opposite the cursor — the same depth cue as
   * `HeroPreviewCard`'s own tilt, just on the layer behind it, so the two read as one scene
   * rather than a card floating over an unrelated picture. Applied to a wrapper around the
   * `<img>`, not the `<img>` itself: the image's own Ken Burns drift is a CSS animation, and an
   * animated `transform` always wins over one set inline from JS on the same element — nesting
   * them on separate elements is what lets both run at once.
   */
  const handlePhotoMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = photoRef.current;
    if (!el || reducedMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `${PHOTO_REST_TRANSFORM} translate(${(-px * 14).toFixed(1)}px, ${(-py * 10).toFixed(1)}px)`;
  };
  const handlePhotoLeave = () => {
    if (photoRef.current) photoRef.current.style.transform = PHOTO_REST_TRANSFORM;
  };

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(() => setShown(true), 60);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  /**
   * The backdrop photo also drifts a little with scroll — separate from the cursor parallax
   * above (a third nested element, so the two transforms never fight): as the hero scrolls past,
   * the photo trails slightly behind the fixed page, the classic background-moves-slower parallax
   * cue, without actually pinning it (a true `position: sticky` pin needs extra scroll room this
   * hero doesn't have, and would either add dead space or fight the chapters below it).
   */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const target = scrollParallaxRef.current;
    if (!section || !target || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        { y: -24 },
        { y: 24, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true } },
      );
    }, section);
    return () => ctx.revert();
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
    <section ref={sectionRef} className="relative isolate overflow-hidden px-6 pb-8 pt-16 md:pt-20">
      {/*
        A faint blueprint grid across the whole hero — not from either reference site, but a
        deliberate nod to the product's own "deterministic, rule-based, never a guess" positioning
        (see `statement.sub` further down the page). `-z-10`, not DOM order, keeps it behind the
        text: an absolutely positioned element paints *after* its non-positioned siblings by
        default regardless of source order, so without an explicit stacking position it would
        cover the kicker/headline instead of sitting behind them.
      */}
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

      {/*
        The photo panel and the card share this box: the panel is the card's backdrop, not a
        separate section, so they move as one unit relative to the CTA row above (`md:-mt-16`).
        Two photo layouts, not one repositioned element — the desktop panel bleeds to the true
        viewport edge via `absolute inset-y-0 right-0` (this box has no max-width ancestor to
        bleed past), which a `<md` screen has no room for; the mobile strip is a normal full-bleed
        block instead (`-mx-6` cancels the section's own padding).

        `pointer-events-none` here, `-auto` on the photo blob below: `md:-mt-16` pulls this box's
        own (relative-positioned, so painted above normal-flow siblings) hit-test box up over the
        CTA row above at short enough text/widths — same bug, same fix, as the card's own wrapper
        a few lines down. The photo blob re-enables `pointer-events-auto` so hovering it still
        bubbles `onMouseMove`/`onMouseLeave` up to this wrapper (pointer-events on an ancestor
        doesn't stop bubbling through an auto-enabled descendant, only whether the ancestor itself
        can be the hit target).
      */}
      <div
        className="pointer-events-none relative isolate mt-8 md:-mr-6 md:-mt-16 md:min-h-100"
        onMouseMove={handlePhotoMove}
        onMouseLeave={handlePhotoLeave}
      >
        <div
          aria-hidden
          // An organic blob, not the angular cut-corner panel this replaced — that one read as
          // "sharp" in the literal sense more than the brand's own "precise", and looked stiff
          // next to a photo of a person. Four different radii per axis is what makes it read as
          // one considered shape instead of a stretched circle or a rounded rectangle.
          className="pointer-events-auto absolute inset-y-0 right-0 -z-10 hidden w-[46%] overflow-hidden [border-radius:63%_37%_56%_44%/43%_53%_47%_57%] md:block"
        >
          <div ref={scrollParallaxRef} className="h-full w-full">
            <div
              ref={photoRef}
              className="h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: PHOTO_REST_TRANSFORM }}
            >
              <img
                src={heroImage}
                alt=""
                className="h-full w-full object-cover object-[48%_52%] motion-safe:animate-[kenburns_16s_ease-in-out_1.2s_infinite_alternate]"
              />
            </div>
          </div>
          {/* Left-to-right fade into the ink background: the photo should emerge from the dark
           * field rather than sit in a hard-edged rectangle. */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-ink)_0%,rgba(14,23,38,0.94)_10%,rgba(22,35,58,0.55)_26%,rgba(22,35,58,0.08)_46%,rgba(14,23,38,0.3)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(14,23,38,0.4)_0%,rgba(14,23,38,0)_22%,rgba(14,23,38,0)_72%,rgba(14,23,38,0.62)_100%)]" />
          {/* The scan line: the visual argument for "rule-based engine", swept across the actual
           * photo rather than added as a separate graphic. */}
          <div
            aria-hidden
            className="absolute inset-x-0 h-[3px] bg-gold shadow-[0_0_16px_4px_rgba(217,154,43,0.6)] motion-safe:animate-[scanline_4.5s_ease-in-out_infinite]"
          />
          {/* What the scan line is "reading" — the same three facts `ComparisonSection` shows in
           * full, lit up one at a time as the line sweeps past each one's own height. Under
           * reduced motion they just sit visible, rather than flashing in time with an animation
           * that isn't running. */}
          {facts.map((fact, i) => (
            <div
              key={fact.value}
              aria-hidden
              // Clustered in the middle third, left-of-center: the blob's own curve narrows
              // sharply near its top/bottom and right edges (where the card sits), so this is
              // the one band that's reliably both inside the visible photo and clear of the card.
              className="absolute left-[13%] flex items-center gap-1.5 border border-white/15 bg-ink/80 px-2.5 py-1 font-mono text-[10px] tracking-[-0.01em] text-white/80 backdrop-blur-sm"
              style={{
                top: `${30 + i * 20}%`,
                opacity: reducedMotion ? 1 : 0,
                animation: reducedMotion ? undefined : `tag-reveal 4.5s ease-in-out infinite ${-i * 1.5}s`,
              }}
            >
              <span className="size-1 shrink-0 bg-gold" />
              {fact.label} {fact.value} {fact.rest}
            </div>
          ))}
        </div>

        <div aria-hidden className="relative -mx-6 h-45 overflow-hidden md:hidden">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover object-[48%_48%] motion-safe:animate-[kenburns_16s_ease-in-out_1.2s_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(14,23,38,0.15)_0%,rgba(14,23,38,0.2)_55%,rgba(14,23,38,0.85)_100%)]" />
          <div
            aria-hidden
            className="absolute inset-x-0 h-[2.5px] bg-gold shadow-[0_0_14px_3px_rgba(217,154,43,0.6)] motion-safe:animate-[scanline_4.5s_ease-in-out_infinite]"
          />
        </div>

        {/*
          `pointer-events-none` + `-auto` on the card itself: this row's own (invisible, full-width)
          box was winning the hit-test over the bottom half of the CTA button even though nothing
          is drawn there.
        */}
        <div
          className={[
            "pointer-events-none relative z-10 -mt-14 flex justify-start md:mt-0 md:h-full md:items-end md:justify-end",
            stage(180),
          ].join(" ")}
        >
          <HeroPreviewCard className="pointer-events-auto" />
        </div>
      </div>
    </section>
  );
}
