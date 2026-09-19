import { useTranslation } from "react-i18next";
import { useLang } from "@/shared/hooks/useFormat";
import type { Engagement } from "../types/crm.types";
import "../i18n";

const BAR: Record<Engagement["band"]["key"], string> = { high: "bg-green", medium: "bg-amber", low: "bg-slate", none: "bg-line-strong" };

/** The 0–100 activity indicator with its band name. It is counted from recorded events, and the tooltip says so. */
export function EngagementBar({ engagement }: { engagement: Engagement }) {
  const { t } = useTranslation("crm");
  const lang = useLang();
  const { band, score } = engagement;

  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted" title={t("engagement.hint", { days: engagement.window })}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <i className={["block h-full", BAR[band.key]].join(" ")} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </span>
      {score} · {lang === "en" ? band.label_en : band.label_hu}
    </span>
  );
}
