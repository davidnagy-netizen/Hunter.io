import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

/**
 * `true` once the ref'd element has scrolled into view — fires once, then
 * disconnects. Starts (and stays) `true` immediately for a visitor who
 * prefers reduced motion, or where the browser can't observe scrolling at
 * all, so nothing is ever hidden behind an effect that can't run. The same
 * fallback logic `shared/components/Reveal.tsx` uses, extracted here because
 * `ProofStats`' count-up and `ComparisonSection`'s strike-through both need
 * the trigger itself, not just the fade Reveal already provides.
 */
export function useRevealed<T extends HTMLElement>() {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || revealed) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion, revealed]);

  return { ref, revealed };
}
