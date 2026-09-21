import { useTranslation } from "react-i18next";
import "../i18n";

/** Loading / failure text shared by the screens that read the catalog. Renders nothing once data is there. */
export function CatalogStatus({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  const { t } = useTranslation("opportunities");
  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return (
      <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
        {t("error", { message })}
      </p>
    );
  }
  return isLoading ? <p className="text-sm text-muted">{t("loading")}</p> : null;
}
