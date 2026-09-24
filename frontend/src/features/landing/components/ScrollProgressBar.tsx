import { useEffect, useRef } from "react";

/**
 * A thin, precise fill under the header, tracking exactly how far down the page a visitor is —
 * not eased or scrubbed, unlike the page's other scroll-linked motion: a progress read is more
 * "deterministic, rule-based" the more directly it maps to the number it represents. Left
 * unguarded by `usePrefersReducedMotion` on purpose: it renders a state, not autonomous motion —
 * the fill only ever changes because the visitor themselves scrolled.
 */
export function ScrollProgressBar() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      const progress = max > 0 ? root.scrollTop / max : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[2.5px]">
      <div ref={fillRef} className="h-full w-full origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
