import { describe, expect, it } from "vitest";
import { OPPS } from "@server-src/data/mockGrants.js";
import { DEMO_PROFILE as SERVER_DEMO_PROFILE } from "@server-src/data/referenceData.js";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { checkRule, evaluateEligibility, explainScore, fundorScore, normalizeProfile, rankedOpps, scoreBand } from "./engine";

const byId = (id: string) => {
  const opp = OPPS.find((o) => o.id === id);
  if (!opp) throw new Error(`fixture ${id} missing`);
  return opp;
};

describe("engine wiring (the server's own engine, run through the frontend build)", () => {
  it("frontend's static DEMO_PROFILE copy has not drifted from the server's", () => {
    expect(DEMO_PROFILE).toEqual(SERVER_DEMO_PROFILE);
  });

  it("evaluates every rule operator", () => {
    expect(checkRule(28, "between", [5, 249])).toBe("pass");
    expect(checkRule("HU11", "not_in", ["HU11"])).toBe("fail");
    expect(checkRule(undefined, "==", true)).toBe("unknown");
    expect(checkRule(["ai"], "includes_any", ["ai", "it"])).toBe("pass");
  });

  it("reproduces the pinned demo-company scores (95 / 87 / 87) and verdicts", () => {
    const szechenyi = fundorScore(byId("szechenyi-tech"), DEMO_PROFILE);
    expect([szechenyi.score, szechenyi.elig.status]).toEqual([95, "CONDITIONAL"]);

    const ginop = fundorScore(byId("ginop-dig"), DEMO_PROFILE);
    expect([ginop.score, ginop.elig.status, ginop.estimated]).toEqual([87, "INSUFFICIENT_DATA", true]);

    const dimop = fundorScore(byId("dimop-ai"), DEMO_PROFILE);
    expect([dimop.score, dimop.elig.status]).toEqual([87, "CONDITIONAL"]);
  });

  it("never scores a NOT_ELIGIBLE call", () => {
    const top = fundorScore(byId("top-site"), DEMO_PROFILE);
    expect(top.blocked).toBe(true);
    expect(top.score).toBeNull();
    expect(top.factors).toBeNull();
  });

  it("resolves an INSUFFICIENT_DATA call from an ad-hoc answer, in both directions", () => {
    const ginop = byId("ginop-dig");
    expect(fundorScore(ginop, DEMO_PROFILE, { "ginop-dig:de_minimis_ok": true }).score).toBe(89);
    expect(fundorScore(ginop, DEMO_PROFILE, { "ginop-dig:de_minimis_ok": false }).elig.status).toBe("NOT_ELIGIBLE");
  });

  it("a bare-field answer resolves every call that asks the same question", () => {
    const withAnswer = OPPS.map((o) => evaluateEligibility(o, DEMO_PROFILE, { de_minimis_ok: true }));
    const without = OPPS.map((o) => evaluateEligibility(o, DEMO_PROFILE));
    const unknownBefore = without.filter((e) => e.checks.some((c) => c.rule.field === "de_minimis_ok" && c.status === "unknown"));
    expect(unknownBefore.length).toBeGreaterThan(0);
    for (const e of withAnswer) {
      expect(e.checks.some((c) => c.rule.field === "de_minimis_ok" && c.status === "unknown")).toBe(false);
    }
  });

  it("ranks eligible calls before blocked ones, highest score first", () => {
    const ranked = rankedOpps(DEMO_PROFILE, OPPS);
    const firstBlocked = ranked.findIndex((r) => r.res.blocked);
    expect(firstBlocked).toBeGreaterThan(0);
    expect(ranked.slice(firstBlocked).every((r) => r.res.blocked)).toBe(true);
    const scores = ranked.slice(0, firstBlocked).map((r) => r.res.score ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("scoreBand follows the documented 85 / 70 / 50 thresholds", () => {
    expect(scoreBand(85).key).toBe("strong");
    expect(scoreBand(84).key).toBe("relevant");
    expect(scoreBand(70).key).toBe("relevant");
    expect(scoreBand(69).key).toBe("conditional");
    expect(scoreBand(50).key).toBe("conditional");
    expect(scoreBand(49).key).toBe("low");
  });

  it("explainScore returns the five weighted factors in both languages", () => {
    const opp = byId("szechenyi-tech");
    const res = fundorScore(opp, DEMO_PROFILE);
    const hu = explainScore(opp, DEMO_PROFILE, res, "hu");
    const en = explainScore(opp, DEMO_PROFILE, res, "en");
    expect(hu.map((f) => f.key)).toEqual(["elig", "fit", "size", "timing", "feas"]);
    expect(hu.reduce((sum, f) => sum + f.weight, 0)).toBeCloseTo(1, 10);
    expect(hu[0].label).not.toBe(en[0].label);
  });

  it("normalizeProfile derives the fields the rules need without overwriting explicit ones", () => {
    const normalized = normalizeProfile({ ...DEMO_PROFILE, orgType: undefined, country: undefined, region: undefined });
    expect(normalized.orgType).toBe("sme");
    expect(normalized.country).toBe("HU");
    expect(normalized.region).toBe("HU12");
    expect(normalizeProfile({ ...DEMO_PROFILE, orgType: "ngo" }).orgType).toBe("ngo");
  });
});
