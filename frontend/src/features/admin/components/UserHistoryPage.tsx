import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { BackIcon, PageHead, Panel, QueryStatus } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { SubscriptionBadge } from "@/features/authentication/components/SubscriptionBadge";
import { ProfileSummary } from "@/features/profile/components/ProfileSummary";
import { useAdminUserHistoryQuery } from "../api/admin.queries";
import { ActivityFeed } from "./ActivityFeed";
import { ProfileChanges } from "./ProfileChanges";
import "../i18n";

/** One account's subscription log, profile versions and activity — everything an operator needs to answer "what happened here?". */
export function UserHistoryPage() {
  const { t } = useTranslation("admin");
  const { dateTime } = useFormat();
  const { id = "" } = useParams();
  const history = useAdminUserHistoryQuery(id);
  const errorMessage = useTranslatedApiError(history.error);
  const data = history.data;

  return (
    <>
      <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <BackIcon /> {t("history.back")}
      </Link>

      {errorMessage ? (
        <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
          {errorMessage}
        </p>
      ) : (
        <QueryStatus isLoading={history.isLoading} error={null} />
      )}

      {data ? (
        <div className="flex flex-col gap-4">
          <PageHead title={data.user.username}>{data.user.company ?? "—"}</PageHead>
          <div className="-mt-4">
            <SubscriptionBadge subscription={data.user.subscription} />
          </div>

          <Panel title={t("history.profile.title")}>
            {data.current ? <ProfileSummary profile={data.current} /> : <p className="text-sm text-muted">{t("history.profile.empty")}</p>}
          </Panel>

          <Panel title={t("history.subscriptions.title")}>
            {data.subscriptions.length ? (
              <ul className="flex flex-col divide-y divide-line text-sm">
                {data.subscriptions.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="flex flex-wrap items-baseline gap-x-3 py-2">
                    <span className="w-36 shrink-0 text-xs text-muted">{dateTime(entry.at)}</span>
                    <b className="font-medium">{entry.action === "granted" ? t("history.subscriptions.granted") : t("history.subscriptions.revoked")}</b>
                    <span className="text-muted">
                      {[
                        entry.plan,
                        entry.days ? t("overview.expiring.daysLeft", { count: entry.days }) : "",
                        entry.by ? `${t("history.subscriptions.by")}: ${entry.by}` : "",
                        entry.note ?? "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("history.subscriptions.empty")}</p>
            )}
          </Panel>

          <Panel title={t("history.versions.title")}>
            {data.versions.length ? (
              <ul className="flex flex-col gap-3">
                {data.versions.map((version) => (
                  <li key={version.version} className="rounded-md border border-line p-3">
                    <div className="flex items-center justify-between text-sm">
                      <b>{t("history.versions.version", { count: version.version })}</b>
                      <span className="text-xs text-muted">
                        {dateTime(version.at)}
                        {version.source ? ` · ${version.source}` : ""}
                      </span>
                    </div>
                    {version.changed.length ? <ProfileChanges changes={version.changed} /> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("history.versions.empty")}</p>
            )}
          </Panel>

          <Panel title={t("history.activity.title")}>
            <ActivityFeed entries={data.activity} empty={t("history.activity.empty")} />
          </Panel>
        </div>
      ) : null}
    </>
  );
}
