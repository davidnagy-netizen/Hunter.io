import { useTranslation } from "react-i18next";
import { Badge, Button, PageHead, Panel, QueryStatus } from "@/shared/components";
import { useLang } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { SubscriptionBadge } from "@/shared/components/SubscriptionBadge";
import { useAdminOverviewQuery, useGrantSubscriptionMutation } from "../api/admin.queries";
import { planLabel } from "../domain/plans";
import type { AuthUser } from "@/shared/types/auth.types";
import { ActivityFeed } from "./ActivityFeed";
import { StatRow, StatTile } from "./StatTile";
import "../i18n";

function Row({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <b className="block truncate text-sm">{title}</b>
        <small className="block truncate text-xs text-muted">{subtitle}</small>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );
}

export function AdminOverviewPage() {
  const { t } = useTranslation("admin");
  const lang = useLang();
  const overview = useAdminOverviewQuery();
  const grant = useGrantSubscriptionMutation();
  const grantError = useTranslatedApiError(grant.error);
  const data = overview.data;

  const quickGrant = (user: AuthUser, planId: string) => grant.mutate({ userId: user.id, planId });

  return (
    <>
      <PageHead title={t("overview.title")}>{t("overview.subtitle")}</PageHead>
      <QueryStatus isLoading={overview.isLoading} error={overview.error} />

      {data ? (
        <div className="flex flex-col gap-6">
          <StatRow>
            <StatTile value={data.stats.users} label={t("overview.stats.users")} />
            <StatTile value={data.stats.activeSubscriptions} label={t("overview.stats.activeSubscriptions")} tone="green" />
            <StatTile value={data.stats.withoutSubscription} label={t("overview.stats.awaitingAccess")} tone="amber" />
            <StatTile value={data.stats.newThisWeek} label={t("overview.stats.newThisWeek")} />
            <StatTile value={data.stats.sessions} label={t("overview.stats.sessions")} />
          </StatRow>

          {grant.isSuccess ? (
            <p role="status" className="rounded-md bg-green-bg p-3 text-sm text-green">
              {t("overview.granted", { name: grant.data.user.username })}
            </p>
          ) : null}
          {grantError ? (
            <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
              {grantError}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t("overview.awaiting.title")} className={data.awaitingAccess.length ? "border-amber" : ""}>
              {data.awaitingAccess.length ? (
                <ul className="divide-y divide-line">
                  {data.awaitingAccess.map((user) => (
                    <Row key={user.id} title={user.username} subtitle={user.company ?? "—"}>
                      <Button size="sm" variant="ghost" disabled={grant.isPending} onClick={() => quickGrant(user, "trial")}>
                        {t("overview.awaiting.trial")}
                      </Button>
                      <Button size="sm" disabled={grant.isPending} onClick={() => quickGrant(user, "monthly")}>
                        {t("overview.awaiting.monthly")}
                      </Button>
                    </Row>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t("overview.awaiting.empty")}</p>
              )}
            </Panel>

            <Panel title={t("overview.expiring.title")} className={data.expiringSoon.length ? "border-amber" : ""}>
              {data.expiringSoon.length ? (
                <ul className="divide-y divide-line">
                  {data.expiringSoon.map((user) => (
                    <Row
                      key={user.id}
                      title={user.username}
                      subtitle={`${planLabel(data.plans, user.subscription.plan, lang)} · ${t("overview.expiring.daysLeft", { count: user.daysLeft })}`}
                    >
                      <Button size="sm" disabled={grant.isPending} onClick={() => quickGrant(user, user.subscription.plan ?? "monthly")}>
                        {t("overview.expiring.extend")}
                      </Button>
                    </Row>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t("overview.expiring.empty")}</p>
              )}
            </Panel>

            <Panel title={t("overview.plans.title")}>
              {Object.keys(data.byPlan).length ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.byPlan).map(([plan, count]) => (
                    <Badge key={plan} tone="gold">
                      {planLabel(data.plans, plan, lang)} <b>{count}</b>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{t("overview.plans.empty")}</p>
              )}
            </Panel>

            <Panel title={t("overview.recentSignups.title")}>
              <ul className="divide-y divide-line">
                {data.recentSignups.map((user) => (
                  <Row key={user.id} title={user.username} subtitle={user.company ?? "—"}>
                    <SubscriptionBadge subscription={user.subscription} />
                  </Row>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title={t("overview.activity.title")} subtitle={t("overview.activity.subtitle")}>
            <ActivityFeed entries={data.activity} showUser empty={t("overview.activity.empty")} />
          </Panel>
        </div>
      ) : null}
    </>
  );
}
