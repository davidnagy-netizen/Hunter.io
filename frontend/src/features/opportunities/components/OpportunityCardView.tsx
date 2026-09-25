import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, ExternalIcon } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { EligibilityBadge } from "@/shared/components/EligibilityBadge";
import { BAND_COLOR } from "@/utils/scoring/bandStyle";
import type { CardModel } from "../domain/cardModel";
import "../i18n";
import { BRAND } from "@/shared/brand";

const CARD = "relative flex gap-4 rounded-lg border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-card-lg";

/**
 * The one card, for a qualifying call and an excluded one alike. The whole
 * card is a link to the detail page (a stretched `<Link>` on the title),
 * while the small "official call" icon stays an independent link above it —
 * nested anchors would be invalid HTML.
 */
export function OpportunityCardView({ model }: { model: CardModel }) {
  const { t } = useTranslation("opportunities");
  const { huf, date } = useFormat();
  const to = `/app/opportunities/${encodeURIComponent(model.id)}`;

  const official = model.sourceUrl ? (
    <a
      href={model.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={t("card.officialCall")}
      aria-label={t("card.officialCall")}
      className="relative z-10 rounded p-1 text-muted hover:text-text"
    >
      <ExternalIcon />
    </a>
  ) : null;

  if (model.blocked) {
    return (
      <article className={`${CARD} opacity-75`}>
        <div className="flex w-14 shrink-0 flex-col items-center text-red">
          <span className="font-display text-2xl">✕</span>
          <span className="text-xs">{t("card.excluded")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{model.program}</p>
          <h3 className="font-display text-base font-semibold text-text">
            <Link to={to} className="after:absolute after:inset-0">
              {model.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-red">{model.exclusionReason || t("card.exclusionFallback")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EligibilityBadge status="NOT_ELIGIBLE" />
          <span className="text-sm font-medium text-gold-deep">{t("card.whyNot")}</span>
          {official}
        </div>
      </article>
    );
  }

  const score = model.score ?? 0;
  const color = model.band ? BAND_COLOR[model.band.key] : "var(--color-muted)";
  const low = model.fundingMin ?? model.fundingMax ?? 0;
  const high = model.fundingMax ?? model.fundingMin ?? 0;
  const range = !(low || high) ? t("card.notPublished") : low === high ? huf(high) : `${huf(low)}–${huf(high)}`;

  return (
    <article className={CARD}>
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span className="font-display text-3xl font-semibold" style={{ color }}>
          {model.score ?? "—"}
        </span>
        <span className="text-[11px] text-muted">{BRAND.name}</span>
        <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
          <span className="block h-full" style={{ width: `${score}%`, background: color }} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{model.program}</p>
        <h3 className="font-display text-base font-semibold text-text">
          <Link to={to} className="after:absolute after:inset-0">
            {model.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>
            {t("card.support")} <b className="text-text">{range}</b>
          </span>
          {model.intensity !== null ? (
            <span>
              {t("card.intensity")} <b className="text-text">{Math.round(model.intensity * 100)}%</b>
            </span>
          ) : null}
          <span>
            {t("card.deadline")} <b className="text-text">{date(model.deadline)}</b>
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {model.daysLeft <= 14 ? (
          <Badge tone="amber">{t("card.closingSoon")}</Badge>
        ) : model.isNew ? (
          <Badge tone="gold">{t("card.new")}</Badge>
        ) : (
          <Badge tone="slate">{t("card.open")}</Badge>
        )}
        {model.verdict ? <EligibilityBadge status={model.verdict} /> : null}
        <span className="text-sm font-medium text-gold-deep">{t("card.why")}</span>
        {official}
      </div>
    </article>
  );
}
