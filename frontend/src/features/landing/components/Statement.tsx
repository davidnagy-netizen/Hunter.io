import { useTranslation } from "react-i18next";
import { GsapReveal } from "./GsapReveal";
import "../i18n";

/**
 * A standalone statement, distilled from `how.items[1]`'s own description —
 * a deliberate change of pace between chapters: no kicker, no card, just
 * type and space, before the page returns to explaining itself.
 */
export function Statement() {
  const { t } = useTranslation("landing");
  return (
    <GsapReveal>
      <section className="mx-auto max-w-2xl px-6 pb-16 pt-24 text-center md:pt-28">
        <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-white/95 md:text-[46px]">
          {t("statement.word1")} <span className="text-gold">{t("statement.word2")}</span> {t("statement.word3")}
        </h2>
        <p className="mx-auto mt-5 max-w-[480px] text-[15.5px] tracking-[-0.011em] text-white/45">{t("statement.sub")}</p>
      </section>
    </GsapReveal>
  );
}
