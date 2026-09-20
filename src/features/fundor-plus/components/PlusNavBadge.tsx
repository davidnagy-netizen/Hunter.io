import { useTranslation } from "react-i18next";
import { LockIcon } from "@/shared/components";
import { useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import "../i18n";

/** "PLUS" for someone who has access, a lock for someone who doesn't — read from the real entitlements. */
export function PlusNavBadge() {
  const { t } = useTranslation("plus");
  const isSubscriber = useIsSubscriber();
  return isSubscriber ? (
    <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("nav.badge")}</span>
  ) : (
    <LockIcon size={14} />
  );
}
