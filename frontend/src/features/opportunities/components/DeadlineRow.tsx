import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useFormat } from "@/shared/hooks/useFormat";
import type { ScoredOpportunity } from "@/shared/types/scoring.types";
import { deadlineTone, isUrgent } from "../domain/calendar";
import "../i18n";

const DOT = { amber: "bg-amber", green: "bg-green", gold: "bg-gold" } as const;

/** One line of the funding calendar: a dot for urgency, the call, and its deadline. */
export function DeadlineRow({ item }: { item: ScoredOpportunity }) {
  const { t } = useTranslation("opportunities");
  const { date } = useFormat();
  const days = item.daysLeft ?? 0;

  return (
    <li>
      <Link
        to={`/app/opportunities/${encodeURIComponent(item.id)}`}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-paper"
      >
        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${DOT[deadlineTone(item)]}`} />
        <span className="min-w-0 flex-1 truncate">
          {item.program} — {item.title}
        </span>
        <span className="shrink-0 text-muted">
          {date(item.deadline)}
          {isUrgent(item) ? <b className="text-amber"> · {t("calendar.days", { n: days })}</b> : null}
        </span>
      </Link>
    </li>
  );
}
