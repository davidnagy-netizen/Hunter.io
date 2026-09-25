import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { gsap } from "../lib/gsap";

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  /** Animate each direct child in sequence, `stagger` seconds apart, instead of the wrapper as one block. */
  stagger?: number;
}

/**
 * The landing page's own scroll reveal, built on GSAP/ScrollTrigger rather
 * than the shared `Reveal` component — `stagger` sequences direct children
 * one after another (numbered rows, chip lists), which a single CSS
 * transition on one wrapper can't express. Kept landing-only rather than
 * folded into `shared/components`, matching `landingCta.ts`'s reasoning:
 * this page's motion language doesn't need to become every page's default.
 */
export function GsapReveal({ children, className = "", stagger }: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // `useLayoutEffect`, not `useEffect`: this must hide `targets` before the browser's first
  // paint, or unanimated content flashes visible for a frame before the reveal takes over.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    const targets = stagger ? Array.from(node.children) : node;
    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 28 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: stagger ?? 0,
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }, node);
    return () => ctx.revert();
  }, [reducedMotion, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
