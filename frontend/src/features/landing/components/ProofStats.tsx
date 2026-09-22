import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { useRevealed } from "../hooks/useRevealed";
import "../i18n";

const OLD_COUNT = 549;
const NEW_COUNT = 3;
const EXAMPLE_SCORE = 87;

/** Counts up from 0 to `target` once `useRevealed` says the element has scrolled into view. */
function useCountUp(target: number, reducedMotion: boolean) {
  const { ref, revealed } = useRevealed<HTMLDivElement>();
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (!revealed || reducedMotion) return;
    const duration = 1300;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      // Clamped on both ends: a first rAF timestamp is never guaranteed to be >= `start`
      // (seen in tests; not worth trusting in real browsers either), and an unclamped low end
      // sends the eased value negative.
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [revealed, target, reducedMotion]);

  return { ref, value };
}

/**
 * 549 and 3 are one connected statement — the reduction from "everything"
 * to "what actually fits" is the pitch itself, so they share a row with an
 * arrow between them rather than sitting as three interchangeable stats in
 * equal columns. 87 (the example score) is broken out separately, smaller,
 * as a secondary callback.
 */
export function ProofStats() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const { ref: oldRef, value: oldValue } = useCountUp(OLD_COUNT, reducedMotion);
  const { ref: newRef, value: newValue } = useCountUp(NEW_COUNT, reducedMotion);
  const { ref: scoreRef, value: scoreValue } = useCountUp(EXAMPLE_SCORE, reducedMotion);

  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-12 px-6 pb-24 pt-16">
      <div className="flex flex-wrap items-center gap-5">
        <div ref={oldRef}>
          <div className="font-display text-[72px] font-bold leading-none tracking-[-0.035em] text-white/90 tabular-nums md:text-[104px]">
            {oldValue}
          </div>
          <p className="mt-2.5 max-w-[200px] text-[13.5px] tracking-[-0.011em] text-white/42">{t("proof.oldCaption")}</p>
        </div>
        <div aria-hidden className="mb-7 font-display text-3xl text-white/22 md:text-[40px]">
          →
        </div>
        <div ref={newRef}>
          <div className="font-display text-[72px] font-bold leading-none tracking-[-0.035em] text-gold tabular-nums md:text-[104px]">
            {newValue}
          </div>
          <p className="mt-2.5 max-w-[200px] text-[13.5px] tracking-[-0.011em] text-white/42">{t("proof.newCaption")}</p>
        </div>
      </div>

      <div ref={scoreRef} className="border-l-2 border-white/16 pl-5">
        <div className="font-display text-[48px] font-bold leading-none tracking-[-0.03em] text-white/90 tabular-nums">{scoreValue}</div>
        <p className="mt-2 max-w-[170px] text-xs tracking-[-0.011em] text-white/40">{t("proof.scoreCaption")}</p>
      </div>
    </div>
  );
}
