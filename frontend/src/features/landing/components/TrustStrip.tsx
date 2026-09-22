import { useTranslation } from "react-i18next";
import "../i18n";

/**
 * Sources, promoted out of the hero's small print into their own visible
 * row directly under the fold — credibility a visitor sees without
 * scrolling, not two lines of grey text tucked under the buttons. Kept
 * deliberately short; `Sources` further down the page carries the full
 * explanation and the same underlying list.
 *
 * Sits inside the hero's own dark chapter (no background of its own) — a
 * separate boxed strip would put a hard seam right under the hero.
 */
export function TrustStrip() {
  const { t } = useTranslation("landing");
  return (
    <p className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-6 pt-10 font-mono text-[11px] tracking-[-0.01em] text-white/45">
      <span className="font-semibold uppercase text-white/70">{t("trustStrip.label")}</span>
      {t("trustStrip.names")}
    </p>
  );
}
