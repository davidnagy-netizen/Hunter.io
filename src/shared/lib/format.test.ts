import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatHuf, formatMoney, formatMonth } from "./format";

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

describe("formatMonth", () => {
  it("names the month in each language, independent of timezone", () => {
    expect(formatMonth(2026, 10, "en")).toBe("October 2026");
    expect(formatMonth(2026, 10, "hu")).toBe("2026. október");
    expect(formatMonth(2027, 1, "en")).toBe("January 2027");
  });
});

describe("formatDateTime", () => {
  // No `Z`: parsed as local time, so the wall-clock digits are the same in any timezone.
  it("appends the time to the date, in each language's order", () => {
    expect(formatDateTime("2026-09-19T15:31:00", "en")).toMatch(/19 Sep\w* 2026.*15:31/);
    expect(formatDateTime("2026-09-19T15:31:00", "hu")).toMatch(/2026\. szept\. 19\.\s*15:31/);
  });
});

describe("formatMoney", () => {
  it("writes the whole amount, not millions", () => {
    expect(formatMoney(5990, "en")).toBe("5,990 HUF");
    expect(formatMoney(71880, "hu").replace(/\s/g, "")).toBe("71880Ft");
  });

  it("rounds to a whole forint and handles zero", () => {
    expect(formatMoney(5990.6, "en")).toBe("5,991 HUF");
    expect(formatMoney(0, "en")).toBe("0 HUF");
  });
});
