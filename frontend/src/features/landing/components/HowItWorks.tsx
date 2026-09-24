import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon, ListIcon, TargetIcon } from "@/shared/components";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { GsapReveal } from "./GsapReveal";
import { Section } from "./Section";
import "../i18n";

/** One icon per step, matched by position — the questions (a list), the deterministic engine
 * (precision/rules), the results (dates, deadlines). Reused from the shared set rather than new
 * SVGs, so the mark stays consistent with the rest of the app. */
const STEP_ICONS = [ListIcon, TargetIcon, CalendarIcon];

/**
 * "How it works": three steps as a numbered editorial list — huge, low-
 * opacity numerals bleeding into the margin, full-width rows — rather than
 * three equal boxed cards, which is the single most common SaaS-template
 * pattern there is and repeats a treatment nowhere else on the page uses.
 *
 * A rail runs down the numeral column alongside the existing fade+rise: a
 * gold fill grows top-to-bottom *scrubbed* to scroll position (so it always
 * reflects exactly where the visitor is), and each numeral lights up gold
 * the first time its own row crosses the middle of the viewport and *stays*
 * gold — a step once reached should still read as reached on the way back
 * up to reread it, not flip dark again the moment it's not the one centered.
 */
export function HowItWorks() {
  const { t } = useTranslation("landing");
  const items = t("how.items", { returnObjects: true }) as { title: string; text: string }[];
  const reducedMotion = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node || reducedMotion) return;
    const fill = node.querySelector<HTMLElement>("[data-rail-fill]");
    const rows = Array.from(node.querySelectorAll<HTMLElement>("[data-step-row]"));
    const ctx = gsap.context(() => {
      if (fill) {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: node, start: "top 70%", end: "bottom 55%", scrub: true },
          },
        );
      }
      for (const row of rows) {
        const targets = [row.querySelector("[data-step-number]"), row.querySelector("[data-step-icon]")].filter(
          (el): el is Element => el !== null,
        );
        const activate = () => targets.forEach((el) => el.classList.add("is-active"));
        // `onEnter` + `onEnterBack`, no `onLeave`/`onLeaveBack`: the class only ever gets added,
        // whichever direction first brings this row's midpoint into view, and nothing ever
        // removes it again.
        ScrollTrigger.create({ trigger: row, start: "top 60%", onEnter: activate, onEnterBack: activate });
      }
    }, node);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <GsapReveal>
      <Section id="how" kicker={t("how.kicker")} title={t("how.title")} className="py-16" tone="dark">
        <div ref={listRef} className="relative mt-6">
          <div aria-hidden className="absolute left-[2px] top-0 h-full w-px bg-white/10 md:left-[3px]" />
          <div
            aria-hidden
            data-rail-fill
            className="absolute left-[2px] top-0 h-full w-px origin-top bg-gold md:left-[3px]"
            style={reducedMotion ? undefined : { transform: "scaleY(0)" }}
          />

          <GsapReveal stagger={0.12}>
            {items.map((item, i) => {
              const StepIcon = STEP_ICONS[i];
              return (
                <div
                  key={item.title}
                  data-step-row
                  className="grid grid-cols-[110px_1fr] gap-8 border-t py-10 last:border-b md:grid-cols-[170px_1fr]"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div data-step-number className="step-number -ml-1.5 font-display text-[64px] font-bold leading-none tracking-[-0.04em] md:text-[132px]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      {StepIcon ? (
                        <span data-step-icon className="step-icon flex size-8 shrink-0 items-center justify-center rounded-full">
                          <StepIcon size={16} />
                        </span>
                      ) : null}
                      <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h3>
                    </div>
                    <p className="mt-2.5 max-w-[520px] text-[15px] tracking-[-0.011em] text-white/55">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </GsapReveal>
        </div>
      </Section>
    </GsapReveal>
  );
}
