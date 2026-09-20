import { describe, expect, it } from "vitest";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import { draftFigures, draftToText } from "./draft";
import { docKey } from "./documents";

const PROFILE = { company: "Kata Kft.", employees: 45, county: "Pest", teaor: "28", investment_value: 60_000_000 } as CompanyProfile;

describe("draftFigures", () => {
  it("splits the project value into grant and own contribution by the call's intensity", () => {
    const f = draftFigures(PROFILE, { intensity: 0.5, goals: ["digitalization"], docs: ["Part A"] });
    expect(f.total).toBe(60_000_000);
    expect(f.grant).toBe(30_000_000);
    expect(f.own).toBe(30_000_000);
    expect(f.intensityPct).toBe(50);
    expect(f.goalIds).toEqual(["digitalization"]);
    expect(f.docs).toEqual(["Part A"]);
  });

  it("carries the company's own details through unchanged", () => {
    const f = draftFigures(PROFILE, { intensity: 0.8, goals: [] });
    expect([f.company, f.employees, f.county, f.teaor]).toEqual(["Kata Kft.", 45, "Pest", "28"]);
  });

  it("leaves the activity code missing rather than printing 'undefined'", () => {
    expect(draftFigures({ ...PROFILE, teaor: undefined }, { intensity: 0.5, goals: [] }).teaor).toBeNull();
    expect(draftFigures({ ...PROFILE, teaor: "" }, { intensity: 0.5, goals: [] }).teaor).toBeNull();
  });

  it("treats a call with no intensity as no grant — never NaN", () => {
    const f = draftFigures(PROFILE, { intensity: 0 as number, goals: [] });
    expect(f.grant).toBe(0);
    expect(f.own).toBe(60_000_000);
    expect(Number.isNaN(f.intensityPct)).toBe(false);
  });

  it("defaults a call's missing lists to empty", () => {
    const f = draftFigures(PROFILE, { intensity: 0.5 } as never);
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
