import { useTranslation } from "react-i18next";
import "../i18n";

export function LandingFooter() {
  const { t } = useTranslation("landing");
  return <footer className="border-t border-line px-6 py-8 text-center text-xs text-muted">{t("footer")}</footer>;
}
