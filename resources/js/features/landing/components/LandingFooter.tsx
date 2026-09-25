import { useTranslation } from "react-i18next";
import "../i18n";

/**
 * `className` lets `LandingPage` override the background/text color — the
 * page root is dark by default (so the sticky header reads correctly at
 * rest), so the footer needs an explicit light override to stay light.
 */
export function LandingFooter({ className }: { className?: string }) {
  const { t } = useTranslation("landing");
  return (
    <footer
      className={[
        "border-t border-line px-6 py-8 text-center font-mono text-[11.5px] tracking-[-0.01em]",
        className ?? "text-muted",
      ].join(" ")}
    >
      {t("footer")}
    </footer>
  );
}
