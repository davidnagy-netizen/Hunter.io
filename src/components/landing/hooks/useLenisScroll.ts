import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import Lenis from "lenis";
import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

export function useLenisScroll() {
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reducedMotion]);
}
