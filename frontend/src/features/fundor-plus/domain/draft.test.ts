import { describe, expect, it } from "vitest";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import { draftFigures, draftToText } from "./draft";
import { docKey } from "./documents";

const PROFILE = { company: "Kata Kft.", employees: 45, county: "Pest", teaor: "28", investment_value: 60_000_000 } as CompanyProfile;

/** What the server's calculator says for this company: 60 M project at 50 %. */
const CALC = { projectValueHuf: 60_000_000, intensity: 0.5, grantHuf: 30_000_000, ownContributionHuf: 30_000_000, cappedByCeiling: false, ceilingHuf: null };

describe("draftFigures", () => {
  it("takes grant and own contribution from the server's calculation, not from arithmetic of its own", () => {
    const f = draftFigures(PROFILE, { intensity: 0.5, goals: ["digitalization"], docs: ["Part A"], calculator: { ...CALC, grantHuf: 12_345_678, ownContributionHuf: 47_654_322 } });
    expect(f.grant).toBe(12_345_678);
    expect(f.own).toBe(47_654_322);
  });

  it("carries the call's goals, documents and intensity through", () => {
    const f = draftFigures(PROFILE, { intensity: 0.5, goals: ["digitalization"], docs: ["Part A"], calculator: CALC });
    expect(f.total).toBe(60_000_000);
    expect(f.grant).toBe(30_000_000);
    expect(f.own).toBe(30_000_000);
    expect(f.intensityPct).toBe(50);
    expect(f.goalIds).toEqual(["digitalization"]);
    expect(f.docs).toEqual(["Part A"]);
  });

  it("carries the company's own details through unchanged", () => {
    const f = draftFigures(PROFILE, { intensity: 0.8, goals: [], docs: [], calculator: CALC });
    expect([f.company, f.employees, f.county, f.teaor]).toEqual(["Kata Kft.", 45, "Pest", "28"]);
  });

  it("leaves the activity code missing rather than printing 'undefined'", () => {
    expect(draftFigures({ ...PROFILE, teaor: undefined }, { intensity: 0.5, goals: [], docs: [], calculator: CALC }).teaor).toBeNull();
    expect(draftFigures({ ...PROFILE, teaor: "" }, { intensity: 0.5, goals: [], docs: [], calculator: CALC }).teaor).toBeNull();
  });

  it("treats a call with no intensity as no grant — never NaN", () => {
    const f = draftFigures(PROFILE, { intensity: 0, goals: [], docs: [], calculator: { ...CALC, intensity: 0, grantHuf: 0, ownContributionHuf: 60_000_000 } });
    expect(f.grant).toBe(0);
    expect(f.own).toBe(60_000_000);
    expect(Number.isNaN(f.intensityPct)).toBe(false);
  });

  it("defaults a call's missing lists to empty", () => {
    const f = draftFigures(PROFILE, { intensity: 0.5, calculator: CALC } as never);
    expect(f.goalIds).toEqual([]);
    expect(f.docs).toEqual([]);
  });
});

describe("draftToText", () => {
  it("puts the notice first, then each chapter's title over its body", () => {
    expect(draftToText("NOTICE", [{ title: "1. A", body: "aaa" }, { title: "2. B", body: "bbb" }])).toBe("NOTICE\n\n1. A\naaa\n\n2. B\nbbb");
  });
});

describe("docKey", () => {
  it("is stable per document text, so reordering the list doesn't move a tick", () => {
    expect(docKey("c1", "Part A")).toBe(docKey("c1", "Part A"));
    expect(docKey("c1", "Part A")).not.toBe(docKey("c1", "Part B"));
    expect(docKey("c1", "Part A")).not.toBe(docKey("c2", "Part A"));
  });
});
