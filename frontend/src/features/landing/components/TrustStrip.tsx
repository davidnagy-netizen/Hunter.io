import { useTranslation } from "react-i18next";
import "../i18n";

/**
 * Sources, promoted out of the hero's small print into their own visible
 * row directly under the fold — credibility a visitor sees without
 * scrolling, not two lines of grey text tucked under the buttons. Kept
 * deliberately short; `Sources` further down the page carries the full
 * explanation and the same underlying list.
 */
export function TrustStrip() {
  const { t } = useTranslation("landing");
  return (
    <div className="border-b border-line bg-surface-2">
      <p className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-6 py-4 text-xs text-muted">
        <span className="font-medium text-text">{t("trustStrip.label")}</span>
        {t("trustStrip.names")}
      </p>
    </div>
  );
}
