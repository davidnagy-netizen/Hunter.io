import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/hooks/useFormat";
import type { AdminActivityEntry } from "../types/admin.types";
import "../i18n";

/**
 * A newest-first activity list. Across all accounts (`showUser`) each line
 * says whose it is; on one account's page that would be noise.
 */
export function ActivityFeed({ entries, showUser = false, empty }: { entries: AdminActivityEntry[]; showUser?: boolean; empty: string }) {
  const { t } = useTranslation("admin");
  const { dateTime } = useFormat();

  if (entries.length === 0) return <p className="text-sm text-muted">{empty}</p>;

  return (
    <ul className="flex flex-col divide-y divide-line text-sm">
      {entries.map((entry, index) => {
        const detail = entry.title ?? entry.q ?? entry.field;
        return (
          <li key={`${entry.at}-${entry.type}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
            <span className="w-36 shrink-0 text-xs text-muted">{dateTime(entry.at)}</span>
            {showUser && entry.username ? <b className="font-medium text-text">{entry.username}</b> : null}
            <span className="min-w-0 text-muted">
              {t(`activity.${entry.type}`, { defaultValue: entry.type })}
              {detail ? <span className="text-text"> — {detail}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
