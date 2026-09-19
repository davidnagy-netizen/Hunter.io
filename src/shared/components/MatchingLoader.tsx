import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { TargetIcon } from "./icons";

const FULL_MS = 1750;
const REDUCED_MS = 180;

export interface MatchingLoaderProps {
  title: string;
  /** Labels of the pipeline stages, shown as a checklist that ticks off in order. */
  steps: string[];
  /** Fired once the checklist has finished. The parent decides when to unmount (typically once its data has also arrived). */
  onAnimationDone?: () => void;
}

/**
 * The branded "matching engine is running" overlay. The steps reflect the real
 * pipeline (normalize profile → eligibility engine → score → rank); the
 * timing is presentational. Honors `prefers-reduced-motion` by collapsing to a
 * brief, static flash.
 */
export function MatchingLoader({ title, steps, onAnimationDone }: MatchingLoaderProps) {
  const reduced = usePrefersReducedMotion();
  const total = reduced ? REDUCED_MS : FULL_MS;
  const [active, setActive] = useState(-1);
  const [filled, setFilled] = useState(false);
  // Read through a ref so a parent re-render (a new callback identity) never restarts the animation.
  const doneRef = useRef(onAnimationDone);
  useEffect(() => {
    doneRef.current = onAnimationDone;
  });
  const stepCount = steps.length;

  useEffect(() => {
    const per = total / stepCount;
    const timers = Array.from({ length: stepCount }, (_, i) => setTimeout(() => setActive(i), per * i + 80));
    timers.push(setTimeout(() => setActive(stepCount), total - 120));
    timers.push(setTimeout(() => doneRef.current?.(), total + 260));
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setFilled(true)));
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [stepCount, total]);

  return (
    <div role="status" aria-live="polite" aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 text-center shadow-card-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold-bg text-gold-deep">
          <TargetIcon size={30} className={reduced ? "" : "animate-pulse"} />
        </div>
        <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
        <ul className="mt-4 flex flex-col gap-2 text-left text-sm">
          {steps.map((step, i) => (
            <li key={step} className={["flex items-center gap-2", i <= active ? "text-text" : "text-muted"].join(" ")}>
              <span
                aria-hidden
                className={[
                  "flex size-4 items-center justify-center rounded-full text-[10px]",
                  i < active ? "bg-green text-white" : i === active ? "bg-gold text-white" : "bg-line",
                ].join(" ")}
              >
                {i < active ? "✓" : ""}
              </span>
              {step}
            </li>
          ))}
        </ul>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-gold ease-out"
            style={{ width: filled ? "100%" : "0%", transition: reduced ? "none" : `width ${total}ms cubic-bezier(.4,0,.2,1)` }}
          />
        </div>
      </div>
    </div>
  );
}
