import type { ReactNode } from "react";

export interface CircularProgressProps {
  /** 0–100. Values outside that range are clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Centered content — e.g. the score number and a unit label. */
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Generic circular progress ring. Purely presentational: it knows nothing
 * about Fundor Score bands or readiness bands — feature code decides the
 * color and the centered content (see features/scoring and
 * features/assessment for the domain-specific wrappers).
 *
 * The fill animates via a CSS transition rather than the legacy app's
 * hand-timed JS animation, and backs off automatically under
 * `prefers-reduced-motion` through the `motion-reduce:transition-none` class.
 */
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 11,
  color = "var(--color-gold)",
  trackColor = "var(--color-line)",
  children,
  className = "",
  "aria-label": ariaLabel,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className={["relative inline-flex items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div> : null}
    </div>
  );
}
