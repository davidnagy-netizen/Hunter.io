import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

/**
 * Fades and lifts its content into view once it scrolls on screen. Shows
 * immediately — no animation, no observer — for visitors who prefer reduced
 * motion or whose browser has no `IntersectionObserver`, so content is never
 * hidden behind an effect that can't run.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const canObserve = typeof IntersectionObserver !== "undefined";
  const [seen, setSeen] = useState(false);
  const visible = seen || reduced || !canObserve;

  useEffect(() => {
    const node = ref.current;
    if (visible || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={[
        "transition-[opacity,transform] duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
