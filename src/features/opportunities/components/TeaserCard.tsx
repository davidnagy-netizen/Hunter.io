import { useTranslation } from "react-i18next";
import { LockIcon } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { BAND_COLOR } from "@/features/scoring/domain/bandStyle";
import { scoreBand } from "@/features/scoring/domain/engine";
import type { Teaser } from "../types/opportunities.types";
import "../i18n";

/**
 * A locked result. The score and the money are real (the server computed them
 * for this company); what the call *is* was never sent. The bars below are
 * decoration over nothing — there is no hidden text to reveal in the page
 * source, which is the point.
 */
export function TeaserCard({ teaser }: { teaser: Teaser }) {
  const { t } = useTranslation("opportunities");
  const { huf, lang } = useFormat();
  const band = teaser.score !== null ? scoreBand(teaser.score) : null;
  const color = band ? BAND_COLOR[band.key] : "var(--color-muted)";

  const money = teaser.grantHuf ? (
    <>
      {t("teaser.grant")}: <b className="text-text">{huf(teaser.grantHuf)}</b>
    </>
  ) : teaser.fundingMax ? (
    <>
      {t("teaser.ceiling")}: <b className="text-text">{huf(teaser.fundingMax)}</b>
    </>
  ) : (
    t("teaser.notStated")
  );

  return (
    <article className="flex gap-4 rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span className="font-display text-3xl font-semibold" style={{ color }}>
          {teaser.score ?? "—"}
          {teaser.estimated ? <sup className="text-xs">*</sup> : null}
        </span>
        <span className="text-[11px] text-muted">{band ? (lang === "en" ? band.lbl_en : band.lbl_hu) : ""}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="block h-3 w-1/3 rounded bg-line" />
        <span className="mt-2 block h-4 w-4/5 rounded bg-line" />
        <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted">
          <span>{money}</span>
          {teaser.intensity !== null ? <span>{t("teaser.rate", { pct: Math.round(teaser.intensity * 100) })}</span> : null}
          {teaser.closingSoon ? <b className="text-amber">{t("card.closingSoon")}</b> : null}
        </p>
      </div>
      <span className="flex items-start gap-1 text-sm font-medium text-muted">
        <LockIcon /> {t("teaser.unlock")}
      </span>
    </article>
  );
}
