import { useTranslation } from "react-i18next";
import { usePrefersReducedMotion } from "@/composables/usePrefersReducedMotion";
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
 *
 * Scrolls continuously rather than sitting as one static line — a plain
 * `overflow-x-auto` row of the same content would either wrap awkwardly on
 * narrow screens or truncate, and this list is only going to grow. Two
 * back-to-back copies of the content, translated exactly -50%, is what
 * makes the loop seamless; reduced motion gets the plain static line
 * instead, once, not the doubled track.
 */
export function TrustStrip() {
  const { t } = useTranslation("landing");
  const reducedMotion = usePrefersReducedMotion();
  const content = (
    <p className="flex shrink-0 items-center gap-2 px-3">
      <span className="font-semibold uppercase text-white/70">{t("trustStrip.label")}</span>
      {t("trustStrip.names")}
    </p>
  );

  if (reducedMotion) {
    return (
      <div className="mx-auto max-w-5xl px-6 pt-10 font-mono text-[11px] tracking-[-0.01em] text-white/45">{content}</div>
    );
  }

  return (
    <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_26s_linear_infinite] font-mono text-[11px] tracking-[-0.01em] text-white/45 hover:[animation-play-state:paused]">
        {content}
        {content}
      </div>
    </div>
  );
}
