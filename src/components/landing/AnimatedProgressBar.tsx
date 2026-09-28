import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "./lib/gsap";

interface AnimatedProgressBarProps {
  value: number;
  className: string;
  fillClassName?: string;
  ariaLabel?: string;
  duration?: number;
}

export function AnimatedProgressBar({
  value,
  className,
  fillClassName = "bg-brand-orange",
  ariaLabel,
  duration = 1,
}: AnimatedProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!track || !fill) return;
    if (reducedMotion) {
      fill.style.width = `${value}%`;
      return;
    }
    fill.style.width = "0%";
    const ctx = gsap.context(() => {
      gsap.to(fill, {
        width: `${value}%`,
        duration,
        ease: "power3.out",
        scrollTrigger: {
          trigger: track,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    }, track);
    return () => ctx.revert();
  }, [value, duration, reducedMotion]);

  return (
    <div
      ref={trackRef}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={className}
    >
      <div
        ref={fillRef}
        className={["h-full rounded-full", fillClassName].join(" ")}
      />
    </div>
  );
}

export function AnimatedSplitBar({
  segments,
  className,
}: {
  segments: { value: number; className: string }[];
  className: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const track = trackRef.current;
    const fills = fillRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (!track || fills.length === 0) return;
    if (reducedMotion) {
      fills.forEach((fill, i) => {
        fill.style.width = `${segments[i].value}%`;
      });
      return;
    }
    fills.forEach((fill) => {
      fill.style.width = "0%";
    });
    const ctx = gsap.context(() => {
      gsap.to(fills, {
        width: (i: number) => `${segments[i].value}%`,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: track,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    }, track);
    return () => ctx.revert();
  }, [reducedMotion, segments]);

  return (
    <div ref={trackRef} className={className} aria-hidden="true">
      {segments.map((segment, i) => (
        <div
          key={i}
          ref={(el) => {
            fillRefs.current[i] = el;
          }}
          className={["h-full", segment.className].join(" ")}
        />
      ))}
    </div>
  );
}
