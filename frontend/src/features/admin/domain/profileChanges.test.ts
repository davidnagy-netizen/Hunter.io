import { describe, expect, it } from "vitest";
import { describeValue, type ChangeFormatters } from "./profileChanges";

const fmt: ChangeFormatters = { huf: (n) => `${n / 1e6}M`, goalLabel: (id) => `goal:${id}`, yes: "Yes", no: "No" };

describe("describeValue", () => {
  it("collapses empty values to a dash", () => {
    expect(describeValue("employees", null, fmt)).toBe("—");
    expect(describeValue("employees", undefined, fmt)).toBe("—");
    expect(describeValue("county", "", fmt)).toBe("—");
    expect(describeValue("goals", [], fmt)).toBe("—");
  });

  it("names goals instead of showing their ids", () => {
    expect(describeValue("goals", ["a", "b"], fmt)).toBe("goal:a, goal:b");
  });

  it("does not treat other lists as goals", () => {
    expect(describeValue("funding_pref", ["non_refundable"], fmt)).toBe("non_refundable");
  });

  it("shows flags as yes / no, including false", () => {
    expect(describeValue("consortium_ready", true, fmt)).toBe("Yes");
    expect(describeValue("consortium_ready", false, fmt)).toBe("No");
  });

  it("formats the project value as money", () => {
    expect(describeValue("investment_value", 30_000_000, fmt)).toBe("30M");
  });

  it("leaves a plain number a plain number, including zero", () => {
    expect(describeValue("employees", 45, fmt)).toBe("45");
    expect(describeValue("employees", 0, fmt)).toBe("0");
  });
});
