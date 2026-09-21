import { describe, expect, it } from "vitest";
import { subscriberCatalog } from "@/test/apiFixtures";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import { deadlineTone, groupByMonth, isUrgent, upcomingDeadlines } from "./calendar";

const make = (id: string, deadline: string, daysLeft: number, score = 70, bandKey: "strong" | "relevant" = "relevant"): ScoredOpportunity =>
  ({ id, deadline, daysLeft, score, band: { key: bandKey, label: bandKey } }) as ScoredOpportunity;

describe("groupByMonth", () => {
  const items = [make("c", "2026-11-05", 60), make("a", "2026-10-30", 20), make("b", "2026-10-01", 5), make("d", "2027-01-15", 130)];

  it("groups by deadline month, oldest month first", () => {
    expect(groupByMonth(items).map((m) => m.key)).toEqual(["2026-10", "2026-11", "2027-01"]);
  });

  it("orders each month's deadlines soonest first", () => {
    expect(groupByMonth(items)[0].items.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("counts deadlines within 14 days as urgent", () => {
    expect(groupByMonth(items)[0].urgent).toBe(1);
    expect(groupByMonth(items)[1].urgent).toBe(0);
  });

  it("puts 1 October in October whatever the timezone (no Date parsing)", () => {
    const [m] = groupByMonth([make("x", "2026-10-01", 30)]);
    expect([m.year, m.month]).toEqual([2026, 10]);
  });

  it("groups the real scored catalog without dropping any call", () => {
    const rows = subscriberCatalog().opportunities.filter((r) => !r.blocked);
    expect(groupByMonth(rows).reduce((n, m) => n + m.items.length, 0)).toBe(rows.length);
  });
});

describe("upcomingDeadlines / deadlineTone", () => {
  it("takes the soonest N", () => {
    const items = [make("c", "2026-11-05", 60), make("a", "2026-10-30", 20), make("b", "2026-10-01", 5)];
    expect(upcomingDeadlines(items, 2).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("marks urgent, strong and ordinary rows", () => {
    expect(deadlineTone(make("u", "x", 10, 95, "strong"))).toBe("amber");
    expect(deadlineTone(make("s", "x", 60, 90, "strong"))).toBe("green");
    expect(deadlineTone(make("o", "x", 60, 72))).toBe("gold");
  });

  it("is urgent at exactly 14 days but not at 15, and never when the server sent no day count", () => {
    expect(isUrgent(make("a", "x", 14))).toBe(true);
    expect(isUrgent(make("a", "x", 15))).toBe(false);
    expect(isUrgent({ ...make("a", "x", 1), daysLeft: null })).toBe(false);
  });
});
