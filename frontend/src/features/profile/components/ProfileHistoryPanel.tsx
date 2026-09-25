import { useTranslation } from "react-i18next";
import { Button, Panel } from "@/shared/components";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { useProfileHistoryQuery, useRestoreProfileMutation } from "@/shared/api/profile.queries";
import "../i18n";

function fmtWhen(iso: string, lang: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(lang === "en" ? "en-GB" : "hu-HU", { year: "numeric", month: "short", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString(lang === "en" ? "en-GB" : "hu-HU", { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Shows what `useCompanyProfile`'s server-sync fix actually produces: every
 * save is a version with a diff, and any version can be restored. Only
 * meaningful for a signed-in account — an anonymous visitor's profile has no
 * history because it never leaves their browser (see `localProfileStore`).
 */
export function ProfileHistoryPanel() {
  const { t, i18n } = useTranslation(["profile"]);
  const isAuthenticated = useIsAuthenticated();
  const history = useProfileHistoryQuery(isAuthenticated);
  const restore = useRestoreProfileMutation();

  if (!isAuthenticated) {
    return (
      <Panel title={t("profile:history.title")}>
        <p className="text-sm text-muted">{t("profile:history.signInRequired")}</p>
      </Panel>
    );
  }

  return (
    <Panel title={t("profile:history.title")} subtitle={t("profile:history.subtitle")}>
      {history.isLoading ? (
        <p className="text-sm text-muted">…</p>
      ) : history.data && history.data.versions.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {history.data.versions.map((v) => (
            <li key={v.version} className="rounded-md border border-line p-3">
              <div className="flex items-center justify-between">
                <b className="text-sm">
                  {t("profile:progress")} {v.version}
                </b>
                <span className="text-xs text-muted">{fmtWhen(v.at, i18n.language)}</span>
              </div>
              {v.changed.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
                  {v.changed.map((c) => (
                    <li key={c.field}>
                      <span className="font-medium text-text">{c.field}</span>: {JSON.stringify(c.from)} →{" "}
                      {JSON.stringify(c.to)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">{t("profile:history.firstSave")}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => restore.mutate(v.version)}
                disabled={restore.isPending}
              >
                {t("profile:actions.restore")}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t("profile:history.empty")}</p>
      )}
    </Panel>
  );
}
