import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import { URGENT_DAYS } from "./shortlist";

export interface CalendarMonth {
  /** `YYYY-MM`, sortable. */
  key: string;
  year: number;
  /** 1–12. */
  month: number;
  items: ScoredOpportunity[];
  /** Deadlines within 14 days. */
  urgent: number;
}

/** Within {@link URGENT_DAYS} of the deadline, by the server's clock. */
export const isUrgent = (item: ScoredOpportunity) => item.daysLeft !== null && item.daysLeft <= URGENT_DAYS;

const byDeadline = (a: ScoredOpportunity, b: ScoredOpportunity) => a.deadline.localeCompare(b.deadline);

/**
 * Groups calls by the month of their deadline, oldest month first, soonest
 * deadline first within a month. Reads the month straight off the ISO date
 * string rather than through `Date`, so a browser timezone can't push a
 * 1 October deadline into September.
 */
export function groupByMonth(items: ScoredOpportunity[]): CalendarMonth[] {
  const months = new Map<string, CalendarMonth>();
  for (const item of items) {
    const key = item.deadline.slice(0, 7);
    let month = months.get(key);
    if (!month) {
      month = { key, year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), items: [], urgent: 0 };
      months.set(key, month);
    }
    month.items.push(item);
    if (isUrgent(item)) month.urgent += 1;
  }
  return [...months.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({ ...m, items: [...m.items].sort(byDeadline) }));
}

/** The next few deadlines, soonest first. */
export function upcomingDeadlines(items: ScoredOpportunity[], count: number): ScoredOpportunity[] {
  return [...items].sort(byDeadline).slice(0, count);
}

/** Dot color for a calendar row: urgent beats strong beats ordinary. */
export function deadlineTone(item: ScoredOpportunity): "amber" | "green" | "gold" {
  if (isUrgent(item)) return "amber";
  return item.band?.key === "strong" ? "green" : "gold";
}
