import { useTranslation } from "react-i18next";
import { Panel, QueryStatus } from "@/components/index";
import { useFormat } from "@/composables/useFormat";
import { useCrmBoardQuery } from "@/features/crm/api/crm.queries";
import { barRows, funnelRows } from "@/features/crm/domain/insights";
import { useVocabLabels } from "@/features/crm/hooks/useVocabLabels";
import { BarList } from "@/features/crm/components/BarList";
import { ContactLink } from "@/features/crm/components/ContactLink";
import { KpiTile } from "@/features/crm/components/KpiTile";
import { TrendChart } from "@/features/crm/components/TrendChart";
import "@/features/crm/i18n/index";

/** The portfolio in numbers. Every figure is counted from recorded events; where there is nothing to measure it says so rather than draw zero. */
export function InsightsPage() {
  const { t } = useTranslation("crm");
  const { moneyOrDash } = useFormat();
  const board = useCrmBoardQuery();
  const data = board.data;
  const labels = useVocabLabels(data?.vocabulary);

  if (!data) return <QueryStatus isLoading={board.isLoading} error={board.error} />;

  const m = data.metrics;
  const stageRows = barRows(data.vocabulary.stages.map((s): [string, number] => [s.id, m.byStage[s.id] ?? 0]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile tone="green" value={moneyOrDash(m.mrrHuf)} label={t("insights.kpi.mrr.label")} sub={m.mrrHuf == null ? t("insights.kpi.unknown") : t("insights.kpi.mrr.sub")} />
        <KpiTile value={moneyOrDash(m.arrHuf)} label={t("insights.kpi.arr.label")} sub={t("insights.kpi.arr.sub")} />
        <KpiTile
          value={m.subscribers ? moneyOrDash(m.arpaHuf) : "—"}
          label={t("insights.kpi.arpa.label")}
          sub={t("insights.kpi.arpa.sub", { count: m.subscribers })}
        />
        <KpiTile
          tone="amber"
          value={m.trialConversionPct != null ? `${m.trialConversionPct}%` : "—"}
          label={t("insights.kpi.conversion.label")}
          sub={m.trialConversionPct != null ? t("insights.kpi.conversion.sub", { done: m.trialConverted, started: m.trialStarted }) : t("insights.kpi.conversion.none")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t("insights.funnel.title")}>
          <BarList rows={funnelRows(m)} label={(row) => t(`insights.funnel.${row.key}`)} />
        </Panel>

        <Panel title={t("insights.stages")}>
          <BarList rows={stageRows} label={(row) => labels.stage(row.key)} />
        </Panel>

        <Panel title={t("insights.revenueByPlan")}>
          {Object.keys(m.byPlan).length ? (
            <ul className="divide-y divide-line text-sm">
              {Object.entries(m.byPlan).map(([plan, x]) => (
                <li key={plan} className="flex justify-between gap-3 py-1.5">
                  <span className="text-muted">
                    {labels.plan(plan)} · {x.count}
                  </span>
                  <b className="font-medium">{moneyOrDash(x.monthlyHuf)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("insights.noPlans")}</p>
          )}
        </Panel>

        <Panel title={t("insights.sources")}>
          {Object.keys(m.bySource).length ? (
            <ul className="divide-y divide-line text-sm">
              {Object.entries(m.bySource).map(([source, count]) => (
                <li key={source} className="flex justify-between gap-3 py-1.5">
                  <span className="text-muted">{labels.source(source)}</span>
                  <b className="font-medium">{count}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("insights.noSources")}</p>
          )}
        </Panel>
      </div>

      <Panel title={t("insights.trend.title")} subtitle={t("insights.trend.subtitle")}>
        <TrendChart trend={data.trend} />
      </Panel>

      <Panel title={t("insights.warm.title")} subtitle={t("insights.warm.subtitle", { days: data.engagementWindowDays })}>
        {m.warmUnsubscribed.length ? (
          <ul className="divide-y divide-line">
            {m.warmUnsubscribed.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <b className="block truncate text-sm">{w.company || w.username || "—"}</b>
                  <span className="block truncate text-xs text-muted">
                    {labels.lifecycle(w.lifecycle)} · {t("insights.warm.detail", { score: w.score })}
                    {w.daysSinceActive != null ? ` · ${t("insights.warm.lastSeen", { count: w.daysSinceActive })}` : ""}
                  </span>
                </div>
                <ContactLink id={w.id} className="shrink-0 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-paper">
                  {t("contacts.open")}
                </ContactLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("insights.warm.empty")}</p>
        )}
      </Panel>
    </div>
  );
}
