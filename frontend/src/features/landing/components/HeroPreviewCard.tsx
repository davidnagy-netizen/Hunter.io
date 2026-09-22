import { useTranslation } from "react-i18next";
import { CheckBadge, CircularProgress, WarnBadge } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { BRAND } from "@/shared/brand";
import "../i18n";

/**
 * A mockup of the product doing its job — a real scored match, worked out
 * for a representative company, not a stock photo or an illustration. This
 * is the hero's actual argument for "why it's valuable", so it carries real
 * visual weight rather than sitting as a decorative floating card over an
 * image.
 */
export function HeroPreviewCard() {
  const { t } = useTranslation("landing");
  const { date } = useFormat();
  return (
    <div className="w-72 bg-surface p-4 text-text shadow-card-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted">{t("preview.program")}</div>
          <h3 className="font-display text-base font-semibold">{t("preview.title")}</h3>
        </div>
        <CircularProgress value={87} size={58} strokeWidth={6} color="var(--color-gold)" aria-label={`${BRAND.name} Score 87`}>
          <span className="font-display text-sm font-semibold">87</span>
        </CircularProgress>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        <li className="flex gap-2">
          <CheckBadge />
          <span>
            <b>{t("preview.pass")}</b> <span className="text-muted">{t("preview.passYours")}</span>
          </span>
        </li>
        <li className="flex gap-2">
          <WarnBadge />
          <span>
            <b>{t("preview.warn")}</b> <span className="text-muted">{t("preview.warnYours")}</span>
          </span>
        </li>
      </ul>
      <div className="mt-3 flex justify-between border-t border-line pt-2 text-xs text-muted">
        <span>
          {t("preview.funding")} <b className="text-text">{t("preview.fundingValue")}</b>
        </span>
        <span>
          {t("preview.deadline")} <b className="text-text">{date(t("preview.deadlineDate"))}</b>
        </span>
      </div>
    </div>
  );
}
