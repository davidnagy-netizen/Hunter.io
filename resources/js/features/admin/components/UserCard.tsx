import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Button, Panel } from "@/components";
import { useFormat } from "@/composables/useFormat";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { SubscriptionBadge } from "@/features/authentication/components/SubscriptionBadge";
import type { Plan } from "@/features/authentication/types/auth.types";
import { usePatchUserMutation } from "../api/admin.queries";
import type { AdminUser } from "../types/admin.types";
import { GrantForm } from "./GrantForm";
import "../i18n";

export function UserCard({ user, plans }: { user: AdminUser; plans: Plan[] }) {
  const { t } = useTranslation("admin");
  const { dateTime } = useFormat();
  const patch = usePatchUserMutation();
  const patchError = useTranslatedApiError(patch.error);
  const { subscription } = user;
  const isAdmin = user.role === "admin";

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <b className="font-display text-base">{user.username}</b>
            {isAdmin ? <Badge tone="gold">{t("users.adminBadge")}</Badge> : null}
            {user.disabled ? <Badge tone="red">{t("users.disabledBadge")}</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {user.company ?? "—"}
            {user.email ? ` · ${user.email}` : ""}
          </p>
          <p className="text-xs text-muted">
            {t("users.registered")}: {dateTime(user.createdAt)} · {t("users.profileVersions", { count: user.profileVersions })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs text-muted">
          <SubscriptionBadge subscription={subscription} />
          {subscription.validUntil ? (
            <span>
              {t("users.validUntil")}: {dateTime(subscription.validUntil)}
            </span>
          ) : null}
          {subscription.grantedBy ? (
            <span>
              {t("users.grantedBy")}: {subscription.grantedBy}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <GrantForm userId={user.id} plans={plans} canRevoke={subscription.active} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={`/admin/users/${user.id}`}
          className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-text hover:bg-paper"
        >
          {t("users.history")}
        </Link>
        {!isAdmin ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={patch.isPending}
            onClick={() => patch.mutate({ userId: user.id, disabled: !user.disabled })}
          >
            {user.disabled ? t("users.enable") : t("users.disable")}
          </Button>
        ) : null}
        {patchError ? (
          <span role="alert" className="text-xs text-red">
            {patchError}
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
