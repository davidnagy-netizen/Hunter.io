import { describe, expect, it } from "vitest";
import { OPPS } from "@engine-src/data/mockGrants.js";
import { DEMO_PROFILE } from "@/features/profile/data/demoProfile";
import { rankedOpps } from "@/features/scoring/domain/engine";
import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";
import { deadlineTone, groupByMonth, upcomingDeadlines } from "./calendar";

const make = (id: string, deadline: string, days: number, score = 70): RankedOpportunity =>
  ({ opp: { id, deadline } as never, res: { score, elig: { days } } as never });

describe("groupByMonth", () => {
  const items = [make("c", "2026-11-05", 60), make("a", "2026-10-30", 20), make("b", "2026-10-01", 5), make("d", "2027-01-15", 130)];

  it("groups by deadline month, oldest month first", () => {
    expect(groupByMonth(items).map((m) => m.key)).toEqual(["2026-10", "2026-11", "2027-01"]);
  });

  it("orders each month's deadlines soonest first", () => {
    expect(groupByMonth(items)[0].items.map((i) => i.opp.id)).toEqual(["b", "a"]);
  });

  it("counts deadlines within 14 days as urgent", () => {
    expect(groupByMonth(items)[0].urgent).toBe(1);
    expect(groupByMonth(items)[1].urgent).toBe(0);
  });

  it("puts 1 October in October whatever the timezone (no Date parsing)", () => {
    const [m] = groupByMonth([make("x", "2026-10-01", 30)]);
    expect([m.year, m.month]).toEqual([2026, 10]);
  });

  it("groups real ranked calls without dropping any", () => {
    const ranked = rankedOpps(DEMO_PROFILE, OPPS).filter((r) => !r.res.blocked);
    expect(groupByMonth(ranked).reduce((n, m) => n + m.items.length, 0)).toBe(ranked.length);
  });
});

describe("upcomingDeadlines / deadlineTone", () => {
  it("takes the soonest N", () => {
    const items = [make("c", "2026-11-05", 60), make("a", "2026-10-30", 20), make("b", "2026-10-01", 5)];
    expect(upcomingDeadlines(items, 2).map((i) => i.opp.id)).toEqual(["b", "a"]);
  });

  it("marks urgent, strong and ordinary rows", () => {
    expect(deadlineTone(make("u", "x", 10, 95))).toBe("amber");
    expect(deadlineTone(make("s", "x", 60, 90))).toBe("green");
    expect(deadlineTone(make("o", "x", 60, 72))).toBe("gold");
  });
});
