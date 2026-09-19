import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, ExternalIcon } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { EligibilityBadge } from "@/features/scoring/components/EligibilityBadge";
import { BAND_COLOR } from "@/features/scoring/domain/bandStyle";
import { ruleLabel, scoreBand } from "@/features/scoring/domain/engine";
import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import "../i18n";

const CARD = "relative flex gap-4 rounded-lg border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-card-lg";

/**
 * One card for both a qualifying call and one the engine ruled out — the
 * legacy app had a separate near-identical renderer for each, plus two more
 * for search results and locked teasers (`TeaserCard`).
 *
 * The whole card is a link to the detail page (a stretched `<Link>` on the
 * title), while the small "official call" icon stays an independent link
 * above it — nested anchors would be invalid HTML.
 */
export function OpportunityCard({ item }: { item: RankedOpportunity }) {
  const { opp, res } = item;
  const { t } = useTranslation("opportunities");
  const { huf, date, lang } = useFormat();
  const formatValue = useRuleValueFormatter();
  const to = `/app/opportunities/${encodeURIComponent(opp.id)}`;
  const days = res.elig.days;

  const official = opp.sourceUrl ? (
    <a
      href={opp.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={t("card.officialCall")}
      aria-label={t("card.officialCall")}
      className="relative z-10 rounded p-1 text-muted hover:text-text"
    >
      <ExternalIcon />
    </a>
  ) : null;

  if (res.blocked) {
    const failed = res.elig.checks.find((c) => c.status === "fail");
    return (
      <article className={`${CARD} opacity-75`}>
        <div className="flex w-14 shrink-0 flex-col items-center text-red">
          <span className="font-display text-2xl">✕</span>
          <span className="text-xs">{t("card.excluded")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{opp.program}</p>
          <h3 className="font-display text-base font-semibold text-text">
            <Link to={to} className="after:absolute after:inset-0">
              {opp.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-red">
            {failed ? ruleLabel(failed.rule, lang) : t("card.exclusionFallback")}
            {failed ? <b> ({t("card.yours", { value: formatValue(failed.rule.field, failed.value) })})</b> : null}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EligibilityBadge status="NOT_ELIGIBLE" />
          <span className="text-sm font-medium text-gold-deep">{t("card.whyNot")}</span>
          {official}
        </div>
      </article>
    );
  }

  const score = res.score ?? 0;
  const color = BAND_COLOR[scoreBand(score).key];
  const low = opp.fundingMin ?? opp.fundingMax ?? 0;
  const high = opp.fundingMax ?? opp.fundingMin ?? 0;
  const range = !(low || high) ? t("card.notPublished") : low === high ? huf(high) : `${huf(low)}–${huf(high)}`;

  return (
    <article className={CARD}>
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span className="font-display text-3xl font-semibold" style={{ color }}>
          {score}
        </span>
        <span className="text-[11px] text-muted">Hunter</span>
        <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
          <span className="block h-full" style={{ width: `${score}%`, background: color }} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{opp.program}</p>
        <h3 className="font-display text-base font-semibold text-text">
          <Link to={to} className="after:absolute after:inset-0">
            {opp.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>
            {t("card.support")} <b className="text-text">{range}</b>
          </span>
          <span>
            {t("card.intensity")} <b className="text-text">{Math.round(opp.intensity * 100)}%</b>
          </span>
          <span>
            {t("card.deadline")} <b className="text-text">{date(opp.deadline)}</b>
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {days <= 14 ? (
          <Badge tone="amber">{t("card.closingSoon")}</Badge>
        ) : opp.isNew ? (
          <Badge tone="gold">{t("card.new")}</Badge>
        ) : (
          <Badge tone="slate">{t("card.open")}</Badge>
        )}
        <EligibilityBadge status={res.elig.status} />
        <span className="text-sm font-medium text-gold-deep">{t("card.why")}</span>
        {official}
      </div>
    </article>
  );
}
