import type { PortfolioMetrics, TrendBucket } from "../types/crm.types";

export interface BarRow {
  key: string;
  count: number;
  /** 0–100, relative to the largest row. */
  widthPct: number;
}

/** Bars for a list of counts, each as a share of the biggest — never a made-up minimum, so an empty row is an empty bar. */
export function barRows(entries: [string, number][]): BarRow[] {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return entries.map(([key, count]) => ({ key, count, widthPct: Math.round((count / max) * 100) }));
}

/** The acquisition funnel, top to bottom, from the counts the server produced. */
export function funnelRows(m: Pick<PortfolioMetrics, "leads" | "registered" | "trials" | "subscribers">): BarRow[] {
  return barRows([
    ["leads", m.leads],
    ["registered", m.registered],
    ["trials", m.trials],
    ["subscribers", m.subscribers],
  ]);
}

export interface TrendBar {
  key: string;
  year: number;
  month: number;
  total: number;
  signups: { x: number; y: number; width: number; height: number };
  leads: { x: number; y: number; width: number; height: number };
  centerX: number;
}

export const CHART = { width: 360, baseline: 90, maxBarHeight: 74 } as const;

/**
 * Bar geometry for the monthly chart, in SVG units. Each month gets two bars
 * (sign-ups, leads) scaled against the busiest month; an empty month keeps its
 * slot and draws no bar, because a gap is information.
 */
export function trendBars(trend: TrendBucket[]): TrendBar[] {
  const busiest = Math.max(1, ...trend.map((b) => Math.max(b.signups + b.leads, 1)));
  const slot = CHART.width / Math.max(1, trend.length);
  const pad = slot * 0.24;
  const barWidth = (slot - pad * 2) / 2;
  const height = (n: number) => Math.round((n / busiest) * CHART.maxBarHeight);

  return trend.map((b, i) => {
    const x = i * slot;
    const sh = height(b.signups);
    const lh = height(b.leads);
    return {
      key: b.key,
      year: b.year,
      month: b.month,
      total: b.signups + b.leads,
      signups: { x: x + pad, y: CHART.baseline - sh, width: barWidth, height: sh },
      leads: { x: x + pad + barWidth, y: CHART.baseline - lh, width: barWidth, height: lh },
      centerX: x + slot / 2,
    };
  });
}
