import { useTranslation } from "react-i18next";
import { Button, PageHead, Panel, QueryStatus } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { useAdminOverviewQuery, useRefreshCatalogMutation } from "../api/admin.queries";
import "../i18n";

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <b className="text-right font-medium">{children}</b>
    </div>
  );
}

export function SystemPage() {
  const { t } = useTranslation("admin");
  const { dateTime } = useFormat();
  const overview = useAdminOverviewQuery();
  const refresh = useRefreshCatalogMutation();
  const refreshError = useTranslatedApiError(refresh.error);
  const system = overview.data?.system;
  const status = system?.refresh;

  return (
    <>
      <PageHead title={t("system.title")}>{t("system.subtitle")}</PageHead>
      <QueryStatus isLoading={overview.isLoading} error={overview.error} />

      {system && status ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={t("system.catalog.title")}>
            <Line label={t("system.catalog.total")}>{system.catalogTotal}</Line>
            <Line label={t("system.catalog.open")}>{system.catalogOpen}</Line>
            <Line label={t("system.catalog.builtAt")}>{system.builtAt ? dateTime(system.builtAt) : "—"}</Line>
            <Line label={t("system.catalog.builtBy")}>{system.builtBy || "—"}</Line>
            <Line label={t("system.catalog.eurHuf")}>{system.eurHuf ? `1 EUR = ${system.eurHuf} HUF` : "—"}</Line>
          </Panel>

          <Panel title={t("system.refresh.title")}>
            <Line label={t("system.refresh.status")}>
              <span className={status.enabled ? "text-green" : "text-muted"}>
                {status.enabled ? t("system.refresh.enabled") : t("system.refresh.disabled")}
              </span>
            </Line>
            <Line label={t("system.refresh.interval")}>
              {status.intervalHours ? t("system.refresh.hours", { count: status.intervalHours }) : "—"}
            </Line>
            <Line label={t("system.refresh.lastSuccess")}>{status.lastSuccessAt ? dateTime(status.lastSuccessAt) : "—"}</Line>
            <Line label={t("system.refresh.nextRun")}>{status.nextRunAt ? dateTime(status.nextRunAt) : "—"}</Line>
            <Line label={t("system.refresh.runs")}>
              {status.runs ?? 0} / {status.failures ?? 0}
            </Line>
            {status.lastError ? (
              <p role="alert" className="mt-3 rounded-md bg-red-bg p-3 text-xs text-red">
                {status.lastError.message}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="dark" size="sm" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
                {refresh.isPending ? t("system.refresh.running") : t("system.refresh.now")}
              </Button>
              {refresh.isSuccess ? (
                <span role="status" className="text-xs text-green">
                  {t("system.refresh.done", { count: refresh.data.total })}
                </span>
              ) : null}
              {refreshError ? (
                <span role="alert" className="text-xs text-red">
                  {refreshError}
                </span>
              ) : null}
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
