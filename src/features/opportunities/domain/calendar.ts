import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";

export interface CalendarMonth {
  /** `YYYY-MM`, sortable. */
  key: string;
  year: number;
  /** 1–12. */
  month: number;
  items: RankedOpportunity[];
  /** Deadlines within 14 days. */
  urgent: number;
}

const byDeadline = (a: RankedOpportunity, b: RankedOpportunity) => a.opp.deadline.localeCompare(b.opp.deadline);

/**
 * Groups calls by the month of their deadline, oldest month first, soonest
 * deadline first within a month. Reads the month straight off the ISO date
 * string rather than through `Date`, so a browser timezone can't push a
 * 1 October deadline into September.
 */
export function groupByMonth(items: RankedOpportunity[]): CalendarMonth[] {
  const months = new Map<string, CalendarMonth>();
  for (const item of items) {
    const key = item.opp.deadline.slice(0, 7);
    let month = months.get(key);
    if (!month) {
      month = { key, year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), items: [], urgent: 0 };
      months.set(key, month);
    }
    month.items.push(item);
    if (item.res.elig.days <= 14) month.urgent += 1;
  }
  return [...months.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({ ...m, items: [...m.items].sort(byDeadline) }));
}

/** The next few deadlines, soonest first. */
export function upcomingDeadlines(items: RankedOpportunity[], count: number): RankedOpportunity[] {
  return [...items].sort(byDeadline).slice(0, count);
}

/** Dot color for a calendar row: urgent beats strong beats ordinary. */
export function deadlineTone(item: RankedOpportunity): "amber" | "green" | "gold" {
  if (item.res.elig.days <= 14) return "amber";
  return (item.res.score ?? 0) >= 85 ? "green" : "gold";
}
