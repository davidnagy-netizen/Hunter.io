import { useTranslation } from "react-i18next";

/** The loading / failure line for a screen driven by one query. Renders nothing once data is there. */
export function QueryStatus({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  const { t } = useTranslation("common");
  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
        {t("loadFailed", { message })}
      </p>
    );
  }
  return isLoading ? <p className="text-sm text-muted">{t("loading")}</p> : null;
}
