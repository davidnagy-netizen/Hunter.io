import { describe, expect, it } from "vitest";
import { CHART, barRows, funnelRows, trendBars } from "./insights";

describe("barRows", () => {
  it("scales every row against the biggest", () => {
    expect(barRows([["a", 10], ["b", 5], ["c", 0]]).map((r) => r.widthPct)).toEqual([100, 50, 0]);
  });

  it("draws nothing — not a sliver — when everything is zero", () => {
    expect(barRows([["a", 0], ["b", 0]]).map((r) => r.widthPct)).toEqual([0, 0]);
  });
});

describe("funnelRows", () => {
  it("lists leads, registered, trials, subscribers in that order", () => {
    const rows = funnelRows({ leads: 8, registered: 4, trials: 2, subscribers: 1 });
    expect(rows.map((r) => r.key)).toEqual(["leads", "registered", "trials", "subscribers"]);
    expect(rows.map((r) => r.count)).toEqual([8, 4, 2, 1]);
  });
});

describe("trendBars", () => {
  const trend = [
    { key: "2026-07", year: 2026, month: 7, signups: 0, leads: 0, won: 0 },
    { key: "2026-08", year: 2026, month: 8, signups: 2, leads: 2, won: 0 },
    { key: "2026-09", year: 2026, month: 9, signups: 4, leads: 0, won: 1 },
  ];

  it("keeps an empty month's slot but draws no bar in it", () => {
    const [empty] = trendBars(trend);
    expect(empty.total).toBe(0);
    expect(empty.signups.height).toBe(0);
    expect(empty.leads.height).toBe(0);
  });

  it("scales bars against the busiest month, on a shared baseline", () => {
    const [, mid, busy] = trendBars(trend);
    expect(busy.signups.height).toBe(CHART.maxBarHeight);
    expect(mid.signups.height).toBe(Math.round((2 / 4) * CHART.maxBarHeight));
    expect(busy.signups.y + busy.signups.height).toBe(CHART.baseline);
    expect(mid.leads.y + mid.leads.height).toBe(CHART.baseline);
  });

  it("lays the months out left to right across the chart", () => {
    const bars = trendBars(trend);
    expect(bars[0].centerX).toBeLessThan(bars[1].centerX);
    expect(bars[2].centerX).toBeLessThan(CHART.width);
  });

  it("survives no data at all", () => {
    expect(trendBars([])).toEqual([]);
  });
});
