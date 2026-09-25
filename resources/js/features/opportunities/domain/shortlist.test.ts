import { describe, expect, it } from "vitest";
import { CALL, subscriberCatalog } from "@/test/apiFixtures";
import { rankScored, splitShortlist } from "./shortlist";

describe("rankScored", () => {
  const rows = subscriberCatalog().opportunities;

  it("puts qualifying calls first, best score first, and blocked calls last", () => {
    const ranked = rankScored([...rows]);
    const firstBlocked = ranked.findIndex((r) => r.blocked);
    expect(firstBlocked).toBeGreaterThan(0);
    expect(ranked.slice(firstBlocked).every((r) => r.blocked)).toBe(true);
    const scores = ranked.slice(0, firstBlocked).map((r) => r.score ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("breaks a tie on score by the sooner deadline", () => {
    const tied = rankScored([...rows]).filter((r) => r.score === 51);
    expect(tied.length).toBeGreaterThan(1);
    expect(tied.map((r) => r.deadline)).toEqual([...tied.map((r) => r.deadline)].sort());
  });

  it("drops a call already past its deadline, and keeps one with no day count", () => {
    const [a, b] = rows;
    expect(rankScored([{ ...a, daysLeft: -1 }, { ...b, daysLeft: null }]).map((r) => r.id)).toEqual([b.id]);
  });
});

describe("splitShortlist", () => {
  const ranked = rankScored([...subscriberCatalog().opportunities]);

  it("leaves prizes and labels (awardsFunding: false) out of the funding shortlist", () => {
    const { eligible, blocked } = splitShortlist(ranked);
    const label = ranked.find((r) => r.awardsFunding === false)!;
    expect(label).toBeDefined();
    expect([...eligible, ...blocked].some((r) => r.id === label.id)).toBe(false);
  });

  it("splits the rest by the server's blocked flag, and agrees with the server's own stats", () => {
    const catalog = subscriberCatalog();
    const { eligible, blocked } = splitShortlist(rankScored([...catalog.opportunities]));
    expect(eligible.length).toBe(catalog.stats.eligible);
    expect(blocked.length).toBe(catalog.stats.blocked);
    expect(blocked.map((r) => r.id)).toContain(CALL.blocked);
  });
});
