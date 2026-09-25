import { useTranslation } from "react-i18next";
import { Panel } from "@/components";
import { useLang } from "@/composables/useFormat";
import type { Engagement } from "../types/crm.types";
import { EngagementBar } from "./EngagementBar";
import "../i18n";

/** The activity indicator and, row by row, exactly what produced it — so the number is never a black box. */
export function EngagementPanel({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation("crm");
  const lang = useLang();

  return (
    <Panel title={t("engagement.title")} subtitle={t("engagement.subtitle", { days: engagement.window })}>
      <div className="mb-3">
        <EngagementBar engagement={engagement} />
      </div>
      {engagement.signals.length ? (
        <ul className="divide-y divide-line text-sm">
          {engagement.signals.map((signal) => (
            <li key={signal.type} className="flex justify-between gap-3 py-1.5">
              <span className="text-muted">
                {t("engagement.signal", { label: lang === "en" ? signal.label_en : signal.label_hu, count: signal.count })}
              </span>
              <b>+{signal.points}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t("engagement.empty")}</p>
      )}
      {engagement.daysSinceActive != null ? (
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm">
          <span className="text-muted">{t("engagement.lastSeen")}</span>
          <b>{t("engagement.daysAgo", { count: engagement.daysSinceActive })}</b>
        </div>
      ) : null}
    </Panel>
  );
}
