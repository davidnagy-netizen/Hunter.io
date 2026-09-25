import { useTranslation } from "react-i18next";
import { useLang } from "@/composables/useFormat";
import { CHART, trendBars } from "../domain/insights";
import type { TrendBucket } from "../types/crm.types";
import "../i18n";

/** Sign-ups and leads per month as inline SVG — no chart library, no invented data point. */
export function TrendChart({ trend }: { trend: TrendBucket[] }) {
  const { t } = useTranslation("crm");
  const lang = useLang();
  const bars = trendBars(trend);
  const monthName = (year: number, month: number) => new Date(year, month - 1, 1).toLocaleDateString(lang === "en" ? "en-GB" : "hu-HU", { month: "short" });

  return (
    <>
      <svg viewBox={`0 0 ${CHART.width} 120`} role="img" aria-label={t("insights.trend.aria")} className="w-full max-w-xl">
        {bars.map((bar) => (
          <g key={bar.key}>
            <rect {...bar.signups} rx="2" className="fill-ink-2" />
            <rect {...bar.leads} rx="2" className="fill-gold" />
            <text x={bar.centerX} y="105" textAnchor="middle" fontSize="9" className="fill-muted">
              {monthName(bar.year, bar.month)}
            </text>
            <text x={bar.centerX} y="116" textAnchor="middle" fontSize="9" className="fill-muted">
              {bar.total}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm bg-ink-2" />
          {t("insights.trend.signups")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm bg-gold" />
          {t("insights.trend.leads")}
        </span>
      </div>
    </>
  );
}
