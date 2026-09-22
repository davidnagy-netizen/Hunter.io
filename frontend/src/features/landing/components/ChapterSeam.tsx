import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { gsap } from "../lib/gsap";

/**
 * Bridges two adjacent chapters with a scroll-scrubbed color wipe instead
 * of the hard cut a chapter's own flat background would otherwise paint.
 * Negative margins pull it 24px into each neighbor and `h-12` cancels that
 * back out to zero net height, so it adds no scroll distance; `z-10` lifts
 * it above both chapters' plain (non-positioned) backgrounds. 24px is
 * deliberately less than any chapter's own top/bottom padding (the
 * tightest is the footer's `py-8`) so it never crosses into real content.
 *
 * The scrub runs for exactly the seam's own 48px of scroll after it starts
 * entering the viewport, not a full top-to-bottom pass — any trigger tied
 * to the *viewport's* position (`"bottom center"`, `"bottom top"`, …) needs
 * however much scroll distance that implies, and the last seam sits close
 * enough to the actual end of the page that the document ran out of room
 * before the transition could reach it, leaving the color stuck mid-blend
 * (or, with a stricter end condition, never starting at all). A fixed
 * `+=48` only ever needs 48px of scroll past the seam's own top, which the
 * shortest trailing content (the footer) still clears.
 */
export function ChapterSeam({ from, to }: { from: string; to: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { backgroundColor: from },
        {
          backgroundColor: to,
          ease: "none",
          scrollTrigger: { trigger: node, start: "top bottom", end: "+=48", scrub: true },
        },
      );
    });
    return () => ctx.revert();
  }, [reducedMotion, from, to]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none relative z-10 -my-6 h-12"
      style={reducedMotion ? undefined : { backgroundColor: from }}
    />
  );
}
