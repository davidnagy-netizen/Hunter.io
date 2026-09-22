import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { gsap } from "../lib/gsap";

const STRENGTH = 0.35;
const MAX_OFFSET = 14;

/**
 * A few px of pull toward the cursor on hover, spring-back on leave —
 * attach the returned ref to a CTA. Skipped under reduced motion and on
 * coarse pointers (touch has no hover to chase, so the listeners would just
 * be dead weight).
 */
export function useMagneticHover<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const clamp = gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET);
    const xTo = gsap.quickTo(node, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(node, "y", { duration: 0.5, ease: "power3" });

    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      xTo(clamp((e.clientX - (rect.left + rect.width / 2)) * STRENGTH));
      yTo(clamp((e.clientY - (rect.top + rect.height / 2)) * STRENGTH));
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion]);

  return ref;
}
