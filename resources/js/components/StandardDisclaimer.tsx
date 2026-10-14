import { useTranslation } from "react-i18next";

/**
 * The brand guidelines' standard disclaimer — Fundor is independent, not a state body, and the score is an estimate.
 * Shown where the NAV data is asked for and on every page with loan information (the landing footer has its own copy).
 */
export function StandardDisclaimer({ className = "" }: { className?: string }) {
  const { t } = useTranslation("common");
  return (
    <p className={["rounded-md border-l-4 border-gold bg-surface px-3 py-2 text-xs text-muted", className].filter(Boolean).join(" ")}>
      {t("standardDisclaimer")}
    </p>
  );
}
