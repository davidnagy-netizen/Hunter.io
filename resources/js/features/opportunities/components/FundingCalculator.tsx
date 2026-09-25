import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { TextField } from "@/components";
import { useFormat } from "@/composables/useFormat";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import "../i18n";

/**
 * What the company would actually get, as the server worked it out for the
 * project value in its profile. The arithmetic (intensity, ceiling, partner
 * share) lives on the server so it has one definition; changing the project
 * value is done in the profile.
 */
export function FundingCalculator({ opp }: { opp: ScoredOpportunity }) {
  const { t } = useTranslation("opportunities");
  const { huf } = useFormat();
  const calc = opp.calculator;
  if (!calc) return null;

  const hint = opp.partnerShare
    ? t("detail.calculator.hintShare", { max: huf(opp.partnerShare.maxHuf) })
    : opp.fundingMax
      ? t("detail.calculator.hintCeiling", { max: huf(opp.fundingMax) })
      : t("detail.calculator.hintNone");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <TextField label={t("detail.calculator.value")} value={huf(calc.projectValueHuf)} disabled readOnly />
        <TextField label={t("detail.calculator.intensity")} value={`${Math.round(calc.intensity * 100)}%`} disabled readOnly />
        <p className="text-xs text-muted">{hint}</p>
        <p className="text-xs text-muted">
          {t("detail.calculator.fromProfile")}{" "}
          <Link to="/onboarding" className="font-medium text-gold-deep">
            {t("detail.calculator.profileLink")}
          </Link>
        </p>
      </div>
      <dl aria-live="polite" className="flex flex-col justify-center gap-3 rounded-md bg-paper p-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-muted">{t("detail.calculator.expected")}</dt>
          <dd className="font-display text-xl font-semibold text-green">{huf(calc.grantHuf)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-sm text-muted">{t("detail.calculator.own")}</dt>
          <dd className="font-display text-xl font-semibold">{huf(calc.ownContributionHuf)}</dd>
        </div>
      </dl>
    </div>
  );
}
