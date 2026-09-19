import { useTranslation } from "react-i18next";
import { CircularProgress } from "@/shared/components";
import { scoreBand } from "../domain/engine";
import type { ScoreBandKey } from "../types/scoring.types";
import "../i18n";

/** Design-token colors per score band (the engine's own `color` field uses the legacy app's CSS variable names). */
const BAND_COLOR: Record<ScoreBandKey, string> = {
  strong: "var(--color-green)",
  relevant: "var(--color-gold-deep)",
  conditional: "var(--color-amber)",
  low: "var(--color-slate)",
};

export interface HunterScoreRingProps {
  /** `null` for a blocked (NOT_ELIGIBLE) call — those are never scored. */
  score: number | null;
  /** The verdict is INSUFFICIENT_DATA: the number is an estimate and says so. */
  estimated?: boolean;
  size?: number;
  showBandLabel?: boolean;
}

export function HunterScoreRing({ score, estimated = false, size = 156, showBandLabel = true }: HunterScoreRingProps) {
  const { t, i18n } = useTranslation("scoring");

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          role="img"
          aria-label={t("score.blocked")}
          className="flex items-center justify-center rounded-full bg-red-bg font-display text-red"
          style={{ width: size, height: size, fontSize: size / 3 }}
        >
          ✕
        </div>
        {showBandLabel ? <span className="text-sm font-medium text-red">{t("score.blocked")}</span> : null}
      </div>
    );
  }

  const band = scoreBand(score);
  const color = BAND_COLOR[band.key];

  return (
    <div className="flex flex-col items-center gap-2">
      <CircularProgress
        value={score}
        size={size}
        strokeWidth={Math.round(size / 11)}
        color={color}
        aria-label={t(estimated ? "score.ariaEstimated" : "score.aria", { score })}
      >
        <span className="font-display font-semibold" style={{ color, fontSize: size / 3.2 }}>
          {score}
        </span>
        <span className="text-xs text-muted">{t("score.outOf")}</span>
      </CircularProgress>
      {showBandLabel ? (
        <span className="text-sm font-medium" style={{ color }}>
          {i18n.language === "en" ? band.lbl_en : band.lbl_hu}
          {estimated ? ` · ${t("score.estimated")}` : ""}
        </span>
      ) : null}
    </div>
  );
}
