import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckBadge, CircularProgress, WarnBadge } from "@/components";
import { useFormat } from "@/composables/useFormat";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
import { BRAND } from "@/brand";
import "../i18n";

const TARGET_SCORE = 87;
const BASE_TILT = "rotate(-1.4deg)";

/**
 * A mockup of the product doing its job — a real scored match, worked out
 * for a representative company, not a stock photo or an illustration. This
 * is the hero's actual argument for "why it's valuable", so it carries real
 * visual weight and a small resting tilt (considered, not perfectly
 * gridded) rather than sitting as a decorative floating card.
 *
 * The ring draws itself in on mount (via `CircularProgress`'s own transition)
 * instead of appearing static, the one time this mounts.
 */
export function HeroPreviewCard({ className = "" }: { className?: string }) {
  const { t } = useTranslation("landing");
  const { date } = useFormat();
  const reducedMotion = usePrefersReducedMotion();
  const [score, setScore] = useState(reducedMotion ? TARGET_SCORE : 0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(() => setScore(TARGET_SCORE), 400);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || reducedMotion) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) ${BASE_TILT} rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
  };
  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = BASE_TILT;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform: reducedMotion ? undefined : BASE_TILT }}
      className={["w-72 bg-surface p-5 text-text shadow-[0_36px_80px_-32px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[-0.02em] text-muted">{t("preview.program")}</div>
          <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em]">{t("preview.title")}</h3>
        </div>
        <CircularProgress value={score} size={56} strokeWidth={7} color="var(--color-gold)" aria-label={`${BRAND.name} Score ${score}`}>
          <span className="font-display text-lg font-bold tracking-[-0.02em] tabular-nums">{score}</span>
        </CircularProgress>
      </div>
      <div className="mt-4 h-px bg-line" />
      <ul className="mt-4 flex flex-col gap-2.5 text-[13.5px] tracking-[-0.011em]">
        <li className="flex gap-2.5">
          <CheckBadge />
          <span>
            <b>{t("preview.pass")}</b> <span className="text-muted">{t("preview.passYours")}</span>
          </span>
        </li>
        <li className="flex gap-2.5">
          <WarnBadge />
          <span>
            <b>{t("preview.warn")}</b> <span className="text-muted">{t("preview.warnYours")}</span>
          </span>
        </li>
      </ul>
      <div className="mt-4 flex justify-between border-t border-line pt-3 font-mono text-[11.5px] tracking-[-0.02em] text-muted">
        <span>{t("preview.fundingValue")}</span>
        <span>{date(t("preview.deadlineDate"))}</span>
      </div>
    </div>
  );
}
