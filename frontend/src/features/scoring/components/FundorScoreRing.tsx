import { useTranslation } from "react-i18next";
import { CircularProgress } from "@/shared/components";
import { BAND_COLOR } from "../domain/bandStyle";
import type { ScoreBand } from "../types/scoring.types";
import "../i18n";

export interface FundorScoreRingProps {
  /** `null` for a blocked (NOT_ELIGIBLE) call — those are never scored. */
  score: number | null;
  /** The server's band for the score: colour and label. */
  band?: ScoreBand | null;
  /** The verdict is INSUFFICIENT_DATA: the number is an estimate and says so. */
  estimated?: boolean;
  size?: number;
  showBandLabel?: boolean;
}

export function FundorScoreRing({ score, band = null, estimated = false, size = 156, showBandLabel = true }: FundorScoreRingProps) {
  const { t } = useTranslation("scoring");

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

  const color = band ? BAND_COLOR[band.key] : "var(--color-muted)";

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
          {band?.label}
          {estimated ? ` · ${t("score.estimated")}` : ""}
        </span>
      ) : null}
    </div>
  );
}
