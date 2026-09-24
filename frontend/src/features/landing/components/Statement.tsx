import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { gsap } from "../lib/gsap";
import "../i18n";

/**
 * A standalone statement, distilled from `how.items[1]`'s own description —
 * a deliberate change of pace between chapters: no kicker, no card, just
 * type and space, before the page returns to explaining itself.
 *
 * Reveals word by word rather than as one `GsapReveal` block — this is the
 * shortest, most declarative statement on the page, so it gets a slower,
 * more deliberate entrance than the fade+rise every other section uses.
 * Not built on `GsapReveal` itself: that component stagger-animates its own
 * *direct children*, which would mean wrapping each word in a `<div>` — not
 * valid inside an `<h2>`, which only accepts phrasing content. The `<span>`s
 * here are targeted directly instead.
 */
export function Statement() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const node = sectionRef.current;
    if (!node || reducedMotion) return;
    const targets = node.querySelectorAll("[data-reveal-word]");
    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 18, scale: 0.96 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.16,
        scrollTrigger: { trigger: node, start: "top 85%", toggleActions: "play none none none" },
      });
    }, node);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden px-6 pb-16 pt-24 text-center md:pt-28">
      {/* A giant, near-invisible echo of the gold word — the same "huge faded type" motif
       * `HowItWorks`' numerals use just below, so the two dark-chapter sections read as one
       * family. Reuses `word2` itself rather than new copy, so it stays correct in every locale. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-max -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[16vw] font-bold uppercase leading-none tracking-[-0.04em] text-white/[0.035]"
      >
        {t("statement.word2")}
      </div>
      <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-white/95 md:text-[46px]">
        <span data-reveal-word className="inline-block">
          {t("statement.word1")}
        </span>{" "}
        <span data-reveal-word className="inline-block text-gold">
          {t("statement.word2")}
        </span>{" "}
        <span data-reveal-word className="inline-block">
          {t("statement.word3")}
        </span>
      </h2>
      <p data-reveal-word className="mx-auto mt-5 max-w-[480px] text-[15.5px] tracking-[-0.011em] text-white/45">
        {t("statement.sub")}
      </p>
      </div>
    </section>
  );
}
