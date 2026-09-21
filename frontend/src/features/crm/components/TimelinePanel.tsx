import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { ProfileChanges } from "@/features/admin/components/ProfileChanges";
import { useActivityLabel } from "@/features/admin/hooks/useActivityLabel";
import { timelineDetail, timelineLabel } from "../domain/timeline";
import type { TimelineEntry } from "../types/crm.types";
import "../i18n";

const VISIBLE = 40;

/** Everything that happened, newest first: what the company did, what we granted, how their profile changed, what we wrote down. */
export function TimelinePanel({ entries }: { entries: TimelineEntry[] }) {
  const { t } = useTranslation("crm");
  const { dateTime, date } = useFormat();
  const activityLabel = useActivityLabel();

  const label = (entry: TimelineEntry) => {
    const l = timelineLabel(entry);
    if (l.kind === "note") return t("timeline.noteLogged", { kind: t(`notes.kinds.${l.noteKind}`, { defaultValue: l.noteKind }) });
    if (l.kind === "own") return t(`timeline.${l.key}`);
    return activityLabel(l.type);
  };

  const detail = (entry: TimelineEntry) => {
    const d = timelineDetail(entry);
    switch (d.kind) {
      case "text":
        return d.text;
      case "due":
        return t("timeline.due", { date: date(d.dueAt) });
      case "grant":
        return [d.parts.plan, d.parts.days ? t("timeline.days", { count: d.parts.days }) : "", d.parts.by ? t("timeline.by", { name: d.parts.by }) : "", d.parts.note]
          .filter(Boolean)
          .join(" · ");
      case "profile":
        return d.changed.length ? null : t("timeline.firstSave");
      default:
        return "";
    }
  };

  return (
    <Panel title={t("timeline.title")} subtitle={t("timeline.subtitle")}>
      {entries.length ? (
        <ol className="flex flex-col gap-3 border-l border-line pl-4">
          {entries.slice(0, VISIBLE).map((entry, index) => {
            const more = detail(entry);
            const d = timelineDetail(entry);
            return (
              <li key={`${entry.at}-${entry.type}-${index}`} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-gold" aria-hidden="true" />
                <div className="text-xs text-muted">{dateTime(entry.at)}</div>
                <div className="text-sm font-medium">{label(entry)}</div>
                {more ? <div className="text-xs text-muted">{more}</div> : null}
                {d.kind === "profile" && d.changed.length ? <ProfileChanges changes={d.changed.slice(0, 3)} /> : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted">{t("timeline.empty")}</p>
      )}
    </Panel>
  );
}
