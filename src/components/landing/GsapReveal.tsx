import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "./lib/gsap";

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function GsapReveal({
  children,
  className = "",
  stagger,
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

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
