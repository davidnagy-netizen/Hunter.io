import { describe, expect, it } from "vitest";
import { planLabel } from "./plans";

const PLANS = [{ id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30, status: "active" }];

describe("planLabel", () => {
  it("returns the label in the requested language", () => {
    expect(planLabel(PLANS, "monthly", "en")).toBe("Monthly subscription");
    expect(planLabel(PLANS, "monthly", "hu")).toBe("Havi előfizetés");
  });

  it("falls back to the raw id for a plan that has since been removed", () => {
    expect(planLabel(PLANS, "legacy", "en")).toBe("legacy");
  });

  it("shows a dash when there is no plan", () => {
    expect(planLabel(PLANS, null, "en")).toBe("—");
    expect(planLabel(PLANS, undefined, "en")).toBe("—");
  });
});
