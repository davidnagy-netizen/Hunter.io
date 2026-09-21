import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import type { CrmContact, VocabEntry } from "../types/crm.types";
import { ContactLink } from "./ContactLink";
import { EngagementBar } from "./EngagementBar";
import { LifecycleBadge } from "./LifecycleBadge";
import { StageSelect } from "./StageSelect";
import "../i18n";

export interface ContactCardProps {
  contact: CrmContact;
  stages: VocabEntry[];
  lifecycleLabel: string;
  onMove: (stage: string) => void;
}

/**
 * One deal on the board. Draggable with a mouse; the dropdown is the route
 * that also works by keyboard and on a touch screen, where drag-and-drop
 * isn't reliable.
 */
export function ContactCard({ contact, stages, lifecycleLabel, onMove }: ContactCardProps) {
  const { t } = useTranslation("crm");
  const { date } = useFormat();
  const [dragging, setDragging] = useState(false);
  const next = contact.nextTask;
  const late = contact.overdueTasks > 0;

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", contact.id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={[
        "flex cursor-grab flex-col gap-2 rounded-md border border-line bg-surface p-3 text-sm shadow-card",
        dragging ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <ContactLink id={contact.id} className="block truncate font-medium text-text hover:underline">
          {contact.company || contact.username || contact.email || "—"}
        </ContactLink>
        <span className="block truncate text-xs text-muted">{contact.username || contact.contactName || contact.email || "—"}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LifecycleBadge lifecycle={contact.lifecycle} label={lifecycleLabel} />
        {contact.kind === "account" ? (
          <EngagementBar engagement={contact.engagement} />
        ) : contact.readiness != null ? (
          <span className="text-xs text-muted">{t("card.assessment", { score: contact.readiness })}</span>
        ) : null}
      </div>

      {contact.tags.length > 0 || contact.daysInStage != null ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {contact.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-slate-bg px-1.5 py-0.5 text-slate">
              {tag}
            </span>
          ))}
          {contact.daysInStage != null ? <span className="text-muted">{t("card.daysInStage", { count: contact.daysInStage })}</span> : null}
        </div>
      ) : null}

      {next ? (
        <div className={["flex items-start gap-1.5 text-xs", late ? "text-red" : "text-muted"].join(" ")}>
          <CalendarIcon size={14} />
          <span>
            {next.title}
            {next.dueAt ? ` · ${date(next.dueAt)}` : ""}
          </span>
        </div>
      ) : null}

      <StageSelect value={contact.stage} stages={stages} onChange={onMove} />
    </div>
  );
}
