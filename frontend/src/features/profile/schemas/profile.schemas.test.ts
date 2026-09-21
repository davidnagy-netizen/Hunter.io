import { describe, expect, it } from "vitest";
import { companyProfileSchema, STEP_FIELDS } from "./profile.schemas";

const VALID_PROFILE = {
  company: "Alfa Gyártó Kft.",
  employees: 28,
  county: "Pest",
  region: "HU12",
  closed_business_years: 4,
  industryId: "manuf",
  teaor: "28",
  revBand: "500 M–1 Mrd Ft",
  goals: ["digitalization"],
  investment_value: 30e6,
  projectName: "ERP bevezetés",
  funding_pref: ["non_refundable"],
  orgType: "sme" as const,
  consortium_ready: false,
  eu_experience: true,
};

describe("companyProfileSchema", () => {
  it("accepts a fully filled-in profile", () => {
    expect(companyProfileSchema.safeParse(VALID_PROFILE).success).toBe(true);
  });

  it("accepts a profile without the optional fields", () => {
    const { teaor: _teaor, revBand: _revBand, projectName: _projectName, eu_experience: _eu, ...required } = VALID_PROFILE;
    expect(companyProfileSchema.safeParse(required).success).toBe(true);
  });

  it.each([
    ["company", ""],
    ["employees", 0],
    ["employees", -3],
    ["county", ""],
    ["industryId", ""],
    ["goals", []],
    ["investment_value", 0],
    ["orgType", "not-a-real-type"],
  ])("rejects an invalid %s: %j", (field, value) => {
    const result = companyProfileSchema.safeParse({ ...VALID_PROFILE, [field]: value });
    expect(result.success).toBe(false);
  });

  it("requires consortium_ready to be explicitly answered, not just any boolean-ish value", () => {
    const { consortium_ready: _omit, ...withoutConsortium } = VALID_PROFILE;
    expect(companyProfileSchema.safeParse(withoutConsortium).success).toBe(false);
  });
});

describe("STEP_FIELDS", () => {
  it("only references fields that exist on the schema", () => {
    const schemaKeys = new Set(Object.keys(companyProfileSchema.shape));
    for (const fields of Object.values(STEP_FIELDS)) {
      for (const field of fields) {
        expect(schemaKeys.has(field)).toBe(true);
      }
    }
  });
});
