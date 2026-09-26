import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { gsap, ScrollTrigger } from "../lib/gsap";

/**
 * Smooths native scroll into eased, momentum-carrying motion — every scroll-scrubbed effect on
 * this page (the coin drop, `ChapterSeam`'s color wipes, the hero's photo parallax, `GsapReveal`)
 * reads its input from scroll position, so smoothing the scroll itself smooths all of them at
 * once, with no changes needed in any of those files.
 *
 * Two things make this actually work rather than just adding lag:
 * - `gsap.ticker` drives Lenis's own `raf`, instead of Lenis running its own independent
 *   `requestAnimationFrame` loop — one shared frame clock, so GSAP's tweens and Lenis's scroll
 *   interpolation are always reading the same instant, never a frame apart.
 * - `lenis.on("scroll", ScrollTrigger.update)` tells ScrollTrigger to recompute on *Lenis's*
 *   scroll updates. `ScrollTrigger` normally listens for the browser's native `scroll` event, which
 *   still fires, but only once per real scroll input — not on each of Lenis's interpolated frames
 *   in between, so its scrubbed animations would visibly lag a beat behind the smoothed motion
 *   without this.
 *
 * Skipped entirely under reduced motion: smoothing is itself a kind of added motion (input lag,
 * momentum, overshoot), the opposite of what that preference is asking for — everything keeps
 * working against plain native scroll instead, exactly as it did before this hook existed.
 */
export function useLenisScroll() {
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Lenis's own easing already smooths large scroll jumps; GSAP's frame-skip recovery would
    // otherwise fight it by snapping the *next* tick forward after any stutter.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reducedMotion]);
}
