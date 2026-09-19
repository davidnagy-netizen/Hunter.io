import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import type { SavedCall } from "../types/crm.types";
import "../i18n";

const VISIBLE = 8;

/** What this company set aside — the best guide there is to what to talk about. Shown only when there is something. */
export function SavedCallsPanel({ calls }: { calls: SavedCall[] }) {
  const { t } = useTranslation("crm");
  const { date } = useFormat();
  if (!calls.length) return null;

  return (
    <Panel title={t("saved.title")} subtitle={t("saved.subtitle")}>
      <ul className="divide-y divide-line text-sm">
        {calls.slice(0, VISIBLE).map((call) => (
          <li key={call.id} className="flex justify-between gap-3 py-1.5">
            <span className="min-w-0 truncate">{call.title ?? call.id}</span>
            <b className="shrink-0 font-medium">{call.deadline ? date(call.deadline) : "—"}</b>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
