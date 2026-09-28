import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import Lenis from "lenis";
import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";

// Module-level, not state: any component (e.g. the navbar's in-page links) needs to reach the
// live instance without this hook re-rendering on every consumer, and there is only ever one
// Lenis instance for the whole landing page's lifetime.
let activeLenis: Lenis | null = null;

const NAV_OFFSET = -96;

/**
 * Smooth-scrolls to an in-page anchor (`"#section"`) or element, offset for the sticky header.
 * Lenis's own built-in `anchors` option looks like it should cover this, but its click handler
 * calls `scrollTo()` without ever calling `preventDefault()` — the browser's native, instant hash
 * jump still fires and wins the race. Callers must preventDefault themselves and call this
 * instead. Falls back to the native smooth scroll under reduced motion, when Lenis isn't mounted.
 */
export function scrollToHash(hash: string) {
  if (activeLenis) {
    activeLenis.scrollTo(hash, { offset: NAV_OFFSET });
    return;
  }
  // No Lenis instance means either reduced motion or the hook hasn't mounted yet — either way,
  // a JS-requested "smooth" here would override the page's CSS reduced-motion kill switch (the
  // spec has the explicit `behavior` option win over the element's `scroll-behavior` CSS), so it
  // must be decided the same way `usePrefersReducedMotion` decides it, not assumed to be "smooth".
  const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

export function useLenisScroll() {
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    activeLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      activeLenis = null;
    };
  }, [reducedMotion]);
}
