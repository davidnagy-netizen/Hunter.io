import { describe, expect, it } from "vitest";
import { OPPS } from "@engine-src/data/mockGrants.js";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { rankedOpps } from "@/features/scoring/domain/engine";
import type { Opportunity, RankedOpportunity } from "@/features/scoring/types/scoring.types";
import { dashboardStats, splitShortlist } from "./shortlist";

const ranked = rankedOpps(DEMO_PROFILE, OPPS);

describe("splitShortlist", () => {
  it("separates qualifying calls from ruled-out ones", () => {
    const { eligible, blocked } = splitShortlist(ranked);
    expect(eligible.every((r) => !r.res.blocked)).toBe(true);
    expect(blocked.every((r) => r.res.blocked)).toBe(true);
    expect(blocked.some((r) => r.opp.id === "top-site")).toBe(true);
  });

  it("drops prizes and quality labels, which award no money", () => {
    const prize = { ...OPPS[0], id: "prize", awardsFunding: false } as Opportunity;
    const withPrize: RankedOpportunity[] = [...ranked, { opp: prize, res: ranked[0].res }];
    const { eligible, blocked } = splitShortlist(withPrize);
    expect([...eligible, ...blocked].some((r) => r.opp.id === "prize")).toBe(false);
  });
});

describe("dashboardStats", () => {
  it("counts the four dashboard tiles with the legacy thresholds", () => {
    const { eligible } = splitShortlist(ranked);
    const stats = dashboardStats(eligible);
    expect(stats.total).toBe(eligible.length);
    expect(stats.strong).toBe(eligible.filter((r) => (r.res.score ?? 0) >= 85).length);
    expect(stats.closingSoon).toBe(eligible.filter((r) => r.res.elig.days <= 14).length);
    expect(stats.needsAttention).toBeGreaterThan(0);
  });
});
