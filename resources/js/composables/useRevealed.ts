import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Observe once, with an immediate visible fallback when motion or observation is unavailable. */
export function useRevealed<T extends HTMLElement>({ threshold = 0.4, rootMargin = "0px" } = {}) {
  const ref = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [seen, setSeen] = useState(false);
  const revealed = seen || reducedMotion || typeof IntersectionObserver === "undefined";

  useEffect(() => {
    const element = ref.current;
    if (revealed || !element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed, threshold, rootMargin]);

  return { ref, revealed };
}
