import { describe, expect, it } from "vitest";
import { calculateGrant } from "./calculator";

describe("calculateGrant", () => {
  it("multiplies project value by intensity", () => {
    const r = calculateGrant({ intensity: 0.8 }, 30_000_000);
    expect(r.grantHuf).toBe(24_000_000);
    expect(r.ownContributionHuf).toBe(6_000_000);
    expect(r.cappedByCeiling).toBe(false);
    expect(r.ceilingHuf).toBeNull();
  });

  it("caps at the call's funding ceiling", () => {
    const r = calculateGrant({ intensity: 0.8, fundingMax: 10_000_000 }, 30_000_000);
    expect(r.grantHuf).toBe(10_000_000);
    expect(r.ownContributionHuf).toBe(20_000_000);
    expect(r.cappedByCeiling).toBe(true);
  });

  it("on a consortium call, caps at the partner's own share rather than the whole-project grant", () => {
    const r = calculateGrant(
      { intensity: 0.7, fundingMax: 1_913_362_500, partnerShare: { minHuf: 1, typicalHuf: 2, maxHuf: 20_000_000 } },
      100_000_000,
    );
    expect(r.ceilingHuf).toBe(20_000_000);
    expect(r.grantHuf).toBe(20_000_000);
    expect(r.cappedByCeiling).toBe(true);
  });

  it("never reports a negative own contribution", () => {
    expect(calculateGrant({ intensity: 1 }, 5_000_000).ownContributionHuf).toBe(0);
  });

  it("handles a zero project value", () => {
    expect(calculateGrant({ intensity: 0.5 }, 0).grantHuf).toBe(0);
  });
});
