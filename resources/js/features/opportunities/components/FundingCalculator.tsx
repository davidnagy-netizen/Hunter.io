import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { TextField } from "@/components";
import { useFormat } from "@/composables/useFormat";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import "../i18n";

/**
 * What the company would get for a project value. It starts from the value in
 * the company profile and the visitor can try another amount here, worked out
 * with the server's rule: value × intensity, capped at `ceilingHuf` (the call's
 * ceiling or the partner share). Nothing is saved — the profile stays the
 * place to change the project value for good.
 */
export function FundingCalculator({ opp }: { opp: ScoredOpportunity }) {
  const { t } = useTranslation("opportunities");
  const { huf } = useFormat();
  const calc = opp.calculator;
  const [value, setValue] = useState(calc?.projectValueHuf ?? 0);
  if (!calc) return null;

  const uncapped = value * calc.intensity;
  const grant = calc.ceilingHuf == null ? uncapped : Math.min(uncapped, calc.ceilingHuf);

  const hint = opp.partnerShare
    ? t("detail.calculator.hintShare", { max: huf(opp.partnerShare.maxHuf) })
    : opp.fundingMax
      ? t("detail.calculator.hintCeiling", { max: huf(opp.fundingMax) })
      : t("detail.calculator.hintNone");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <TextField
          label={t("detail.calculator.value")}
          type="number"
          min="0"
          inputMode="numeric"
          value={value || ""}
          onChange={(e) => setValue(Math.max(0, e.target.valueAsNumber || 0))}
        />
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
          <dd className="font-display text-xl font-semibold text-green">{huf(grant)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-sm text-muted">{t("detail.calculator.own")}</dt>
          <dd className="font-display text-xl font-semibold">{huf(value - grant)}</dd>
        </div>
      </dl>
    </div>
  );
}
