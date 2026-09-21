import type { ScoreBandKey } from "../types/scoring.types";

/** Design-token colors per score band (the engine's own `color` field uses the legacy app's CSS variable names). */
export const BAND_COLOR: Record<ScoreBandKey, string> = {
  strong: "var(--color-green)",
  relevant: "var(--color-gold-deep)",
  conditional: "var(--color-amber)",
  low: "var(--color-slate)",
};
