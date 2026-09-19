import { describe, expect, it } from "vitest";
import { formatDate, formatHuf } from "./format";

describe("formatHuf", () => {
  it("uses millions below a billion", () => {
    expect(formatHuf(30_000_000, "en")).toBe("30M HUF");
    expect(formatHuf(30_000_000, "hu")).toBe("30 M Ft");
  });

  it("switches to billions from 1e9, with one decimal", () => {
    expect(formatHuf(1_500_000_000, "en")).toBe("1.5 bn HUF");
    expect(formatHuf(1_500_000_000, "hu")).toMatch(/^1,5 Mrd Ft$/);
  });

  it("rounds to the nearest million", () => {
    expect(formatHuf(2_400_000, "en")).toBe("2M HUF");
    expect(formatHuf(2_600_000, "en")).toBe("3M HUF");
  });
});

describe("formatDate", () => {
  it("formats Hungarian dates without spaces", () => {
    expect(formatDate("2027-01-20", "hu")).toBe("2027.01.20.");
  });

  it("formats English dates with an abbreviated month", () => {
    expect(formatDate("2027-01-20", "en")).toBe("20 Jan 2027");
  });
});
