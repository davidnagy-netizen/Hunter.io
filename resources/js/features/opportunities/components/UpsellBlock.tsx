import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components";
import { useIsAuthenticated, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import "../i18n";

export function UpsellBlock({ lockedCount }: { lockedCount: number }) {
  const { t } = useTranslation("opportunities");
  const isSubscriber = useIsSubscriber();
  const isAuthenticated = useIsAuthenticated();
  if (isSubscriber || lockedCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-ink p-5 text-white">
      <div className="min-w-56 flex-1">
        <h3 className="font-display text-lg font-semibold">{t("teaser.moreTitle", { n: lockedCount })}</h3>
        <p className="mt-1 text-sm text-white/70">{t("teaser.moreBody")}</p>
      </div>
      {/* Signed-in accounts get no button yet: the account/subscription screen isn't migrated. */}
      {!isAuthenticated ? (
        <Link to="/register">
          <Button variant="gold">{t("teaser.cta")}</Button>
        </Link>
      ) : null}
    </div>
  );
}
