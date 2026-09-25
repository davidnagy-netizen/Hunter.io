import { describe, expect, it } from "vitest";
import type { Industry, Region } from "@/types/reference.types";
import { QUESTIONS, buildDraft, buildScoringProfile, isAnswered } from "./questions";
import { readinessBand, readinessScore } from "./readiness";

const REF = {
  regions: [
    { code: "HU11", name: "Budapest", counties: ["Budapest"] },
    { code: "HU12", name: "Pest megye", counties: ["Pest"] },
  ] as Region[],
  industries: [{ id: "manuf", label: "Gyártás", teaor: "28" }] as Industry[],
};
const FULL = { employees: 30, county: "Pest", industryId: "manuf", closed_business_years: 4, goals: ["ai"], investment_value: 25e6 };

describe("readinessScore (ported unchanged from the legacy funnel)", () => {
  const base = { employees: 3, closed_business_years: 0, goals: [], investment_value: 1e6, region: "HU11" };

  it("starts at 40 with nothing going for it", () => {
    expect(readinessScore(base)).toBe(40);
  });

  it.each([
    ["5+ employees", { employees: 5 }, 52],
    ["16+ employees", { employees: 16 }, 58],
    ["1 closed year", { closed_business_years: 1 }, 50],
    ["2+ closed years", { closed_business_years: 2 }, 58],
    ["any goal", { goals: ["ai"] }, 50],
    ["10M+ investment", { investment_value: 10e6 }, 48],
    ["outside Budapest", { region: "HU12" }, 46],
  ])("adds the documented points for %s", (_label, patch, expected) => {
    expect(readinessScore({ ...base, ...patch })).toBe(expected);
  });

  it("is capped at 97 (the uncapped maximum is 100, so the cap really applies)", () => {
    const best = { employees: 200, closed_business_years: 9, goals: ["ai"], investment_value: 1e9, region: "HU12" };
    expect(40 + 12 + 6 + 10 + 8 + 10 + 8 + 6).toBe(100);
    expect(readinessScore(best)).toBe(97);
  });

  it("bands at 80 and 60", () => {
    expect(readinessBand(80)).toBe("strong");
    expect(readinessBand(79)).toBe("good");
    expect(readinessBand(60)).toBe("good");
    expect(readinessBand(59)).toBe("early");
  });

  it("does not depend on eligibility: a strong score says nothing about how many calls qualify", () => {
    // Documents the known limitation rather than hiding it.
    expect(readinessScore({ employees: 120, closed_business_years: 4, goals: ["defence"], investment_value: 180e6, region: "HU12" })).toBeGreaterThanOrEqual(80);
  });
});

describe("questions", () => {
  it("has the six questions in the legacy order", () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual(["employees", "county", "industryId", "closed_business_years", "goals", "investment_value"]);
  });

  it("stores '2 or more closed years' as 4, matching the onboarding wizard's chip", () => {
    const q = QUESTIONS.find((x) => x.id === "closed_business_years");
    expect(q?.kind === "single" && q.options.map((o) => o.value)).toEqual([0, 1, 4]);
  });

  it("treats an empty goals list, or an unset field, as unanswered — but 0 as answered", () => {
    const [employees, , , closedYears, goals] = QUESTIONS;
    expect(isAnswered(goals, { goals: [] })).toBe(false);
    expect(isAnswered(goals, { goals: ["ai"] })).toBe(true);
    expect(isAnswered(employees, {})).toBe(false);
    expect(isAnswered(closedYears, { closed_business_years: 0 })).toBe(true);
  });
});

describe("buildDraft", () => {
  it("carries only what the visitor answered, with derived region, teaor and org type", () => {
    expect(buildDraft(FULL, REF)).toEqual({
      country: "HU", employees: 30, county: "Pest", region: "HU12", industryId: "manuf", teaor: "28",
      closed_business_years: 4, goals: ["ai"], investment_value: 25e6, orgType: "sme",
    });
  });

  it("invents nothing for unanswered questions (no company name, no revenue band)", () => {
    const draft = buildDraft({ employees: 300 }, REF);
    expect(draft).toEqual({ country: "HU", employees: 300, orgType: "large" });
    expect(draft).not.toHaveProperty("company");
    expect(draft).not.toHaveProperty("revBand");
  });
});

describe("buildScoringProfile", () => {
  it("fills gaps with neutral defaults so the server always gets a whole profile", () => {
    const profile = buildScoringProfile({}, REF);
    expect(profile).toMatchObject({ employees: 10, county: "Pest", region: "HU12", industryId: "services", teaor: "70", investment_value: 25e6, orgType: "sme" });
  });

  it("uses the real answers when given", () => {
    expect(buildScoringProfile(FULL, REF)).toMatchObject({ employees: 30, teaor: "28", closed_business_years: 4, goals: ["ai"] });
  });
});
