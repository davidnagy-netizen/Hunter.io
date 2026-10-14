import type { ScoreBandKey } from "../types/scoring.types";

/** Design-token colors per score band (the engine's own `color` field uses the legacy app's CSS variable names). */
export const BAND_COLOR: Record<ScoreBandKey, string> = {
  strong: "var(--color-green)",
  relevant: "var(--color-gold)",
  conditional: "var(--color-amber)",
  low: "var(--color-slate)",
};

/** The same for the score written as text: gold is never text on white (brand guidelines v2.0), so that band reads navy. */
export const BAND_TEXT_COLOR: Record<ScoreBandKey, string> = { ...BAND_COLOR, relevant: "var(--color-ink)" };
