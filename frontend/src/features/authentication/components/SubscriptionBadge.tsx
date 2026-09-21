import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components";
import type { SubscriptionSummary } from "../types/auth.types";
import "../i18n";

/** "Trial · 3 days" / "Active · 28 days" / "No subscription" — the account's access level at a glance. */
export function SubscriptionBadge({ subscription }: { subscription: Pick<SubscriptionSummary, "status" | "active" | "daysLeft"> }) {
  const { t } = useTranslation("authentication");
  const days = subscription.daysLeft;

  if (subscription.status === "trial" && subscription.active) {
    return <Badge tone="amber">{t("subscription.trial", { count: days ?? 0 })}</Badge>;
  }
  if (subscription.active) {
    return <Badge tone="green">{days != null ? t("subscription.activeDays", { count: days }) : t("subscription.active")}</Badge>;
  }
  return <Badge tone="slate">{t("subscription.none")}</Badge>;
}
