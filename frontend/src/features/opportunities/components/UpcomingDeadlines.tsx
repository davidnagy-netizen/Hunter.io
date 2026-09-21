import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowIcon } from "@/shared/components";
import { DeadlineRow } from "./DeadlineRow";
import { upcomingDeadlines } from "../domain/calendar";
import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";
import "../i18n";

/** The dashboard's short list of what closes next, with a way into the full calendar. */
export function UpcomingDeadlines({ relevant }: { relevant: RankedOpportunity[] }) {
  const { t } = useTranslation("opportunities");
  const next = upcomingDeadlines(relevant, 4);
  if (!next.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{t("dashboard.upcoming")}</h2>
        <Link to="/app/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-gold-deep">
          {t("dashboard.fullCalendar")} <ArrowIcon />
        </Link>
      </div>
      <ul className="rounded-lg border border-line bg-surface p-1 shadow-card">
        {next.map((item) => (
          <DeadlineRow key={item.opp.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
